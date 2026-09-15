/* Versioned browser form stages. Acceptance means Formspree HTTP acceptance,
   never CRM creation, a sent message, or a confirmed customer. No PII. */
(function () {
  'use strict';
  var SERVICES = ['mowing', 'maintenance', 'cleanup', 'mulch', 'brush'];
  var SIZES = ['compact', 'midsize', 'spacious', 'estate'];
  var FREQUENCIES = ['weekly', 'biweekly', 'one_off'];
  function allowed(value, values) {
    return values.indexOf(value) >= 0 ? value : 'unknown';
  }
  window.MG_FORM_METRICS = {
    bind: function (root, location, readValues) {
      var viewed = false, started = false;
      function send(stage) {
        var v = readValues ? readValues() : {};
        var props = {
          form_location: allowed(location, ['hero', 'detailed', 'estimator', 'quote_block']),
          service: allowed(v.service, SERVICES),
          lawn_size: allowed(v.lawn_size, SIZES),
          frequency: allowed(v.frequency, FREQUENCIES),
          measurement_version: '2',
          acceptance_provider: stage === 'accepted' ? 'formspree' : 'not_applicable'
        };
        if (window.MG_ANALYTICS_OK && typeof window.gtag === 'function') {
          window.gtag('event', 'mg_form_' + stage, props);
        }
      }
      function view() { if (!viewed) { viewed = true; send('view'); } }
      function start() { view(); if (!started) { started = true; send('start'); } }
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          if (entries.some(function (e) { return e.isIntersecting && e.intersectionRatio >= 0.25; })) {
            view(); observer.disconnect();
          }
        }, { threshold: 0.25 });
        observer.observe(root);
      }
      ['input', 'change', 'focusin', 'click'].forEach(function (event) {
        root.addEventListener(event, function (e) {
          // Step-heading focus announces navigation; it is not form interaction.
          if (event !== 'focusin' || e.target.matches('input,textarea,select,button,a')) start();
        });
      });
      return { accepted: function () { start(); send('accepted'); } };
    }
  };
})();
