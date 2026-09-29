/* Bounded diagnostics: never forward raw error messages, URLs or form values. */
(function(){
  'use strict';
  if(!window.MG_ANALYTICS_OK)return;
  var count=0,queue=[];
  function flush(){
    if(typeof window.gtag!=='function')return;
    while(queue.length){
      var data=queue.shift();
      try{window.gtag('event','exception',data);}catch(_){}
    }
  }
  function report(code){
    if(count++>=5)return;
    queue.push({description:code,fatal:false});
    flush();
  }
  window.addEventListener('error',function(event){
    report(event.target&&event.target!==window?'resource_load_error':'script_error');
  },true);
  window.addEventListener('unhandledrejection',function(){report('promise_rejection');});
  var timer=setInterval(flush,500);
  setTimeout(function(){clearInterval(timer);queue=[];},10000);
})();
