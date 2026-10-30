#!/usr/bin/env node
'use strict';
// Rendered document and ordered startup with mocked providers/transport only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = process.env.SITE_ROOT || path.resolve(__dirname, '../dist');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const pause = () => new Promise(resolve => setTimeout(resolve, 30));
let checks = 0;
async function scenario(host, withEdgeBeacon = false) {
  let payload, sends = 0;
  const providers = [], beaconTokens = [], errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => { if (error.type !== 'css-parsing') errors.push(error.message); });
  const dom = new JSDOM(html, {
    url: 'https://' + host + '/?utm_source=loading_regression&utm_campaign=fall',
    runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: console,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {} });
      w.HTMLElement.prototype.scrollIntoView = () => {};
      w.fetch = async (url, options) => {
        sends++; payload = options.body;
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
      };
    }
  });
  try {
    const w = dom.window;
    // Model hosting-owned markup without downloading/executing its provider.
    const edgeBeacon = withEdgeBeacon ? w.document.createElement('script') : null;
    if (edgeBeacon) {
      edgeBeacon.src = 'https://static.cloudflareinsights.com/beacon.min.js/versioned-edge';
      edgeBeacon.setAttribute('data-cf-beacon', '{"token":"edge-test-token","r":1}');
      w.document.body.appendChild(edgeBeacon);
    }
    // Emulate external script insertion without fetching or executing vendors.
    for (const method of ['appendChild', 'insertBefore']) {
      const original = w.Node.prototype[method];
      w.Node.prototype[method] = function (node, ...args) {
        if (node.tagName === 'SCRIPT' && node.src && new URL(node.src).hostname !== host) {
          providers.push(node.src);
          if (node.hasAttribute('data-cf-beacon')) beaconTokens.push(JSON.parse(node.getAttribute('data-cf-beacon')).token);
          return node;
        }
        return original.call(this, node, ...args);
      };
    }
    for (const script of w.document.head.querySelectorAll('script[src]')) assert.equal(script.defer, true, script.src);
    assert.ok(w.document.querySelector('p.hero-sub'));
    checks++;
    // Inline body behavior runs while parsing; ordered defer runs afterward.
    for (const script of w.document.querySelectorAll('script:not([src])')) {
      if (!script.type || script.type === 'text/javascript') w.eval(script.textContent);
    }
    for (const script of w.document.querySelectorAll('script[src]')) {
      if (new URL(script.src).origin !== w.location.origin) continue;
      w.eval(fs.readFileSync(path.join(root, new URL(script.src).pathname), 'utf8'));
    }
    const form = w.document.getElementById('heroIntakeForm');
    assert.deepEqual(errors, []);
    assert.ok(w.MG_FORM_CORE && w.MG_FORM_METRICS && w.MG_CAMPAIGN);
    assert.equal(w.MG_CAMPAIGN.get().utm_source, 'loading_regression');
    checks++;
    if (host === 'magnoliagardenslandscaping.com') {
      assert.equal(w.MG_ANALYTICS_OK, true);
      assert.deepEqual(providers.sort(), [
        'https://connect.facebook.net/en_US/fbevents.js',
        'https://www.clarity.ms/tag/xiib0yey5e',
        'https://www.googletagmanager.com/gtag/js?id=G-V93YBHW1PJ'
      ]);
      assert.deepEqual(beaconTokens, []);
      assert.equal(w.document.querySelectorAll('script[data-cf-beacon]').length, withEdgeBeacon ? 1 : 0);
      if (edgeBeacon) {
        assert.equal(w.document.querySelector('script[data-cf-beacon]'), edgeBeacon);
        assert.equal(edgeBeacon.getAttribute('data-cf-beacon'), '{"token":"edge-test-token","r":1}');
      }
      assert.equal(Array.from(w.dataLayer).filter(args => args[0] === 'config' && args[1] === 'G-V93YBHW1PJ').length, 1);
      assert.deepEqual(Array.from(w.fbq.queue, args => Array.from(args)), [['init', '1529884685261202'], ['track', 'PageView']]);
      assert.equal(typeof w.clarity, 'function');
      checks++;
    } else {
      assert.equal(w.MG_ANALYTICS_OK, false); assert.deepEqual(providers, []);
      assert.equal(w.gtag, undefined); checks++;
    }
    form.elements.phone.value = '4235550123';
    form.requestSubmit(); await pause();
    assert.equal(sends, 1);
    assert.equal(payload.get('phone'), '4235550123');
    assert.equal(payload.get('utm_source'), 'loading_regression');
    assert.equal(payload.get('landing_path'), '/');
    assert.equal(w.document.getElementById('heroThanks').hidden, false);
    if (w.MG_ANALYTICS_OK) {
      const accepted = Array.from(w.dataLayer).find(args => args[1] === 'mg_form_accepted');
      assert.ok(accepted); assert.ok(!JSON.stringify(Array.from(w.dataLayer)).includes('4235550123'));
    }
    checks++;
  } finally { dom.window.close(); }
}
(async () => {
  // Hosting owns the beacon across every rendered page, including service,
  // area and estimate routes that previously duplicated the homepage loader.
  const renderedPages = fs.readdirSync(root, { recursive: true }).filter(file => file.endsWith('.html'));
  assert.ok(renderedPages.length >= 15);
  for (const file of [...renderedPages, 'assets/home-analytics.js']) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(content, /static\.cloudflareinsights\.com\/beacon|data-cf-beacon/, file);
  }
  checks++;
  await scenario('magnoliagardenslandscaping.com');
  await scenario('preview.example');
  await scenario('magnoliagardenslandscaping.com', true);
  console.log(`PASS: ${checks} homepage loading contracts: ordered startup, site-managed providers, hosting-owned beacon without duplication, preview guard and mocked acceptance.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
