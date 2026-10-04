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
const rawUrl = 'https://hooks.zapier.com/hooks/catch/123456/offline-diagnostic/';
const armedDiagnostic = () => ({ url: rawUrl, expiresAt: Date.now() + 60000 });
function setup({ mode = 'accepted', mirror = true, rawDiagnostic, rawMode = 'accepted', trackerThrows = false, readThrows = false, resultThrows = false, resultMutates = false } = {}) {
  const dom = new JSDOM('<form id="quickRequest"><input name="phone" type="tel" required><details><input name="email" type="email"><select name="service"><option value="cleanup">Cleanup</option></select><textarea name="message"></textarea></details><input name="_gotcha"><input name="disabledField" value="do not send" disabled><button>Send</button></form>', { url: 'https://example.invalid/estimate/?utm_source=flyer&utm_campaign=fall-2026', runScripts: 'outside-only' });
  const w = dom.window, form = w.document.querySelector('form'), posts = [], events = [], invalid = [], results = [], busy = [];
  w.MG_SITE_CONFIG = { forms: { formspree: 'https://provider.invalid/', zapierMirror: 'https://mirror.invalid/', timeoutMs: 5, rawHookDiagnostic: rawDiagnostic }, contact: { smsHref: 'sms:+14233909954' } };
  w.MG_ANALYTICS_OK = true;
  w.gtag = (...args) => { events.push(args); if (trackerThrows) throw Error('tracker unavailable'); };
  w.fetch = (url, options) => {
    posts.push({ url, options, entries: Object.fromEntries(options.body.entries()) });
    assert.ok([...form.querySelectorAll('input,textarea,select,button')].every(el => el.disabled));
    if (url.replace(/\/$/, '') === rawUrl.slice(0, -1) && options.mode === 'no-cors' && !options.keepalive) {
      if (rawMode === 'sync_throw') throw Error('raw fetch unavailable');
      if (rawMode === 'network_failure') return Promise.reject(Error('raw offline'));
      if (rawMode === 'pending') return new Promise(() => {});
      return Promise.resolve({ ok: rawMode === 'accepted', status: rawMode === 'accepted' ? 200 : 422 });
    }
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
function rawPosts(h) { return h.posts.filter(p => p.url.replace(/\/$/, '') === rawUrl.slice(0, -1) && p.options.mode === 'no-cors' && !p.options.keepalive); }
function close(h) { h.dom.window.close(); }
(async () => {
  const sourceConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config/site.json'), 'utf8'));
  assert.deepEqual(sourceConfig.forms.rawHookDiagnostic, { url: '', expiresAt: 0 }, 'the committed diagnostic must remain disarmed');
  checks++;
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
  // Diagnostic configuration must be explicit, short-lived, and a separate Catch Hook URL.
  for (const diagnostic of [undefined, null, {}, { url: '', expiresAt: Date.now() + 60000 },
    { url: rawUrl }, { url: null, expiresAt: Date.now() + 60000 },
    { url: rawUrl, expiresAt: 0 }, { url: rawUrl, expiresAt: Date.now() - 1 },
    { url: rawUrl, expiresAt: Date.now() + 600000 }, { url: rawUrl, expiresAt: 'tomorrow' },
    { url: rawUrl, expiresAt: Infinity }, { url: rawUrl, expiresAt: NaN },
    ...['http://hooks.zapier.com/hooks/catch/123456/sample/', 'https://elsewhere.invalid/hooks/catch/123456/sample/',
      rawUrl + '?extra=1', rawUrl + '#fragment', rawUrl.replace('/catch/', '/other/'), 'malformed'].map(url => ({ ...armedDiagnostic(), url }))]) {
    const h = setup({ rawDiagnostic: diagnostic }); h.form.elements.phone.value = '4235550100';
    await h.api.submit(); assert.equal(h.posts.length, 2); assert.deepEqual(h.results, ['accepted']); close(h); checks++;
  }
  for (const [key, url] of [['formspree', rawUrl], ['formspree', rawUrl.slice(0, -1)], ['zapierMirror', rawUrl], ['zapierMirror', rawUrl.slice(0, -1)]]) {
    const h = setup({ rawDiagnostic: armedDiagnostic() }); h.w.MG_SITE_CONFIG.forms[key] = url;
    h.form.elements.phone.value = '4235550100'; await h.api.submit();
    assert.equal(h.posts.length, 2, 'a normal intake endpoint cannot also receive a diagnostic copy');
    assert.equal(rawPosts(h).length, 0); assert.deepEqual(h.results, ['accepted']); close(h); checks++;
  }
  {
    const h = setup({ rawDiagnostic: { ...armedDiagnostic(), url: rawUrl.slice(0, -1) } }); h.form.elements.phone.value = '4235550100';
    await h.api.submit(); assert.equal(rawPosts(h).length, 1); assert.deepEqual(h.results, ['accepted']); close(h); checks++;
  }
  // Opting out of the existing mirror or failing normal intake gates also suppresses diagnostics.
  for (const gate of ['mirror_disabled', 'mirror_missing', 'honeypot', 'invalid_phone', 'invalid_email', 'formspree_missing']) {
    const h = setup({ mirror: gate !== 'mirror_disabled', rawDiagnostic: armedDiagnostic() });
    h.form.elements.phone.value = '4235550100';
    if (gate === 'mirror_missing') delete h.w.MG_SITE_CONFIG.forms.zapierMirror;
    if (gate === 'honeypot') h.form.elements._gotcha.value = 'bot';
    if (gate === 'invalid_phone') h.form.elements.phone.value = '';
    if (gate === 'invalid_email') h.form.elements.email.value = 'broken';
    if (gate === 'formspree_missing') delete h.w.MG_SITE_CONFIG.forms.formspree;
    await h.api.submit(); assert.equal(rawPosts(h).length, 0);
    assert.equal(h.posts.length, gate.startsWith('mirror_') ? 1 : 0); close(h); checks++;
  }
  // The optional raw copy gets the original multipart snapshot, after normal dispatch starts.
  {
    const h = setup({ rawDiagnostic: armedDiagnostic() });
    h.form.elements.phone.value = '4235550100'; h.form.elements.message.value = 'Synthetic: café 🌿 & blanks';
    h.options.preparePayload = fd => { fd.set('project_scope', h.form.elements.message.value); fd.set('source', 'offline-contract'); };
    await h.api.submit();
    assert.deepEqual(h.posts.map(p => p.url), ['https://mirror.invalid/', 'https://provider.invalid/', rawUrl]);
    const raw = rawPosts(h)[0];
    assert.equal(raw.options.body, h.posts[0].options.body); assert.equal(raw.options.body, h.posts[1].options.body);
    assert.ok(raw.options.body instanceof h.w.FormData, 'the browser must supply multipart encoding and its boundary');
    assert.deepEqual(Object.keys(raw.options).sort(), ['body', 'method', 'mode']);
    assert.equal(raw.options.method, 'POST'); assert.equal(raw.options.mode, 'no-cors');
    assert.equal(raw.entries.phone, '4235550100'); assert.equal(raw.entries.email, ''); assert.equal(raw.entries._gotcha, '');
    assert.equal(raw.entries.message, 'Synthetic: café 🌿 & blanks'); assert.equal(raw.entries.project_scope, raw.entries.message);
    assert.equal(raw.entries.source, 'offline-contract'); assert.ok(raw.entries.submitted_at); assert.equal(raw.entries.disabledField, undefined);
    assert.equal(raw.entries.utm_source, 'flyer'); assert.equal(raw.entries.submitting_path, '/estimate/');
    assert.equal(JSON.stringify(h.events).includes('Synthetic:'), false); close(h); checks++;
  }
  // A diagnostic result cannot change delivery, UI, analytics, or trigger a retry, even when it hangs.
  for (const mode of ['accepted', 'http_rejected', 'network_failure', 'timeout']) {
    const baseline = setup({ mode }); baseline.form.elements.phone.value = '4235550100'; await baseline.api.submit();
    for (const rawMode of ['accepted', 'http_rejected', 'network_failure', 'sync_throw', 'pending']) {
      const h = setup({ mode, rawMode, rawDiagnostic: armedDiagnostic() }); h.form.elements.phone.value = '4235550100';
      const first = h.api.submit(); await h.api.submit(); await first; await h.api.submit();
      assert.equal(h.api.getState(), baseline.api.getState()); assert.deepEqual(h.results, baseline.results); assert.deepEqual(h.busy, baseline.busy);
      assert.equal(rawPosts(h).length, 1); assert.equal(h.posts.length, 3);
      assert.equal(JSON.stringify(h.events), JSON.stringify(baseline.events));
      close(h); checks++;
    }
    close(baseline);
  }
  // The one-sample budget is shared by every form on the page and consumed even by a synchronous failure.
  {
    const h = setup({ rawMode: 'sync_throw', rawDiagnostic: armedDiagnostic() }); h.form.elements.phone.value = '4235550100';
    await h.api.submit();
    const secondForm = h.form.cloneNode(true); secondForm.id = 'secondRequest'; h.w.document.body.appendChild(secondForm);
    const second = h.w.MG_FORM_CORE.bind(secondForm, { mirror: true, location: 'footer' });
    h.w.fetch = (url, options) => { h.posts.push({ url, options }); return Promise.resolve({ ok: true }); };
    await second.submit(); await second.submit(); await h.api.submit();
    assert.equal(second.getState(), 'accepted'); assert.equal(rawPosts(h).length, 1); assert.equal(h.posts.length, 5);
    close(h); checks++;
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
