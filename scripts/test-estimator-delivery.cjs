#!/usr/bin/env node
'use strict';

// Dependency-free unit/source-contract checks. No live requests or writes.
// Default: read the shipped estimator in this checkout. An explicit input path
// permits checking retrieved source excerpts; that is NOT whole-page coverage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, '../estimate/index.html');
let source;
try {
  source = fs.readFileSync(sourcePath, 'utf8');
} catch (error) {
  console.error('Cannot read estimator source: ' + error.message);
  process.exit(1);
}

function extract(pattern, label) {
  const found = source.match(pattern);
  assert.ok(found, 'Missing or changed ' + label + '; review and update the test.');
  return found[0];
}
const deadlineSource = extract(
  /^  function postWithDeadline\(url, options\) \{[\s\S]*?^  \}/m,
  'postWithDeadline function'
);
const statusSource = extract(
  /\$\('#submissionStatus'\)\.textContent = leadSent[\s\S]*?\$\('#submissionCheck'\)\.style\.display = leadSent[^;]*;/,
  'delivery-status renderer'
);
const cases = [];
function test(name, run) { cases.push({ name, run }); }

// Network and timers are replaced before evaluating production source.
function harness(implementation) {
  const timers = new Map();
  const calls = [];
  let lastTimer = 0;
  const context = {
    AbortController,
    fetch: (url, options) => {
      calls.push({ url, options });
      return implementation(url, options);
    },
    setTimeout: (run, ms) => {
      const id = ++lastTimer;
      timers.set(id, { run, ms });
      return id;
    },
    clearTimeout: id => { timers.delete(id); }
  };
  vm.createContext(context);
  vm.runInContext(deadlineSource, context, { timeout: 1000 });
  return { context, timers, calls };
}
const url = 'https://example.invalid/form';
const flush = () => Promise.resolve().then(() => Promise.resolve());
function render(leadSent) {
  const elements = {
    '#submissionStatus': { textContent: '' },
    '#submissionCheck': { style: { display: 'initial' } }
  };
  vm.runInNewContext(statusSource, {
    leadSent,
    $: selector => {
      assert.ok(elements[selector], 'Unexpected renderer selector: ' + selector);
      return elements[selector];
    }
  }, { timeout: 1000 });
  return elements;
}

test('HTTP acceptance is returned and its deadline is cleared', async () => {
  const response = { ok: true, status: 200 };
  const h = harness(() => Promise.resolve(response));
  assert.equal(await h.context.postWithDeadline(url, {}), response);
  assert.equal(h.calls.length, 1);
  assert.equal(h.timers.size, 0);
});

test('HTTP rejection remains rejection evidence, not success', async () => {
  const response = { ok: false, status: 422 };
  const h = harness(() => Promise.resolve(response));
  const result = await h.context.postWithDeadline(url, {});
  assert.equal(result.ok, false);
  assert.equal(h.timers.size, 0);
  assert.equal(h.calls.length, 1);
});

test('network rejection clears the deadline without retrying', async () => {
  const h = harness(() => Promise.reject(new Error('offline')));
  await assert.rejects(h.context.postWithDeadline(url, {}), /offline/);
  assert.equal(h.timers.size, 0);
  assert.equal(h.calls.length, 1);
});

test('synchronous transport failure is also cleaned up', async () => {
  const h = harness(() => { throw new Error('blocked'); });
  await assert.rejects(h.context.postWithDeadline(url, {}), /blocked/);
  assert.equal(h.timers.size, 0);
  assert.equal(h.calls.length, 1);
});

test('15-second timeout rejects even when transport ignores abort', async () => {
  const h = harness(() => new Promise(() => {}));
  const pending = h.context.postWithDeadline(url, {});
  const rejected = assert.rejects(pending, /formspree_timeout/);
  await flush();
  assert.equal(h.timers.size, 1);
  const timer = [...h.timers.values()][0];
  assert.equal(timer.ms, 15000);
  assert.equal(h.calls[0].options.signal.aborted, false);
  timer.run();
  await rejected;
  assert.equal(h.calls[0].options.signal.aborted, true);
  assert.equal(h.calls.length, 1);
  assert.equal(h.timers.size, 0);
});

test('a late response cannot reverse the timed-out promise', async () => {
  let resolveFetch;
  const h = harness(() => new Promise(resolve => { resolveFetch = resolve; }));
  const pending = h.context.postWithDeadline(url, {});
  const rejected = assert.rejects(pending, /formspree_timeout/);
  await flush();
  [...h.timers.values()][0].run();
  await rejected;
  resolveFetch({ ok: true });
  await flush();
  await assert.rejects(pending, /formspree_timeout/);
  assert.equal(h.calls.length, 1);
});

test('options and body are preserved without mutating the caller', async () => {
  const body = { fixture: 'not customer data' };
  const headers = { Accept: 'application/json' };
  const options = { method: 'POST', body, headers, keepalive: true };
  const h = harness(() => Promise.resolve({ ok: true }));
  await h.context.postWithDeadline(url, options);
  const sent = h.calls[0];
  assert.equal(sent.url, url);
  assert.equal(sent.options.method, 'POST');
  assert.equal(sent.options.body, body);
  assert.equal(sent.options.headers, headers);
  assert.equal(sent.options.keepalive, true);
  assert.ok(sent.options.signal instanceof AbortSignal);
  assert.equal(Object.hasOwn(options, 'signal'), false);
});

test('unknown delivery hides the checkmark and provides a contact fallback', () => {
  const ui = render(false);
  assert.equal(ui['#submissionCheck'].style.display, 'none');
  assert.match(ui['#submissionStatus'].textContent, /could not confirm delivery/i);
  assert.match(ui['#submissionStatus'].textContent, /text or call/i);
});

test('accepted form response does not promise booking or automatic SMS', () => {
  const ui = render(true);
  assert.equal(ui['#submissionCheck'].style.display, '');
  assert.match(ui['#submissionStatus'].textContent, /request was sent/i);
  assert.match(ui['#submissionStatus'].textContent, /ask about available visits/i);
  assert.doesNotMatch(ui['#submissionStatus'].textContent, /saved|texted shortly|automatically|visit is booked|jobber/i);
});

test('initial markup does not show an unearned success indicator', () => {
  assert.match(source, /id="submissionCheck"[^>]*style="display:none"/);
  assert.match(source, /id="submissionStatus">[^<]*not been confirmed/);
});

test('each submission resets delivery before awaiting the response', () => {
  const submit = source.slice(source.indexOf("$('#estForm').addEventListener('submit'"));
  const reset = submit.indexOf('leadSent = false;');
  const wait = submit.indexOf('const res = await postWithDeadline(');
  const acceptance = submit.indexOf('leadSent = res.ok;');
  assert.ok(reset >= 0 && wait > reset && acceptance > wait);
});

test('the submission handler retains its duplicate/inactive-screen guard', () => {
  assert.match(source, /if\(submitting \|\| current !== 'q3'\) return;/);
});

(async () => {
  let failed = 0;
  console.log('Source: ' + sourcePath);
  for (const entry of cases) {
    try {
      await entry.run();
      console.log('PASS ' + entry.name);
    } catch (error) {
      failed++;
      console.error('FAIL ' + entry.name + ': ' + error.message);
    }
  }
  console.log(`${cases.length - failed}/${cases.length} checks passed. Unit/source-contract coverage only; no browser, live delivery, CRM or SMS verification.`);
  process.exitCode = failed ? 1 : 0;
})();
