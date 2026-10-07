#!/usr/bin/env node
'use strict';
// Offline contract tests. No resource loader; every network call is a mock.
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.env.SITE_ROOT ? path.resolve(process.env.SITE_ROOT) : path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
let checks = 0;
function setup({ mode = 'accepted', mirror = true, trackerThrows = false, readThrows = false, resultThrows = false, resultMutates = false } = {}) {
  const dom = new JSDOM('<form id="quickRequest"><input name="phone" type="tel" required><details><input name="email" type="email"><select name="service"><option value="cleanup">Cleanup</option></select><textarea name="message"></textarea></details><input name="_gotcha"><input name="disabledField" value="do not send" disabled><button>Send</button></form>', { url: 'https://example.invalid/estimate/?utm_source=flyer&utm_campaign=fall-2026', runScripts: 'outside-only' });
  const w = dom.window, form = w.document.querySelector('form'), posts = [], events = [], invalid = [], results = [], busy = [];
  w.MG_SITE_CONFIG = { forms: { formspree: 'https://provider.invalid/', zapierMirror: 'https://mirror.invalid/', timeoutMs: 5 }, contact: { smsHref: 'sms:+14233909954' } };
  w.MG_ANALYTICS_OK = true;
  w.gtag = (...args) => { events.push(args); if (trackerThrows) throw Error('tracker unavailable'); };
  w.fetch = (url, options) => {
    posts.push({ url, options, entries: Object.fromEntries(options.body.entries()) });
    assert.ok([...form.querySelectorAll('input,textarea,select,button')].every(el => el.disabled));
    if (url.includes('mirror')) return Promise.reject(Error('mirror unknown'));
    if (mode === 'network_failure') return Promise.reject(Error('simulated offline'));
    if (mode === 'timeout') return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(Error('aborted'))));
    return Promise.resolve({ ok: mode === 'accepted', status: mode === 'accepted' ? 200 : 422 });
  };
  ['assets/form-metrics.js', 'assets/campaign-context.js', 'assets/form-core.js'].forEach(file => w.eval(read(file)));
  let api;
  const options = { location: 'estimator', mirror,
    readValues: () => { if (readThrows) throw Error('invalid analytics reader'); return { service: form.elements.service.value, frequency: 'onetime' }; },
    preparePayload: fd => { fd.set('project_scope', form.elements.message.value); },
    onInvalid: value => invalid.push(value),
    onBusy: value => busy.push(value),
    onResult: status => { results.push(status); assert.equal(api.getState(), status); assert.equal(form.elements.phone.disabled, false); assert.equal(form.elements.disabledField.disabled, true); if (resultMutates) form.elements.service.value = ''; if (resultThrows) throw Error('UI hook failed'); }
  };
  api = w.MG_FORM_CORE.bind(form, options);
  assert.equal(form.noValidate, true, 'the installed controller owns validation');
  return { dom, w, form, posts, events, invalid, results, busy, api, options };
}
function count(h, name) { return h.events.filter(e => e[1] === name).length; }
function close(h) { h.dom.window.close(); }
// Exercise the public controller with manual deadlines, never extracted source.
// The real watchdog makes a broken deadline fail instead of leaving an unresolved
// promise that Node could silently exit without checking.
async function settled(promise) {
  let watchdog;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      watchdog = setTimeout(() => reject(Error('controller did not settle after transport/deadline')), 1000);
    })]);
  } finally { clearTimeout(watchdog); }
}
function controlledTransport(h, implementation) {
  const timers = new Map(), cleared = [];
  let nextId = 0;
  h.w.setTimeout = (run, ms) => { const id = ++nextId; timers.set(id, { run, ms }); return id; };
  h.w.clearTimeout = id => { cleared.push(id); timers.delete(id); };
  h.w.fetch = (url, options) => {
    h.posts.push({ url, options });
    return implementation(url, options);
  };
  return { timers, cleared };
}
(async () => {
  for (const [file, ids] of [['index.html', ['heroIntakeForm', 'intakeForm']], ['estimate/index.html', ['quickRequest']]]) {
    const dom = new JSDOM(read(file));
    for (const id of ids) {
      const form = dom.window.document.getElementById(id);
      assert.equal(form.noValidate, false, 'native browser validation remains when JavaScript is unavailable');
      assert.equal(form.checkValidity(), false, 'phone is still required without JavaScript');
      form.elements.phone.value = '4235550100'; form.elements.email.value = 'broken';
      assert.equal(form.checkValidity(), false, 'invalid optional email is rejected without JavaScript');
      form.elements.email.value = '';
      assert.equal(form.checkValidity(), true, 'phone only is valid without JavaScript');
    }
    dom.window.close(); checks++;
  }
  // Snapshot payload first, lock every input, single flight, terminal result and one canonical acceptance.
  {
    const h = setup(); h.form.elements.phone.value = '(423) 555-0100'; h.form.elements.message.value = 'Cleanup details';
    assert.equal(h.w.MG_FORM_CORE.bind(h.form, h.options), h.api);
    const first = h.api.submit(); await h.api.submit(); await first; await h.api.submit();
    assert.equal(h.api.getState(), 'accepted'); assert.deepEqual(h.results, ['accepted']); assert.deepEqual(h.busy, [true, false]);
    assert.equal(h.posts.length, 2); assert.equal(h.posts[0].options.body, h.posts[1].options.body);
    const provider = h.posts.find(post => post.url === h.w.MG_SITE_CONFIG.forms.formspree);
    assert.equal(provider.options.method, 'POST');
    assert.ok(provider.options.body instanceof h.w.FormData);
    assert.equal(provider.options.headers.Accept, 'application/json');
    assert.equal(Object.keys(provider.options.headers).some(key => key.toLowerCase() === 'content-type'), false, 'FormData owns its multipart boundary');
    assert.ok(provider.options.signal instanceof h.w.AbortSignal);
    assert.equal(h.posts[0].entries.phone, '(423) 555-0100'); assert.equal(h.posts[0].entries.message, 'Cleanup details');
    assert.equal(h.posts[0].entries.project_scope, 'Cleanup details'); assert.equal(h.posts[0].entries.disabledField, undefined);
    assert.equal(h.posts[0].entries.utm_source, 'flyer'); assert.equal(h.posts[0].entries.submitting_path, '/estimate/');
    assert.ok(h.posts[0].entries.submitted_at); assert.equal(count(h, 'mg_form_accepted'), 1); assert.equal(count(h, 'mg_form_attempt'), 1);
    assert.equal(count(h, 'generate_lead'), 1); assert.equal(count(h, 'lead_submit'), 1);
    assert.equal(count(h, 'mg_form_start'), 0, 'synthetic submit must not invent an intentional start');
    assert.equal(JSON.stringify(h.events).includes('555-0100'), false); assert.equal(JSON.stringify(h.events).includes('Cleanup details'), false);
    const accepted = h.events.find(e => e[1] === 'mg_form_accepted')[2];
    assert.equal(accepted.measurement_version, '3'); assert.equal(accepted.service, 'cleanup'); assert.equal(accepted.frequency, 'one_off');
    close(h); checks++;
  }
  // Optional invalid email opens its disclosure; phone only still succeeds.
  {
    const h = setup(); await h.api.submit(); assert.equal(h.invalid[0].reason, 'invalid_phone'); assert.equal(h.invalid[0].field, h.form.elements.phone);
    h.form.elements.phone.value = '4235550100'; h.form.elements.email.value = 'broken'; await h.api.submit();
    assert.equal(h.invalid[1].reason, 'invalid_email'); assert.equal(h.form.querySelector('details').open, true); assert.equal(h.posts.length, 0);
    h.form.elements.email.value = ''; await h.api.submit(); assert.equal(h.results[0], 'accepted');
    assert.equal(count(h, 'mg_form_invalid'), 2); close(h); checks++;
  }
  for (const mode of ['http_rejected', 'network_failure', 'timeout']) {
    const h = setup({ mode }); h.form.elements.phone.value = '4235550100'; await h.api.submit(); await h.api.submit();
    assert.deepEqual(h.results, [mode]); assert.equal(h.api.getState(), mode); assert.equal(h.posts.length, 2);
    assert.equal(count(h, 'mg_form_accepted'), 0); assert.equal(count(h, 'generate_lead'), 0);
    assert.equal(h.events.find(e => e[1] === 'mg_form_error')[2].reason, mode);
    close(h); checks++;
  }
  // Legacy cases 1–4: prompt outcomes cancel their deadline; a synchronous
  // fetch throw follows the same cleanup contract as a rejected promise.
  for (const mode of ['accepted', 'http_rejected', 'network_failure', 'sync_throw']) {
    const h = setup({ mirror: false });
    try {
      const clock = controlledTransport(h, () => {
        if (mode === 'sync_throw') throw Error('synthetic blocked fetch');
        if (mode === 'network_failure') return Promise.reject(Error('synthetic offline'));
        return Promise.resolve({ ok: mode === 'accepted', status: mode === 'accepted' ? 200 : 422 });
      });
      h.form.elements.phone.value = '4235550100';
      const pending = h.api.submit();
      assert.equal(clock.timers.size, 1, mode + ' starts one deadline');
      const timerId = [...clock.timers.keys()][0];
      const expected = mode === 'sync_throw' ? 'network_failure' : mode;
      assert.equal(await settled(pending), expected);
      assert.deepEqual(clock.cleared, [timerId], mode + ' clears its deadline');
      assert.equal(clock.timers.size, 0);
      assert.equal(h.posts.length, 1);
      assert.equal(h.posts[0].options.signal.aborted, false);
      if (mode === 'sync_throw') {
        assert.deepEqual(h.results, ['network_failure']);
        assert.deepEqual(h.busy, [true, false]);
        assert.equal(count(h, 'mg_form_accepted'), 0);
        assert.equal(h.events.find(e => e[1] === 'mg_form_error')[2].reason, 'network_failure');
        await h.api.submit(); assert.equal(h.posts.length, 1, 'synchronous failure cannot resend');
      }
      checks++;
    } finally { close(h); }
  }
  // Legacy cases 5–6: the configured/default 15-second deadline works even
  // when fetch ignores abort, and late success/failure cannot change the result.
  const productionTimeout = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config/site.json'), 'utf8')).forms.timeoutMs;
  assert.equal(productionTimeout, 15000);
  for (const scenario of ['configured_pending', 'default_pending', 'late_success', 'late_rejection']) {
    const h = setup({ mirror: false });
    try {
      let resolveFetch, rejectFetch;
      const clock = controlledTransport(h, () => new Promise((resolve, reject) => { resolveFetch = resolve; rejectFetch = reject; }));
      if (scenario === 'default_pending') delete h.w.MG_SITE_CONFIG.forms.timeoutMs;
      else h.w.MG_SITE_CONFIG.forms.timeoutMs = productionTimeout;
      h.form.elements.phone.value = '4235550100';
      const pending = h.api.submit();
      await Promise.resolve();
      assert.equal(h.api.getState(), 'submitting');
      assert.deepEqual(h.results, []);
      assert.equal(clock.timers.size, 1);
      const [timerId, timer] = [...clock.timers.entries()][0];
      assert.equal(timer.ms, 15000);
      assert.equal(h.posts.length, 1);
      const signal = h.posts[0].options.signal;
      assert.equal(signal.aborted, false);
      timer.run();
      assert.equal(await settled(pending), 'timeout');
      assert.equal(signal.aborted, true, 'deadline aborts the transport');
      assert.deepEqual(clock.cleared, [timerId]);
      assert.equal(clock.timers.size, 0);
      const terminalEvents = JSON.stringify(h.events);
      if (scenario === 'late_success') resolveFetch({ ok: true, status: 200 });
      if (scenario === 'late_rejection') rejectFetch(Error('synthetic late network failure'));
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(h.api.getState(), 'timeout');
      assert.deepEqual(h.results, ['timeout']);
      assert.deepEqual(h.busy, [true, false]);
      assert.equal(JSON.stringify(h.events), terminalEvents, 'late settlement emits no second result or conversion');
      assert.equal(count(h, 'mg_form_accepted'), 0);
      assert.equal(count(h, 'mg_form_error'), 1);
      assert.equal(h.events.find(e => e[1] === 'mg_form_error')[2].reason, 'timeout');
      await h.api.submit(); assert.equal(h.posts.length, 1);
      checks++;
    } finally { close(h); }
  }
  for (const fault of [{ trackerThrows: true }, { readThrows: true }, { resultThrows: true }]) {
    const h = setup(fault); h.form.elements.phone.value = '4235550100'; await h.api.submit(); await h.api.submit();
    assert.equal(h.api.getState(), 'accepted'); assert.deepEqual(h.results, ['accepted']); assert.equal(h.posts.length, 2);
    assert.equal(count(h, 'mg_form_error'), 0); close(h); checks++;
  }
  {
    const h = setup({ resultMutates: true }); h.form.elements.phone.value = '4235550100'; await h.api.submit();
    assert.equal(h.events.find(e => e[1] === 'mg_form_accepted')[2].service, 'cleanup'); close(h); checks++;
  }
  {
    const h = setup(); h.form.elements._gotcha.value = 'bot'; await h.api.submit(); await h.api.submit();
    assert.equal(h.posts.length, 0); assert.equal(h.events.length, 0); assert.deepEqual(h.results, ['accepted']); close(h); checks++;
  }
  {
    const h = setup({ mirror: false }); h.form.elements.phone.value = '4235550100'; await h.api.submit(); assert.equal(h.posts.length, 1); close(h); checks++;
  }
  {
    const h = setup(); h.form.elements.phone.value = '4235550100'; delete h.w.MG_SITE_CONFIG.forms.formspree;
    await h.api.submit(); assert.equal(h.posts.length, 0); assert.deepEqual(h.results, ['network_failure']); close(h); checks++;
  }
  // Focus and synthetic interactions never count as genuine starts; malicious props are bounded.
  {
    const h = setup(); h.form.elements.phone.focus(); h.form.elements.phone.dispatchEvent(new h.w.Event('input', { bubbles: true }));
    assert.equal(count(h, 'mg_form_start'), 0);
    h.w.MG_FORM_CORE.track('click_to_text', { location: '4235550100', phone: '4235550100', service: 'person@example.com' });
    assert.equal(JSON.stringify(h.events).includes('4235550100'), false); assert.equal(JSON.stringify(h.events).includes('@'), false);
    assert.match(decodeURIComponent(h.w.MG_FORM_CORE.smsHref('cleanup')), /quote for a yard cleanup/);
    assert.equal(decodeURIComponent(h.w.MG_FORM_CORE.smsHref('private details')).includes('private details'), false);
    close(h); checks++;
  }
  // Failure recovery keeps entered values in a masked, read-only input only.
  {
    const h = setup();
    h.form.elements.phone.value = '4235550100'; h.form.elements.email.value = 'person@example.com'; h.form.elements.message.value = '<private notes & details>';
    const recovery = h.w.MG_FORM_CORE.recoveryDetails(h.form), text = recovery.querySelector('textarea');
    assert.equal(text.readOnly, true); assert.equal(text.getAttribute('aria-label'), 'Your saved request details');
    assert.equal(text.getAttribute('data-clarity-mask'), 'true');
    assert.match(text.value, /4235550100/); assert.match(text.value, /person@example.com/); assert.match(text.value, /<private notes & details>/);
    assert.equal(recovery.outerHTML.includes('4235550100'), false); assert.equal(recovery.outerHTML.includes('person@example.com'), false);
    assert.equal(recovery.outerHTML.includes('private notes'), false); assert.equal(recovery.querySelector('[href]'), null);
    assert.equal(text.value.includes('utm_source'), false); close(h); checks++;
  }
  // First-touch attribution follows internal navigation and expires after inactivity.
  {
    const h = setup(); const saved = h.w.sessionStorage.getItem('mg_campaign_v1');
    const next = new JSDOM('', { url: 'https://example.invalid/services/mulch/?utm_source=internal', referrer: 'https://example.invalid/', runScripts: 'outside-only' });
    next.window.sessionStorage.setItem('mg_campaign_v1', saved); next.window.eval(read('assets/campaign-context.js'));
    const data = new next.window.FormData(); next.window.MG_CAMPAIGN.apply(data);
    assert.equal(data.get('utm_source'), 'flyer'); assert.equal(data.get('landing_path'), '/estimate/'); assert.equal(data.get('submitting_path'), '/services/mulch/');
    const expired = JSON.parse(saved); expired.expires_at = Date.now() - 1;
    next.window.sessionStorage.setItem('mg_campaign_v1', JSON.stringify(expired)); next.window.eval(read('assets/campaign-context.js'));
    assert.equal(next.window.MG_CAMPAIGN.get().utm_source, 'internal');
    next.window.close(); close(h); checks++;
  }
  // Storage failure cannot break payload creation; referrer query/path and unsafe UTMs are dropped.
  {
    const dom = new JSDOM('', { url: 'https://example.invalid/?utm_source=fall&utm_campaign=person%40example.com&utm_term=423-555-0100&utm_content=' + 'x'.repeat(101), referrer: 'https://search.example/private/person?email=person@example.com', runScripts: 'outside-only' });
    const w = dom.window;
    Object.defineProperty(w, 'sessionStorage', { get() { throw Error('storage blocked'); } });
    w.eval(read('assets/campaign-context.js')); const data = new w.FormData(); w.MG_CAMPAIGN.apply(data);
    assert.equal(data.get('utm_source'), 'fall'); assert.equal(data.get('utm_campaign'), ''); assert.equal(data.get('utm_term'), ''); assert.equal(data.get('utm_content'), '');
    assert.equal(data.get('landing_referrer'), 'https://search.example'); assert.equal(data.get('page_url'), 'https://example.invalid/');
    assert.equal(JSON.stringify(Object.fromEntries(data)).includes('person'), false);
    dom.window.close(); checks++;
  }
  console.log('PASS ' + checks + ' shared form, telemetry, campaign and privacy contracts; 0 live requests.');
})().catch(error => { console.error(error); process.exit(1); });
