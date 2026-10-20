(function(){
  'use strict';
  const menu = document.querySelector('.mobile-nav');
  if(!menu) return;
  const summary = menu.querySelector('summary');
  menu.addEventListener('click', function(event){
    if(event.target.closest('a')) menu.open = false;
  });
  document.addEventListener('keydown', function(event){
    if(event.key === 'Escape' && menu.open){ menu.open = false; summary.focus(); }
  });
  document.addEventListener('click', function(event){
    if(menu.open && !menu.contains(event.target)) menu.open = false;
  });
  window.matchMedia('(min-width:1041px)').addEventListener('change', function(event){
    if(event.matches) menu.open = false;
  });
})();

// Service-page text links share the form's fixed topic and native SMS behavior.
// Keep meaningful static links when shared form code is unavailable.
(function(){
  var apple=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  document.querySelectorAll('a[href^="sms:"]').forEach(function(a){
    var service=a.getAttribute('data-sms-service');
    var core=window.MG_FORM_CORE;
    var href=service && core && typeof core.smsHref==='function' ? core.smsHref(service) : '';
    if(href) a.href=href;
    else a.href=a.href.replace(/[?&]body=/, (apple?'&':'?')+'body=');
  });
})();
