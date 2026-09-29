/* First touch within a 30-minute visit, retained across internal navigation.
   Contact fields and arbitrary URL query strings never enter this context. */
(function () {
  'use strict';
  var KEY = 'mg_campaign_v1', TTL = 30 * 60 * 1000;
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  function campaign(value) {
    if (typeof value !== 'string' || value.length > 100 || !/^[a-zA-Z0-9._~ -]*$/.test(value)) return '';
    if (/(?:\d[ ._-]*){7,}/.test(value)) return '';
    return value.trim();
  }
  function pagePath(value) {
    // Only public marketing paths are useful attribution. Drop arbitrary paths.
    return /^\/(?:|(?:estimate(?:\/planning)?|quote|hiring|apply|services\/(?:mowing|maintenance|cleanup|mulch|brush-clearing)|areas\/(?:kingsport|bristol|johnson-city))\/?)$/.test(value || '') ? value : '/';
  }
  function referrer(value) {
    try {
      var url = new URL(value);
      if (!/^https?:$/.test(url.protocol) || url.origin === location.origin || url.username || url.password) return '';
      return url.origin.length <= 200 ? url.origin : '';
    } catch (_) { return ''; }
  }
  function clean(saved) {
    if (!saved || typeof saved !== 'object' || !Number.isFinite(saved.captured_at) || !Number.isFinite(saved.expires_at) ||
      saved.captured_at > Date.now() || saved.expires_at <= Date.now() || saved.expires_at > Date.now() + TTL) return null;
    var out = { captured_at: saved.captured_at, expires_at: saved.expires_at, landing_path: pagePath(saved.landing_path), landing_referrer: referrer(saved.landing_referrer) };
    UTM.forEach(function (key) { out[key] = campaign(saved[key]); });
    return out;
  }
  function capture() {
    var now = Date.now(), out = { captured_at: now, expires_at: now + TTL, landing_path: pagePath(location.pathname), landing_referrer: referrer(document.referrer) };
    var params;
    try { params = new URLSearchParams(location.search); } catch (_) {}
    UTM.forEach(function (key) { out[key] = campaign(params ? params.get(key) || '' : ''); });
    return out;
  }
  var memory;
  try { memory = clean(JSON.parse(sessionStorage.getItem(KEY))); } catch (_) {}
  memory = memory || capture();
  memory.expires_at = Date.now() + TTL;
  function persist() { try { sessionStorage.setItem(KEY, JSON.stringify(memory)); } catch (_) {} }
  persist();
  function get() {
    if (memory.expires_at <= Date.now()) { memory = capture(); persist(); }
    return Object.assign({}, memory);
  }
  window.MG_CAMPAIGN = {
    get: get,
    apply: function (payload) {
      try {
        var current = get(), submittingPath = pagePath(location.pathname);
        UTM.forEach(function (key) { payload.set(key, current[key]); });
        payload.set('landing_path', current.landing_path);
        payload.set('landing_referrer', current.landing_referrer);
        payload.set('submitting_path', submittingPath);
        payload.set('page_url', location.origin + submittingPath);
        payload.set('referrer', current.landing_referrer);
      } catch (_) { /* Attribution is optional; never block a request. */ }
    }
  };
})();
