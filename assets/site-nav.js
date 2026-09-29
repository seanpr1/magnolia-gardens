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

// Apple's Messages app uses an ampersand before the body parameter.
(function(){
  var apple=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(apple)document.querySelectorAll('a[href^="sms:"]').forEach(function(a){a.href=a.href.replace('?body=','&body=');});
})();
