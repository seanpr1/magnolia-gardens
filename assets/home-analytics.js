/* Deferred after configuration and campaign capture, before form metrics.
   Load every production provider without blocking HTML parsing. Previews stay
   untracked; provider receipt is separate from loader initialization. */
(function () {
  'use strict';
  window.MG_ANALYTICS_OK = !!(window.MG_SITE_CONFIG && window.MG_SITE_CONFIG.analytics.productionHosts.includes(location.hostname));
  if (!window.MG_ANALYTICS_OK) return;

  // GA4 property G-V93YBHW1PJ. Queue configuration/events before download.
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-V93YBHW1PJ');
  var gaLoader = document.createElement('script');
  gaLoader.async = true;
  gaLoader.src = 'https://www.googletagmanager.com/gtag/js?id=G-V93YBHW1PJ';
  document.head.appendChild(gaLoader);

  // Cloudflare Web Analytics: retain the existing public beacon token.
  var cfBeacon = document.createElement('script');
  cfBeacon.defer = true;
  cfBeacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  cfBeacon.setAttribute('data-cf-beacon', '{"token": "5168b9dfab9f4dd390f2447100a6e3db"}');
  document.head.appendChild(cfBeacon);

  // Clarity: preserve the early-call queue until the provider loads.
  (function (c,l,a,r,i,t,y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t,y);
  })(window, document, 'clarity', 'script', 'xiib0yey5e');

  // Meta Pixel: same production allowlist, ID, queue and PageView. No noscript
  // fallback: it cannot check the hostname and would fire on previews.
  !function(f,b,e,v,n,t,s) {
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', '1529884685261202');
  window.fbq('track', 'PageView');
})();
