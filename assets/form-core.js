/* Shared request controller. Only Formspree HTTP acceptance is a conversion.
   Every transport outcome is terminal: recovery uses native text/call links. */
(function () {
  'use strict';
  var bindings = new WeakMap();
  var rawDiagnosticAttempted = false;
  // One explicitly armed sample per page, across all forms; never persisted.
  function mirrorRawDiagnostic(payload, cfg, config) {
    try {
      var diagnostic = config.rawHookDiagnostic, now = Date.now();
      if (rawDiagnosticAttempted || !cfg.mirror || !config.zapierMirror || !diagnostic) return;
      if (!Number.isFinite(diagnostic.expiresAt) || diagnostic.expiresAt <= now || diagnostic.expiresAt > now + 300000) return;
      if (typeof diagnostic.url !== 'string' || !/^https:\/\/hooks\.zapier\.com\/hooks\/catch\/\d+\/[A-Za-z0-9_-]+\/?$/.test(diagnostic.url)) return;
      if ([config.zapierMirror, config.formspree].some(function (url) { return diagnostic.url.replace(/\/$/, '') === url.replace(/\/$/, ''); })) return;
      rawDiagnosticAttempted = true;
      var url = diagnostic.url;
      // No keepalive: do not consume the existing mirror's shared body quota.
      // An opaque response proves no receipt. Failure never affects intake.
      Promise.resolve().then(function () {
        return fetch(url, { method: 'POST', body: payload, mode: 'no-cors' });
      }).catch(function () {});
    } catch (_) {}
  }
  function call(fn, value) { try { if (typeof fn === 'function') return fn(value); } catch (_) {} }
  function track(name, props) {
    try { if (window.MG_FORM_METRICS) window.MG_FORM_METRICS.track(name, props); } catch (_) {}
  }
  function post(url, payload, timeoutMs) {
    var timer, controller;
    try { controller = new AbortController(); } catch (_) { return Promise.resolve('network_failure'); }
    var deadline = new Promise(function (resolve) {
      timer = setTimeout(function () { resolve('timeout'); controller.abort(); }, timeoutMs);
    });
    var request = Promise.resolve().then(function () {
      return fetch(url, { method: 'POST', body: payload, headers: { Accept: 'application/json' }, signal: controller.signal });
    }).then(function (response) { return response.ok ? 'accepted' : 'http_rejected'; }, function () { return 'network_failure'; });
    return Promise.race([deadline, request]).finally(function () { clearTimeout(timer); });
  }
  function bind(form, options) {
    if (bindings.has(form)) return bindings.get(form);
    var cfg = options || {}, state = 'idle', stages;
    try { if (window.MG_FORM_METRICS) stages = window.MG_FORM_METRICS.bind(form, cfg.location, cfg.readValues); } catch (_) {}
    function metric(method, value) { try { if (stages && stages[method]) return stages[method](value); } catch (_) {} }
    function finish(status, controls, suppressed) {
      // Commit terminal state before UI or telemetry code can throw/reenter.
      state = status;
      (controls || []).forEach(function (record) { record.element.disabled = record.disabled; });
      form.removeAttribute('aria-busy');
      call(cfg.onBusy, false);
      call(cfg.onResult, status);
      if (suppressed) return;
      if (status === 'accepted') {
        metric('accepted');
        var props = metric('values') || { form_location: cfg.location };
        track('lead_submit', props);
        track('generate_lead', { form_id: form.id || 'quoteBlockForm' });
      } else metric('error', status);
    }
    async function submit(event) {
      if (event && event.preventDefault) event.preventDefault();
      if (state !== 'idle') return state;
      if (form.elements._gotcha && form.elements._gotcha.value) { finish('accepted', [], true); return state; }
      metric('attempt');
      var phone = form.elements.phone, email = form.elements.email;
      var phoneInvalid = !phone || phone.value.replace(/\D/g, '').length < 10;
      var emailInvalid = !!(email && !email.validity.valid);
      if (phone) phone.setAttribute('aria-invalid', String(phoneInvalid));
      if (email) email.setAttribute('aria-invalid', String(emailInvalid));
      if (emailInvalid) { var details = email.closest('details'); if (details) details.open = true; }
      if (phoneInvalid || emailInvalid) {
        var reason = phoneInvalid ? 'invalid_phone' : 'invalid_email';
        metric('invalid', reason);
        call(cfg.onInvalid, { reason: reason, field: phoneInvalid ? phone : email });
        return 'invalid';
      }
      state = 'submitting';
      var payload, controls = [];
      var config = (window.MG_SITE_CONFIG && window.MG_SITE_CONFIG.forms) || {};
      try {
        payload = new FormData(form);
        payload.set('submitted_at', new Date().toISOString());
        if (cfg.preparePayload) cfg.preparePayload(payload);
        metric('capture');
        // Apply last so legacy adapter metadata cannot reintroduce raw URLs.
        try { if (window.MG_CAMPAIGN) window.MG_CAMPAIGN.apply(payload); } catch (_) {}
        controls = Array.from(form.querySelectorAll('input,textarea,select,button')).map(function (element) { return { element: element, disabled: element.disabled }; });
        form.setAttribute('aria-busy', 'true');
        controls.forEach(function (record) { record.element.disabled = true; });
        call(cfg.onBusy, true);
        if (!config.formspree) { finish('network_failure', controls); return state; }
        // Preserve the existing mirror. Its no-cors response proves no receipt.
        if (cfg.mirror && config.zapierMirror) {
          try { Promise.resolve(fetch(config.zapierMirror, { method: 'POST', body: payload, mode: 'no-cors', keepalive: true })).catch(function () {}); } catch (_) {}
        }
        var timeout = Number.isFinite(config.timeoutMs) && config.timeoutMs > 0 ? config.timeoutMs : 15000;
        var request = post(config.formspree, payload, timeout);
        mirrorRawDiagnostic(payload, cfg, config);
        var outcome = await request;
        finish(outcome, controls);
      } catch (_) { finish('network_failure', controls); }
      return state;
    }
    var api = { submit: submit, getState: function () { return state; } };
    bindings.set(form, api);
    form.addEventListener('submit', submit);
    // Native forms retain browser validation when JavaScript is unavailable.
    // Once bound, shared validation owns accessible errors and measurement.
    form.noValidate = true;
    return api;
  }
  function smsHref(topic) {
    var labels = { mowing: 'recurring mowing', maintenance: 'full grounds care', cleanup: 'a yard cleanup', mulch: 'mulch and beds', brush: 'brush clearing' };
    var base = window.MG_SITE_CONFIG && window.MG_SITE_CONFIG.contact && window.MG_SITE_CONFIG.contact.smsHref;
    if (!base) return '';
    var apple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var description = Object.prototype.hasOwnProperty.call(labels, topic) ? labels[topic] : 'my yard';
    return base + (apple ? '&' : '?') + 'body=' + encodeURIComponent('Hi Magnolia Gardens, I would like a quote for ' + description + '.');
  }
  function recoveryDetails(form) {
    var details = document.createElement('details');
    details.className = 'request-recovery';
    var summary = document.createElement('summary');
    summary.textContent = 'View the details you entered';
    var text = document.createElement('textarea');
    text.readOnly = true;
    text.rows = 6;
    text.setAttribute('aria-label', 'Your saved request details');
    text.setAttribute('data-clarity-mask', 'true');
    var lines = [];
    [['phone', 'Phone'], ['name', 'Name'], ['email', 'Email'], ['address', 'Address or ZIP'], ['service', 'Service'], ['message', 'Notes']].forEach(function (field) {
      var input = form && form.elements[field[0]];
      if (!input || !input.value.trim()) return;
      var value = input.options && input.selectedIndex >= 0 ? input.options[input.selectedIndex].text : input.value;
      lines.push(field[1] + ': ' + value.trim());
    });
    // Keep contact data in a masked input value, never markup, URLs or storage.
    text.value = lines.join('\n');
    details.appendChild(summary);
    details.appendChild(text);
    return details;
  }
  window.MG_FORM_CORE = { bind: bind, track: track, smsHref: smsHref, recoveryDetails: recoveryDetails };
})();
