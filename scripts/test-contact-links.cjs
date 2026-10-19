#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(process.env.SITE_ROOT || path.join(__dirname, '..', 'dist'));
const config = fs.readFileSync(path.join(root, 'assets/site-config.js'), 'utf8');
const core = fs.readFileSync(path.join(root, 'assets/form-core.js'), 'utf8');
const navigation = fs.readFileSync(path.join(root, 'assets/site-nav.js'), 'utf8');
const pages = [
  ['mowing', 'mowing', 'recurring mowing'],
  ['maintenance', 'maintenance', 'full grounds care'],
  ['cleanup', 'cleanup', 'a yard cleanup'],
  ['mulch', 'mulch', 'mulch and beds'],
  ['brush-clearing', 'brush', 'brush clearing']
];
const devices = [
  { name: 'iPhone', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', platform: 'iPhone', maxTouchPoints: 5, separator: '&' },
  { name: 'iPad desktop mode', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', platform: 'MacIntel', maxTouchPoints: 5, separator: '&' },
  { name: 'Android', userAgent: 'Mozilla/5.0 (Linux; Android 15)', platform: 'Linux armv8l', maxTouchPoints: 5, separator: '?' },
  { name: 'desktop', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', platform: 'MacIntel', maxTouchPoints: 0, separator: '?' }
];
let checks = 0;
for (const [slug, service, label] of pages) {
  const html = fs.readFileSync(path.join(root, 'services', slug, 'index.html'), 'utf8');
  for (const device of devices) {
    // Outside-only execution keeps all form/analytics/network requests disabled.
    const dom = new JSDOM(html, { url: 'https://preview.invalid/services/' + slug + '/', runScripts: 'outside-only' });
    const w = dom.window;
    w.matchMedia = () => ({ addEventListener() {} });
    for (const key of ['userAgent', 'platform', 'maxTouchPoints']) Object.defineProperty(w.navigator, key, { value: device[key], configurable: true });
    const links = [...w.document.querySelectorAll('a[href^="sms:"]')];
    assert.equal(links.length, 5, slug + ': nav, hero, quote, inline and floating text links');
    const body = 'Hi Magnolia Gardens, I would like a quote for ' + label + '.';
    for (const link of links) {
      assert.equal(link.getAttribute('data-sms-service'), service);
      assert.equal(decodeURIComponent(link.href.split('?body=')[1]), body, slug + ': useful static fallback');
    }
    assert.equal([...w.document.querySelectorAll('a')].find(a => a.textContent === 'open the intake form').getAttribute('href'), '/estimate/?service=' + service);
    w.eval(config);
    // Failure of shared form code must leave a native, contextual text link.
    w.eval(navigation);
    for (const link of links) assert.equal(link.href, 'sms:+14233909954' + device.separator + 'body=' + encodeURIComponent(body));
    w.eval(core);
    w.eval(navigation);
    for (const link of links) assert.equal(link.href, 'sms:+14233909954' + device.separator + 'body=' + encodeURIComponent(body));
    const unknown = w.document.createElement('a');
    unknown.href = 'sms:+14233909954?body=fallback';
    unknown.setAttribute('data-sms-service', 'private-address-must-not-enter-url');
    w.document.body.appendChild(unknown);
    w.eval(navigation);
    assert.equal(decodeURIComponent(unknown.href), 'sms:+14233909954' + device.separator + 'body=Hi Magnolia Gardens, I would like a quote for my yard.');
    // Re-running navigation cannot append a second body or change the destination.
    w.eval(navigation);
    for (const link of links) assert.equal(link.href, 'sms:+14233909954' + device.separator + 'body=' + encodeURIComponent(body));
    checks++;
    w.close();
  }
}
console.log('PASS: ' + checks + ' service/device contact-link cases, including static/shared-code fallback and repeat initialization. Native messaging apps remain a physical-device check.');
