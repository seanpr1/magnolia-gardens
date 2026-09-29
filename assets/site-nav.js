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
