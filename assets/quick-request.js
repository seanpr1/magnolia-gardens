/* Quick-request presentation. Shared behavior lives in form-core.js. */
(function(){
  'use strict';
  const form=document.getElementById('quickRequest');
  const core=window.MG_FORM_CORE;
  if(!form||!core)return;
  const button=document.getElementById('requestSubmit');
  const error=document.getElementById('requestError');
  const result=document.getElementById('requestResult');
  const service=form.elements.service;
  const services={mowing:'Recurring mowing',maintenance:'Full grounds care',cleanup:'One-time cleanup',mulch:'Mulch & beds',brush:'Brush clearing',other:'Other / not sure yet'};
  const params=new URLSearchParams(location.search);
  if(Object.prototype.hasOwnProperty.call(services,params.get('service')))service.value=params.get('service');
  if(['compact','midsize','spacious','estate'].includes(params.get('size')))form.elements.lawn_size.value=params.get('size');
  if(['weekly','biweekly','onetime'].includes(params.get('freq')))form.elements.frequency.value=params.get('freq');
  function updateTextLinks(){
    document.querySelectorAll('[href^="sms:"]').forEach(a=>{a.href=core.smsHref(service.value);});
  }
  updateTextLinks();
  service.addEventListener('change',()=>{form.elements.lawn_size.value='';form.elements.frequency.value='';updateTextLinks();});
  if(params.get('details')==='1')form.querySelector('details').open=true;
  ['phone','email'].forEach(k=>form.elements[k].setAttribute('aria-describedby','requestError'));
  let touch=false;
  document.addEventListener('pointerdown',e=>{touch=e.pointerType==='touch'||e.pointerType==='pen';},true);
  document.addEventListener('keydown',()=>{touch=false;},true);
  document.querySelectorAll('[href^="sms:"],[href^="tel:"]').forEach(a=>a.addEventListener('click',()=>{
    const text=a.getAttribute('href').startsWith('sms:');
    if(text)a.href=core.smsHref(service.value);
    core.track(text?'click_to_text':'click_to_call',{location:'quick_request'});
  }));
  core.bind(form,{
    location:'estimator',mirror:true,
    readValues:()=>({service:service.value,lawn_size:form.elements.lawn_size.value,frequency:form.elements.frequency.value}),
    preparePayload:payload=>{
      payload.set('service',services[service.value]||'Not specified');
      payload.set('project_scope',form.elements.message.value.trim());
    },
    onInvalid:info=>{
      if(info.field&&info.field.closest('details'))info.field.closest('details').open=true;
      error.hidden=false;
      error.textContent=info.reason==='invalid_phone'?'Please enter a phone number with at least 10 digits.':'Please enter a valid email address, or leave email blank.';
      const target=touch?error:info.field;
      if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'nearest'});}
    },
    onBusy:busy=>{error.hidden=true;button.textContent=busy?'Sending…':'Request my quote';},
    onResult:status=>{
      form.hidden=true;result.hidden=false;
      const title=status==='accepted'?'Your request was sent.':'We couldn’t confirm delivery.';
      const message=status==='accepted'
        ? 'Want to add photos or details? You can text us below.'
        : 'Your request may already have arrived. Please text or call us below to continue.';
      result.replaceChildren();
      const heading=document.createElement('h2');heading.textContent=title;
      const body=document.createElement('p');body.textContent=message;
      result.append(heading,body);
      if(status!=='accepted')result.append(core.recoveryDetails(form));
      result.focus({preventScroll:true});result.scrollIntoView({block:'nearest'});
    }
  });
})();
