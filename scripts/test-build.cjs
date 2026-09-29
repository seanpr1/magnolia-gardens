#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { build, identity, publicFiles, readConfig, render } = require('./build.cjs');
const root = path.resolve(__dirname, '..');
const config = readConfig(root);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'magnolia-build-'));
function snapshot(directory) {
  return fs.readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => path.relative(directory, path.join(entry.parentPath, entry.name)))
    .sort().map(file => [file, fs.readFileSync(path.join(directory, file)).toString('base64')]);
}
try {
  const fixture = path.join(temp, 'source');
  fs.mkdirSync(path.join(fixture, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(fixture, 'index.html'), '<link href="/assets/brand.css?v=old"><script src="/assets/site-config.js"></script><a href="{{contact.telHref}}">{{contact.phoneDisplay}}</a><script type="application/ld+json">{"telephone":"{{contact.phoneSchema}}"}</script>');
  fs.writeFileSync(path.join(fixture, 'assets/brand.css'), ':root{--gold:#005343}');
  for (const excluded of ['docs', 'scripts', 'node_modules', 'config']) {
    fs.mkdirSync(path.join(fixture, excluded));
    fs.writeFileSync(path.join(fixture, excluded, 'private.html'), 'MUST NOT SHIP');
  }
  fs.writeFileSync(path.join(fixture, 'README.md'), 'MUST NOT SHIP');
  const altered = structuredClone(config);
  Object.assign(altered.contact, { phoneDisplay: '423-555-0100', phoneE164: '+14235550100', phoneParenthesized: '(423) 555-0100', phoneSchema: '+1-423-555-0100', telHref: 'tel:4235550100', smsHref: 'sms:+14235550100' });
  const out = path.join(temp, 'public');
  const options = { root: fixture, out, config: altered, env: {} };
  build(options);
  assert.deepEqual(fs.readdirSync(out).sort(), ['_headers', 'assets', 'index.html', 'version.json']);
  const page = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
  assert.match(page, /href="tel:4235550100">423-555-0100/);
  assert.match(page, /"telephone":"\+1-423-555-0100"/);
  assert.doesNotMatch(page, /\{\{|423-390-9954/);
  assert.match(page, /href="\/assets\/brand\.css\?v=[a-f0-9]{12}"/);
  assert.match(page, /src="\/assets\/site-config\.js\?v=[a-f0-9]{12}"/);
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(out, 'assets/site-config.js'), 'utf8'), context);
  assert.equal(context.window.MG_SITE_CONFIG.contact.phoneDisplay, altered.contact.phoneDisplay);
  const before = fs.readFileSync(path.join(out, 'version.json'), 'utf8');
  build(options);
  assert.equal(fs.readFileSync(path.join(out, 'version.json'), 'utf8'), before);
  assert.equal(fs.readFileSync(path.join(out, 'index.html'), 'utf8'), page);
  fs.writeFileSync(path.join(fixture, 'assets/brand.css'), ':root{--gold:#00402F}');
  build(options);
  assert.notEqual(fs.readFileSync(path.join(out, 'index.html'), 'utf8').match(/brand\.css\?v=([a-f0-9]+)/)[1], page.match(/brand\.css\?v=([a-f0-9]+)/)[1]);
  const completedBuild = snapshot(out);
  const sourcePage = fs.readFileSync(path.join(fixture, 'index.html'), 'utf8');
  for (const [brokenSource, expectedError] of [
    [sourcePage + '{{contact.notAKey}}', /Unknown site placeholder/],
    [sourcePage + '<script src="/assets/missing.js"></script>', /Missing public asset/]
  ]) {
    fs.writeFileSync(path.join(fixture, 'index.html'), brokenSource);
    assert.throws(() => build(options), expectedError);
    assert.deepEqual(snapshot(out), completedBuild, 'failed build must preserve every previous output byte');
    assert.equal(fs.readdirSync(temp).some(name => name.startsWith('.site-build-')), false);
  }
  fs.writeFileSync(path.join(fixture, 'index.html'), sourcePage);
  fs.writeFileSync(path.join(out, 'obsolete.txt'), 'must disappear after a successful build');
  build(options);
  assert.deepEqual(snapshot(out), completedBuild, 'successful build replaces obsolete files');
  assert.throws(() => render('{{contact.notAKey}}', config), /Unknown/);
  assert.throws(() => render('{{typo.phoneDisplay}}', config), /Unresolved/);
  fs.writeFileSync(path.join(fixture, 'config/site.json'), JSON.stringify({ ...config, contact: { ...config.contact, phoneDisplay: '423-555-0199' } }));
  assert.throws(() => readConfig(fixture), /phone formats disagree/);
  assert.throws(() => build({ ...options, out: fixture }), /overwrite/);
  const marker = identity(fixture, { CONTEXT: 'deploy-preview', COMMIT_REF: 'a'.repeat(40), DEPLOY_ID: 'example-deploy' });
  assert.equal(marker.revision, 'a'.repeat(40));
  assert.equal(marker.context, 'deploy-preview');
  assert.equal(marker.deployId, 'example-deploy');
  const cloudflare = identity(fixture, { CF_PAGES: '1', CF_PAGES_COMMIT_SHA: 'b'.repeat(40), CF_PAGES_BRANCH: 'preview-example', CF_PAGES_URL: 'https://example.magnolia-gardens.pages.dev' });
  assert.equal(cloudflare.revision, 'b'.repeat(40));
  assert.equal(cloudflare.provider, 'cloudflare-pages');
  assert.equal(cloudflare.context, 'branch-deploy');
  assert.equal(cloudflare.deployId, null);
  assert.equal(cloudflare.deploymentUrl, 'https://example.magnolia-gardens.pages.dev');
  assert.throws(() => identity(fixture, { CONTEXT: 'production', COMMIT_REF: 'not-a-sha' }), /verified commit/);
  const published = publicFiles(root);
  assert.ok(published.includes('estimate/index.html') && published.includes('quote/sw.js'));
  assert.equal(published.some(file => /^(docs|scripts|node_modules|config)\//.test(file)), false);
  console.log('PASS: deterministic static build, failed-build preservation, contact rendering, deployment allowlist and release identity.');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
