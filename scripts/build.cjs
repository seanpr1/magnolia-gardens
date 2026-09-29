#!/usr/bin/env node
'use strict';
// Small static renderer: existing HTML remains the authoring source.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIRS = ['assets', 'areas', 'services', 'estimate', 'apply', 'hiring', 'quote'];
const PUBLIC_FILES = new Set(['index.html', '404.html', 'robots.txt', 'sitemap.xml', 'llms.txt', 'CNAME', 'site.webmanifest']);
const ASSET_TYPES = new Set(['.html', '.css', '.js', '.json', '.webmanifest', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.ico', '.woff', '.woff2', '.txt', '.xml']);
const CONTACT_KEYS = ['phoneDisplay', 'phoneE164', 'phoneParenthesized', 'phoneSchema', 'telHref', 'smsHref', 'email', 'ownerEmail', 'hiringEmail'];

function readConfig(root = ROOT) {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'config/site.json'), 'utf8'));
  for (const key of CONTACT_KEYS) {
    const value = config.contact && config.contact[key];
    // These values appear in both HTML and JSON-LD string contexts.
    if (typeof value !== 'string' || !value || value.length > 160 || /[<>"'&\\\r\n\u2028\u2029]/.test(value)) {
      throw new Error('Invalid plain-text contact value: ' + key);
    }
  }
  if (!/^\+[1-9]\d{7,14}$/.test(config.contact.phoneE164)) throw new Error('phoneE164 must include the country code');
  if (!/^tel:\+?[\d-]+$/.test(config.contact.telHref) || !/^sms:\+?[\d-]+$/.test(config.contact.smsHref)) throw new Error('Contact links must use tel: and sms:');
  const number = config.contact.phoneE164.replace(/\D/g, '');
  for (const key of ['phoneDisplay', 'phoneParenthesized', 'phoneSchema', 'telHref', 'smsHref']) {
    const digits = config.contact[key].replace(/\D/g, '');
    if (digits !== number && '1' + digits !== number) throw new Error('Contact phone formats disagree: ' + key);
  }
  for (const key of ['formspree', 'zapierMirror']) {
    const value = config.forms && config.forms[key];
    if (typeof value !== 'string' || !/^https:\/\/[a-z0-9.-]+\/[a-zA-Z0-9/_-]+$/.test(value)) throw new Error('Invalid HTTPS form endpoint: ' + key);
  }
  if (!Number.isInteger(config.forms.timeoutMs) || config.forms.timeoutMs < 1000 || config.forms.timeoutMs > 60000) throw new Error('Invalid form timeout');
  if (!Array.isArray(config.analytics?.productionHosts) || !config.analytics.productionHosts.length || config.analytics.productionHosts.some(host => typeof host !== 'string' || !/^[a-z0-9.-]+$/.test(host))) throw new Error('Invalid production host list');
  return config;
}

function render(text, config, filename = 'source') {
  const result = text.replace(/\{\{(contact|forms|brand)\.([A-Za-z]+)\}\}/g, (_, section, key) => {
    if (!(section === 'contact' ? CONTACT_KEYS.includes(key) : section === 'brand' ? key === 'primary' : ['formspree', 'zapierMirror'].includes(key))) throw new Error('Unknown site placeholder in ' + filename + ': ' + section + '.' + key);
    return config[section][key];
  });
  if (/\{\{[^}]+\}\}/.test(result)) throw new Error('Unresolved placeholder in ' + filename);
  return result;
}

function versionAssets(html, out) {
  return html.replace(/\b(src|href)=(['"])(\/assets\/[^?'"#\s]+\.(?:js|css))(?:\?[^'"#]*)?\2/g, (_, attribute, quote, asset) => {
    const target = path.join(out, asset.slice(1));
    if (!fs.existsSync(target)) throw new Error('Missing public asset: ' + asset);
    const digest = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex').slice(0, 12);
    return attribute + '=' + quote + asset + '?v=' + digest + quote;
  });
}

function publicFiles(root = ROOT) {
  const files = [];
  function walk(relative) {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.')) continue;
      const name = path.posix.join(relative, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Public source must not contain symlinks: ' + name);
      if (entry.isDirectory()) walk(name);
      else if (ASSET_TYPES.has(path.extname(entry.name))) files.push(name);
    }
  }
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile() && (PUBLIC_FILES.has(entry.name) || /^(?:favicon[^/]*|apple-touch-icon|og-image)\.(?:png|svg|ico)$/.test(entry.name))) files.push(entry.name);
  }
  for (const dir of PUBLIC_DIRS) if (fs.existsSync(path.join(root, dir))) walk(dir);
  return files.sort();
}

function git(root, args) {
  try { return cp.execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10000 }).trim(); }
  catch (_) { return null; }
}

function identity(root = ROOT, env = process.env) {
  const candidate = env.COMMIT_REF || env.CF_PAGES_COMMIT_SHA || git(root, ['rev-parse', 'HEAD']);
  const revision = /^[a-f0-9]{40,64}$/i.test(candidate) ? candidate : null;
  // Cloudflare's production branch is main (see the verified release record).
  const context = env.CONTEXT || (env.CF_PAGES ? (env.CF_PAGES_BRANCH === 'main' ? 'production' : 'branch-deploy') : 'local');
  if (context !== 'local' && !revision) throw new Error('Hosted build requires a verified commit reference');
  const status = git(root, ['status', '--porcelain', '--untracked-files=normal']);
  return {
    schemaVersion: 1,
    revision,
    sourceDate: revision ? git(root, ['show', '-s', '--format=%cI', revision]) || null : null,
    context,
    provider: env.CF_PAGES ? 'cloudflare-pages' : env.NETLIFY || env.CONTEXT ? 'netlify' : 'local',
    branch: env.CF_PAGES_BRANCH || env.BRANCH || git(root, ['branch', '--show-current']) || null,
    deployId: env.DEPLOY_ID || null,
    deploymentUrl: env.CF_PAGES_URL || env.DEPLOY_URL || null,
    workingTreeDirty: status === null ? null : !!status
  };
}

function build({ root = ROOT, out = path.join(ROOT, 'dist'), env = process.env, config = readConfig(root) } = {}) {
  if (path.resolve(out) === path.resolve(root) || path.resolve(root).startsWith(path.resolve(out) + path.sep)) throw new Error('Output cannot overwrite source');
  const files = publicFiles(root);
  const brandCSS = fs.readFileSync(path.join(root, 'assets/brand.css'), 'utf8');
  const primary = brandCSS.match(/--gold\s*:\s*(#[a-fA-F0-9]{6})\s*[;}]/)?.[1];
  if (!primary) throw new Error('assets/brand.css must define --gold as a six-digit hex color');
  const placeholders = { ...config, brand: { primary } };
  const version = identity(root, env);
  // Render beside the output so failed validation leaves the last build intact.
  // Both renames stay on the same filesystem; retain a backup if restoration fails.
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const staging = fs.mkdtempSync(path.join(path.dirname(out), '.site-build-'));
  const next = path.join(staging, 'next');
  const previous = path.join(staging, 'previous');
  let retainBackup = false;
  try {
    fs.mkdirSync(next);
    for (const file of files) {
      const destination = path.join(next, file);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      if (['.html', '.txt', '.xml', '.webmanifest'].includes(path.extname(file))) fs.writeFileSync(destination, render(fs.readFileSync(path.join(root, file), 'utf8'), placeholders, file));
      else fs.copyFileSync(path.join(root, file), destination);
    }
    fs.mkdirSync(path.join(next, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(next, 'assets/site-config.js'), '/* Generated from config/site.json. Do not edit. */\nwindow.MG_SITE_CONFIG = ' + JSON.stringify(config, null, 2).replace(/</g, '\\u003c') + ';\n');
    for (const file of files.filter(file => file.endsWith('.html'))) {
      const destination = path.join(next, file);
      fs.writeFileSync(destination, versionAssets(fs.readFileSync(destination, 'utf8'), next));
    }
    fs.writeFileSync(path.join(next, 'version.json'), JSON.stringify(version, null, 2) + '\n');
    fs.writeFileSync(path.join(next, '_headers'), '/version.json\n  Cache-Control: no-store\n');
    const hadOutput = fs.existsSync(out);
    if (hadOutput) fs.renameSync(out, previous);
    try { fs.renameSync(next, out); }
    catch (error) {
      if (hadOutput) {
        try { fs.renameSync(previous, out); }
        catch (restoreError) {
          retainBackup = true;
          throw new AggregateError([error, restoreError], 'Build swap failed; previous output retained at ' + previous);
        }
      }
      throw error;
    }
  } finally {
    if (!retainBackup) fs.rmSync(staging, { recursive: true, force: true });
  }
  return { files: files.length + 3, version };
}

module.exports = { build, identity, publicFiles, readConfig, render, versionAssets };
if (require.main === module) {
  const result = build();
  console.log('Built ' + result.files + ' public files in dist/ (' + result.version.context + ', ' + (result.version.revision || 'unversioned') + (result.version.workingTreeDirty === null ? ', working tree unverified' : result.version.workingTreeDirty ? ', local changes' : '') + ').');
}
