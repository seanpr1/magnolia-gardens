#!/usr/bin/env node
'use strict';
// Exercise the rendered homepage and its real adapter. No resource loader:
// all transport and analytics are local mocks, never live customer systems.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = process.env.SITE_ROOT || path.resolve(__dirname, '../dist');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
let checks = 0;
function setup(id, mode = 'accepted', trackerThrows = false) {
  const dom = new JSDOM(html, {
    url: 'https://example.invalid/?utm_source=offline_test',
    runScripts: 'outside-only', pretendToBeVisual: true,
    virtualConsole: new VirtualConsole()
  });
  const w = dom.window, posts = [], events = [];
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.matchMedia = () => ({ matches: false });
  w.MG_ANALYTICS_OK = true;
  w.gtag = (...args) => {
    events.push(args);
    if (trackerThrows) throw Error('mock tracker unavailable');
  };
  w.fetch = async (url, options) => {
    assert.equal(url, w.MG_SITE_CONFIG.forms.formspree);
    assert.equal(options.method, 'POST');
    posts.push(Object.fromEntries(options.body));
    if (mode === 'network_failure') throw Error('mock network failure');
    return { ok: true, status: 200 };
  };
  for (const file of ['site-config', 'campaign-context', 'form-metrics', 'form-core', 'home-forms']) {
    w.eval(read('assets/' + file + '.js'));
  }
  return { dom, w, posts, events, form: w.document.getElementById(id) };
}
async function settle() { await new Promise(resolve => setImmediate(resolve)); }
(async () => {
  for (const id of ['heroIntakeForm', 'intakeForm']) {
    // Discoverability and native fallback must work without any JavaScript.
    const dom = new JSDOM(html), form = dom.window.document.getElementById(id);
    assert.deepEqual(Array.from(form.querySelectorAll('[required]'), el => el.name), ['phone']);
    const disclosure = form.querySelector('details.optional-details');
    assert.equal(disclosure.open, false);
    for (const name of ['service', 'address']) {
      const field = form.elements[name];
      assert.equal(form.querySelectorAll('[name="' + name + '"]').length, 1);
      assert.equal(field.closest('details,[hidden],[aria-hidden="true"]'), null);
      assert.equal(field.disabled, false);
      assert.match(field.labels[0].textContent, /optional/i);
      assert.ok(form.elements.phone.compareDocumentPosition(field) & 4, 'phone comes first');
      assert.ok(field.compareDocumentPosition(disclosure) & 4, 'details follow visible fields');
    }
    for (const name of ['name', 'email', 'message']) assert.equal(form.elements[name].closest('details'), disclosure);
    assert.equal(form.elements.service.value, '', 'no service is selected on the customer’s behalf');
    assert.equal(form.checkValidity(), false);
    form.elements.phone.value = '4235550100';
    assert.equal(form.checkValidity(), true, 'phone alone still passes native validation');
    for (const location of ['37664', '123 Example Lane, Example City', '']) {
      form.elements.address.value = location;
      assert.equal(form.checkValidity(), true, 'ZIP, address and blank are accepted');
    }
    const ids = Array.from(dom.window.document.querySelectorAll('[id]'), el => el.id);
    assert.equal(new Set(ids).size, ids.length, 'field labels retain unique targets');
    dom.window.close(); checks++;

    for (const [service, address, mode, trackerThrows] of [
      ['', '', 'accepted', false],
      ['cleanup', '', 'accepted', false],
      ['', '37664', 'accepted', false],
      ['mulch', '37664', 'accepted', false],
      ['other', '123 Example Lane, Example City', 'accepted', false],
      ['cleanup', '37664', 'accepted', true],
      ['cleanup', '123 Example Lane, Example City', 'network_failure', false]
    ]) {
      const h = setup(id, mode, trackerThrows);
      try {
        h.form.elements.phone.value = '4235550100';
        h.form.elements.service.value = service;
        h.form.elements.address.value = address;
        h.form.requestSubmit(); h.form.requestSubmit(); await settle();
        h.form.requestSubmit(); await settle();
        assert.equal(h.posts.length, 1, 'in-flight and settled requests cannot duplicate');
        const payload = h.posts[0];
        assert.equal(payload.phone, '4235550100');
        assert.equal(payload.service, service);
        assert.equal(payload.address, address);
        for (const name of ['name', 'email', 'message', '_gotcha']) assert.equal(payload[name], '');
        assert.equal(payload.source, id === 'heroIntakeForm' ? 'hero' : 'full-intake');
        assert.ok(payload.submission_id);
        assert.equal(payload.utm_source, 'offline_test');
        assert.equal(payload.landing_path, '/');
        const prefix = id === 'heroIntakeForm' ? 'hero' : 'intake';
        const panel = h.w.document.getElementById(prefix + (mode === 'accepted' ? 'Thanks' : 'Error'));
        assert.equal(panel.hidden, false);
        assert.equal(h.form.style.display, 'none');
        assert.equal(h.w.document.activeElement, panel.querySelector('h3'));
        const accepted = h.events.filter(e => e[1] === 'mg_form_accepted');
        assert.equal(accepted.length, mode === 'accepted' ? 1 : 0);
        if (accepted.length) {
          assert.equal(accepted[0][2].service, service || 'unknown');
          assert.equal(accepted[0][2].form_location, id === 'heroIntakeForm' ? 'hero' : 'detailed');
        }
        const telemetry = JSON.stringify(h.events);
        assert.ok(!telemetry.includes('4235550100'));
        if (address) assert.ok(!telemetry.includes(address), 'location never enters analytics');
        for (const link of h.w.document.querySelectorAll('a[href^="sms:"]')) {
          const href = decodeURIComponent(link.href);
          assert.ok(!href.includes('4235550100'));
          if (address) assert.ok(!href.includes(address), 'location never enters text-message URLs');
        }
        if (mode !== 'accepted') {
          const recovery = panel.querySelector('.request-recovery textarea');
          assert.equal(recovery.readOnly, true);
          assert.equal(recovery.closest('details').open, false);
          assert.ok(recovery.value.includes(address), 'location survives in private recovery');
        }
        checks++;
      } finally { h.dom.window.close(); }
    }
    const h = setup(id);
    try {
      h.form.elements.service.value = 'cleanup';
      h.form.elements.address.value = '37664';
      h.form.requestSubmit(); await settle();
      assert.equal(h.posts.length, 0, 'optional details cannot replace the required phone');
      h.form.elements.phone.value = '4235550100';
      h.form.elements.email.value = 'invalid';
      h.form.requestSubmit(); await settle();
      assert.equal(h.posts.length, 0);
      assert.equal(h.form.querySelector('details.optional-details').open, true);
      assert.equal(h.w.document.activeElement, h.form.elements.email);
      h.form.elements.email.value = '';
      h.form.requestSubmit(); await settle();
      assert.equal(h.posts.length, 1, 'clearing optional email allows submission');
      checks++;
    } finally { h.dom.window.close(); }
  }
  console.log(`PASS: ${checks} homepage optional-detail contracts; 0 live requests.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
