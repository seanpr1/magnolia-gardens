(function(){
  'use strict';
  const form=document.getElementById('quickRequest');
  if(!form)return;
  const button=document.getElementById('requestSubmit');
  const error=document.getElementById('requestError');
  const result=document.getElementById('requestResult');
  const service=form.elements.service;
  const services={mowing:'Recurring mowing',maintenance:'Full grounds care',cleanup:'One-time cleanup',mulch:'Mulch & beds',brush:'Brush clearing',other:'Other / not sure yet'};
  const sizes=['compact','midsize','spacious','estate'];
  const frequencies=['weekly','biweekly','onetime'];
  let submitting=false,finished=false,touch=false;
  const params=new URLSearchParams(location.search);
  if(Object.prototype.hasOwnProperty.call(services,params.get('service')))service.value=params.get('service');
  if(sizes.includes(params.get('size')))form.elements.lawn_size.value=params.get('size');
  if(frequencies.includes(params.get('freq')))form.elements.frequency.value=params.get('freq');
  service.addEventListener('change',()=>{form.elements.lawn_size.value='';form.elements.frequency.value='';});
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(k=>{form.elements[k].value=params.get(k)||'';});
  form.elements.page_url.value=location.href;
  if(params.get('details')==='1')form.querySelector('details').open=true;
  ['phone','email'].forEach(k=>form.elements[k].setAttribute('aria-describedby','requestError'));
  document.addEventListener('pointerdown',e=>{touch=e.pointerType==='touch'||e.pointerType==='pen';},true);
  document.addEventListener('keydown',()=>{touch=false;},true);
  const stages=window.MG_FORM_METRICS&&window.MG_FORM_METRICS.bind(form,'estimator',()=>({service:service.value}));
  function track(name,data){if(window.MG_ANALYTICS_OK&&window.gtag)window.gtag('event',name,data);}
  function textHref(){
    const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    const description=form.elements.message.value.trim();
    const address=form.elements.address.value.trim();
    const body='Hi Magnolia Gardens — I would like a quote'+(service.value?' for '+services[service.value]:'')+(address?' at '+address:'')+'.'+(description?' '+description:'');
    return 'sms:+14233909954'+(ios?'&':'?')+'body='+encodeURIComponent(body);
  }
  document.querySelectorAll('[data-contact]').forEach(a=>a.addEventListener('click',()=>{
    if(a.dataset.contact==='text')a.href=textHref();
    track(a.dataset.contact==='text'?'click_to_text':'click_to_call',{location:'quick_request'});
  }));
  // Timeout means delivery is unknown. Never resend automatically.
  function postWithDeadline(url,options){
    const controller=new AbortController();let timer;
    const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('formspree_timeout'));},15000);});
    return Promise.race([Promise.resolve().then(()=>fetch(url,Object.assign({},options,{signal:controller.signal}))),deadline]).finally(()=>clearTimeout(timer));
  }
  function showResult(sent){
    finished=true;form.hidden=true;result.hidden=false;
    result.innerHTML=sent
      ? '<h2>Your request was sent.</h2><p>We’ll follow up about your yard. Want to add photos or details? You can text them below.</p>'
      : '<h2>We couldn’t confirm delivery.</h2><p>Please text or call us below to continue. Your details are included when you open the text link.</p>';
    result.focus({preventScroll:true});result.scrollIntoView({block:'nearest'});
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(submitting||finished)return;
    if(form.elements._gotcha.value){showResult(true);return;}
    const phoneInvalid=form.elements.phone.value.replace(/\D/g,'').length<10;
    const emailInvalid=!form.elements.email.validity.valid;
    form.elements.phone.setAttribute('aria-invalid',String(phoneInvalid));
    form.elements.email.setAttribute('aria-invalid',String(emailInvalid));
    if(phoneInvalid||emailInvalid){
      if(emailInvalid)form.querySelector('details').open=true;
      error.hidden=false;error.textContent=phoneInvalid?'Please enter a phone number with at least 10 digits.':'Please enter a valid email address, or leave email blank.';
      const focus=touch?error:(phoneInvalid?form.elements.phone:form.elements.email);
      focus.focus({preventScroll:true});focus.scrollIntoView({block:'nearest'});return;
    }
    error.hidden=true;form.elements.submitted_at.value=new Date().toISOString();
    const payload=new FormData(form);
    payload.set('service',services[service.value]||'Not specified');
    // Retain both existing message fields for downstream readers; neither is required.
    payload.set('project_scope',form.elements.message.value.trim());
    const controls=Array.from(form.querySelectorAll('input,textarea,select,button')).map(el=>({el,disabled:el.disabled}));
    submitting=true;form.setAttribute('aria-busy','true');controls.forEach(({el})=>{el.disabled=true;});button.textContent='Sending…';
    let sent=false;
    try{
      // Preserve the existing mirror. Its no-cors response is not delivery proof.
      try{fetch('https://hooks.zapier.com/hooks/catch/27365121/46gfqem/',{method:'POST',body:payload,mode:'no-cors',keepalive:true}).catch(()=>{});}catch(_){}
      const response=await postWithDeadline(form.action,{method:'POST',body:payload,headers:{Accept:'application/json'}});sent=response.ok;
    }catch(_){}
    controls.forEach(({el,disabled})=>{el.disabled=disabled;});form.removeAttribute('aria-busy');submitting=false;button.textContent='Request my quote';
    if(sent){if(stages)stages.accepted();track('lead_submit',{form_location:'estimator',service:service.value||'unknown'});track('generate_lead',{form_id:'quickRequest'});}
    else track('form_submit_error',{reason:'formspree_post_failed',form_location:'estimator'});
    showResult(sent);
  });
})();
