(function(){
  'use strict';
  const P=window.MG_PRICING;
  const service=document.getElementById('plan-service'),size=document.getElementById('plan-size'),frequency=document.getElementById('plan-frequency');
  const result=document.getElementById('plan-result'),request=document.getElementById('plan-request');
  if(!P){result.textContent='The planning tool could not load. You can still request a quote below.';return;}
  const params=new URLSearchParams(location.search);
  if(['mowing','maintenance'].includes(params.get('service')))service.value=params.get('service');
  if(Object.prototype.hasOwnProperty.call(P.SIZE_LABEL,params.get('size')))size.value=params.get('size');
  if(Object.prototype.hasOwnProperty.call(P.FREQ_LABEL,params.get('freq')))frequency.value=params.get('freq');
  function update(){
    const query=new URLSearchParams({service:service.value});
    if(!size.value){result.textContent='Choose a lawn size to see a planning range.';request.href='/estimate/?'+query;return;}
    const estimate=P.calc(service.value,size.value,frequency.value);
    result.textContent=P.money(estimate.low)+'–'+P.money(estimate.high)+' per visit · '+estimate.freqLabel;
    query.set('size',size.value);query.set('freq',frequency.value);request.href='/estimate/?'+query;
  }
  [service,size,frequency].forEach(el=>el.addEventListener('change',update));
  update();
})();
