/* Canonical conversion: mg_form_accepted = Formspree HTTP acceptance only.
   Legacy lead_submit/generate_lead aliases must not be added to that count. */
(function () {
  'use strict';
  var SERVICES = ['mowing', 'maintenance', 'cleanup', 'mulch', 'brush', 'other'];
  var LOCATIONS = ['hero', 'detailed', 'estimator', 'quote_block'];
  var REASONS = ['invalid_phone', 'invalid_email', 'http_rejected', 'network_failure', 'timeout'];
  function allowed(value, values) { return values.indexOf(value) >= 0 ? value : 'unknown'; }
  function track(name, input) {
    try {
      if (!window.MG_ANALYTICS_OK || typeof window.gtag !== 'function') return;
      if (['mg_form_view', 'mg_form_start', 'mg_form_attempt', 'mg_form_invalid', 'mg_form_error', 'mg_form_accepted',
        'lead_submit', 'generate_lead', 'click_to_text', 'click_to_call', 'estimator_entry', 'cta_jump', 'form_open'].indexOf(name) < 0) return;
      var p = input || {}, safe = {};
      if ('form_location' in p) safe.form_location = allowed(p.form_location, LOCATIONS);
      if ('service' in p) safe.service = allowed(p.service, SERVICES);
      if ('lawn_size' in p) safe.lawn_size = allowed(p.lawn_size, ['compact', 'midsize', 'spacious', 'estate']);
      if ('frequency' in p) safe.frequency = allowed(p.frequency === 'onetime' ? 'one_off' : p.frequency, ['weekly', 'biweekly', 'one_off']);
      if ('reason' in p) safe.reason = allowed(p.reason, REASONS);
      if ('form_id' in p) safe.form_id = allowed(p.form_id, ['heroIntakeForm', 'intakeForm', 'quickRequest', 'quoteBlockForm']);
      ['location', 'source'].forEach(function (key) {
        if (key in p) safe[key] = allowed(p[key], LOCATIONS.concat(['quick_request', 'nav', 'footer', 'floating', 'error_panel', 'final_cta', 'other', 'sticky_mobile', 'hero_primary', 'pricing_section', 'fall_section', 'cta_repeat', 'toggle']));
      });
      if (p.transport_type === 'beacon') safe.transport_type = 'beacon';
      if (name.indexOf('mg_form_') === 0) {
        safe.measurement_version = '3';
        safe.acceptance_provider = name === 'mg_form_accepted' ? 'formspree' : 'not_applicable';
      }
      window.gtag('event', name, safe);
    } catch (_) { /* Measurement cannot change the customer's outcome. */ }
  }
  window.MG_FORM_METRICS = {
    track: track,
    bind: function (root, location, readValues) {
      var viewed = false, started = false, accepted = false, submittedValues;
      function props() {
        var v = {};
        try { v = (readValues && readValues()) || {}; } catch (_) {}
        return { form_location: allowed(location, LOCATIONS), service: allowed(v.service, SERVICES),
          lawn_size: allowed(v.lawn_size, ['compact', 'midsize', 'spacious', 'estate']),
          frequency: allowed(v.frequency === 'onetime' ? 'one_off' : v.frequency, ['weekly', 'biweekly', 'one_off']) };
      }
      function send(stage, reason) {
        var p = Object.assign({}, (stage === 'accepted' || stage === 'error') && submittedValues ? submittedValues : props());
        if (reason) p.reason = allowed(reason, REASONS);
        track('mg_form_' + stage, p);
      }
      function view() { if (!viewed) { viewed = true; send('view'); } }
      function start() { view(); if (!started) { started = true; send('start'); } }
      try {
        if ('IntersectionObserver' in window) {
          var observer = new IntersectionObserver(function (entries) {
            if (entries.some(function (entry) { return entry.isIntersecting && entry.intersectionRatio >= 0.25; })) {
              view(); observer.disconnect();
            }
          }, { threshold: 0.25 });
          observer.observe(root);
        }
      } catch (_) {}
      ['input', 'change', 'pointerdown', 'keydown'].forEach(function (event) {
        root.addEventListener(event, function (e) {
          if (!e.isTrusted) return;
          if (event === 'keydown' && ['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'Escape'].indexOf(e.key) >= 0) return;
          if (e.target && e.target.closest && e.target.closest('input,textarea,select,button,summary')) start();
        });
      });
      return {
        attempt: function () { view(); send('attempt'); },
        invalid: function (reason) { send('invalid', reason); },
        error: function (reason) { send('error', reason); },
        accepted: function () { if (!accepted) { accepted = true; send('accepted'); } },
        capture: function () { submittedValues = props(); },
        values: function () { return submittedValues || props(); }
      };
    }
  };
})();
