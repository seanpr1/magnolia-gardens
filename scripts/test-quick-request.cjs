#!/usr/bin/env node
'use strict';
// Runs entirely in an isolated DOM. Dependencies are pinned by npm ci.
// No resource loader is enabled; every fetch is mocked before any app code runs.
const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(process.env.SITE_ROOT||path.resolve(__dirname,'..'));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
let assertions=0;
function setup(file,query='',mode='ok'){
 const dom=new JSDOM(read(file),{url:'https://example.invalid/'+file.replace('index.html','')+query,runScripts:'outside-only'});
 const w=dom.window,posts=[],events=[],errors=[];
 w.fetch=async(url,opts)=>{posts.push({url,data:Object.fromEntries(opts.body.entries())});if(mode==='network')throw Error('offline');if(mode==='timeout')return new Promise(()=>{});return{ok:mode==='ok',status:mode==='ok'?200:422};};
 const set=w.setTimeout.bind(w);w.setTimeout=(fn,ms)=>set(fn,ms===15000?(mode==='timeout'?5:100):0);
 w.AbortController=AbortController;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.matchMedia=()=>({matches:true,addEventListener(){}});w.gtag=(...a)=>events.push(a);w.MG_ANALYTICS_OK=true;
 w.addEventListener('error',e=>errors.push(e.message));
 w.eval(read('assets/site-config.js'));
 w.eval(read('assets/campaign-context.js'));
 w.eval(read('assets/form-metrics.js'));
 w.eval(read('assets/form-core.js'));
 const $=s=>w.document.querySelector(s);
 const submit=form=>form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const settle=async()=>{await new Promise(r=>setTimeout(r,20));assert.deepEqual(errors,[]);};
 return{dom,w,posts,events,$,submit,settle};
}
function oneRequired(form){
 assert.deepEqual([...form.querySelectorAll('[required]')].map(el=>el.name),['phone']);
 assert.equal(form.querySelector('details').open,false);
 assert.deepEqual([...form.querySelectorAll('input:not([type=hidden]),textarea,select')].filter(el=>!el.closest('details')&&el.name!=='_gotcha').map(el=>el.name),['phone']);
 assertions++;
}
(async()=>{
 for(const query of ['', '?service=cleanup','?service=mulch','?service=brush','?service=mowing&size=midsize&freq=biweekly']){
  const h=setup('estimate/index.html',query);h.w.eval(read('assets/quick-request.js'));const f=h.$('#quickRequest');oneRequired(f);
  f.elements.phone.value='(423) 555-0100';h.submit(f);h.submit(f);await h.settle();
  assert.equal(h.posts.length,2);assert.equal(h.posts[0].data.phone,'(423) 555-0100');assert.equal(h.posts[0].data.message,'');assert.match(h.$('#requestResult').textContent,/request was sent/);assert.equal(f.hidden,true);
  assert.equal(h.events.some(e=>JSON.stringify(e).includes('555-0100')),false);assert.equal(h.events.some(e=>e[1]==='generate_lead'&&'value' in e[2]),false);
  if(query.includes('size=')){assert.equal(h.posts[0].data.lawn_size,'midsize');assert.equal(h.posts[0].data.frequency,'biweekly');}
  h.dom.window.close();assertions++;
 }
 for(const mode of ['http','network','timeout']){
  const h=setup('estimate/index.html','',mode);h.w.eval(read('assets/quick-request.js'));const f=h.$('#quickRequest');f.elements.phone.value='4235550100';f.elements.message.value='Please mulch <b>these beds</b>';h.submit(f);await h.settle();
  assert.match(h.$('#requestResult').textContent,/couldn’t confirm/);assert.equal(h.posts.length,2);assert.equal(h.events.some(e=>e[1]==='generate_lead'),false);
  const a=h.$('[data-contact=text]');a.addEventListener('click',e=>e.preventDefault());a.click();assert.doesNotMatch(decodeURIComponent(a.href),/mulch <b>these beds<\/b>/);assert.equal(f.elements.message.value,'Please mulch <b>these beds</b>');assert.match(h.$('.request-recovery textarea').value,/mulch <b>these beds<\/b>/);assert.equal(h.posts.length,2);h.dom.window.close();assertions++;
 }
 {
  const h=setup('estimate/index.html','?service=mulch');h.w.eval(read('assets/quick-request.js'));const f=h.$('#quickRequest');
  h.submit(f);await h.settle();assert.equal(h.posts.length,0);assert.equal(f.elements.phone.getAttribute('aria-invalid'),'true');
  f.elements.phone.value='4235550100';f.elements.email.value='invalid';h.submit(f);await h.settle();assert.equal(h.posts.length,0);assert.equal(f.querySelector('details').open,true);
  f.elements.email.value='';f.elements.message.value='Mulch two beds';f.elements.name.value='Test';f.elements.address.value='37664';h.submit(f);await h.settle();assert.equal(h.posts[0].data.message,'Mulch two beds');assert.equal(h.posts[0].data.project_scope,'Mulch two beds');assert.equal(h.posts[0].data.name,'Test');assert.equal(h.posts[0].data.address,'37664');h.dom.window.close();assertions++;
 }
 // Text destinations are ready before click and follow the allowed service.
 {
  const h=setup('estimate/index.html','?service=cleanup');
  Object.defineProperty(h.w.navigator,'userAgent',{value:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'});
  h.w.eval(read('assets/quick-request.js'));
  const sms=h.$('[data-contact=text]'),service=h.$('#quickRequest').elements.service;
  assert.match(sms.href,/&body=/);assert.match(decodeURIComponent(sms.href),/yard cleanup/);
  service.value='mulch';service.dispatchEvent(new h.w.Event('change'));
  assert.match(decodeURIComponent(sms.href),/mulch and beds/);assert.equal(h.posts.length,0);
  h.dom.window.close();assertions++;
 }
 {
  const h=setup('estimate/planning/index.html');h.w.eval(read('assets/pricing.js'));h.w.eval(read('assets/planning-range.js'));assert.equal(h.$('form'),null);
  for(const svc of ['mowing','maintenance'])for(const size of ['compact','midsize','spacious','estate'])for(const freq of ['weekly','biweekly','onetime']){
   h.$('#plan-service').value=svc;h.$('#plan-size').value=size;h.$('#plan-frequency').value=freq;h.$('#plan-size').dispatchEvent(new h.w.Event('change'));
   const e=h.w.MG_PRICING.calc(svc,size,freq);assert.equal(h.$('#plan-result').textContent,h.w.MG_PRICING.money(e.low)+'–'+h.w.MG_PRICING.money(e.high)+' per visit · '+e.freqLabel);
  }
  assert.equal(h.posts.length,0);h.dom.window.close();assertions+=24;
 }
 // Both homepage forms accept phone-only and keep optional input in the same request.
 for(const id of ['heroIntakeForm','intakeForm']){
  const h=setup('index.html');const script=read('assets/home-forms.js');
  h.w.eval(script);const f=h.$('#'+id);oneRequired(f);f.elements.phone.value='4235550100';f.elements.email.value='bad';h.submit(f);await h.settle();assert.equal(h.posts.length,0);assert.equal(f.querySelector('details').open,true);
  f.elements.email.value='';f.elements.message.value='Please quote a cleanup';h.submit(f);h.submit(f);await h.settle();assert.equal(h.posts.length,2);assert.equal(h.posts[0].data.message,'Please quote a cleanup');h.dom.window.close();assertions++;
 }
 for(const page of ['services/cleanup/index.html','areas/kingsport/index.html']){
  const h=setup(page);h.w.eval(read('assets/pricing.js'));const mount=h.$('script[src^="/assets/quote-block.js"]');Object.defineProperty(h.w.document,'currentScript',{value:mount});h.w.eval(read('assets/quote-block.js'));
  const f=h.$('.mgqb form');oneRequired(f);f.elements.phone.value='4235550100';f.elements.message.value='Project details';h.submit(f);h.submit(f);await h.settle();assert.equal(h.posts.length,1);assert.equal(h.posts[0].data.message,'Project details');h.dom.window.close();assertions++;
 }
 // Exercise complete adapters with each transport outcome and broken telemetry.
 // A terminal result must never reopen submission or expose entered details in URLs.
 const variants=[
  {page:'index.html',script:'home-forms',form:'#heroIntakeForm',success:'#heroThanks',error:'#heroError',location:'hero',posts:2},
  {page:'index.html',script:'home-forms',form:'#intakeForm',success:'#intakeThanks',error:'#intakeError',location:'detailed',posts:2},
  {page:'estimate/index.html',script:'quick-request',form:'#quickRequest',success:'#requestResult',error:'#requestResult',location:'estimator',posts:2},
  {page:'services/cleanup/index.html',script:'quote-block',form:'.mgqb form',success:'.mgqb-panel',error:'.mgqb-panel',location:'quote_block',posts:1}
 ];
 for(const v of variants)for(const mode of ['ok','http','network','timeout'])for(const tracker of ['working','throwing']){
  const h=setup(v.page,'',mode);
  if(tracker==='throwing')h.w.gtag=(...args)=>{h.events.push(args);throw Error('synthetic tracker failure');};
  if(v.script==='quote-block')Object.defineProperty(h.w.document,'currentScript',{value:h.$('script[src^="/assets/quote-block.js"]')});
  h.w.eval(read('assets/'+v.script+'.js'));
  const f=h.$(v.form);f.elements.phone.value='4235550100';
  if(f.elements.service)f.elements.service.value='cleanup';
  f.elements.message.value='Private note 42 Test Street';
  h.submit(f);h.submit(f);await h.settle();
  const visible=el=>el&&!el.hidden&&el.style.display!=='none';
  assert.equal(visible(f),false,v.location+' '+mode+' hides completed form');
  assert.equal(f.hasAttribute('aria-busy'),false);
  const result=h.$(mode==='ok'?v.success:v.error);
  assert.equal(visible(result),true);
  assert.match(result.textContent,mode==='ok'?/request was sent/:mode==='http'&&v.posts===1?/couldn’t send/:/couldn’t confirm/);
  if(v.success!==v.error)assert.equal(visible(h.$(mode==='ok'?v.error:v.success)),false);
  const accepted=h.events.filter(e=>e[1]==='mg_form_accepted');
  assert.equal(accepted.length,mode==='ok'?1:0);
  assert.equal(h.events.filter(e=>e[1]==='mg_form_attempt').length,1);
  if(mode==='ok')assert.equal(accepted[0][2].service,'cleanup');
  else{
   const failure=h.events.find(e=>e[1]==='mg_form_error');
   assert.equal(failure[2].reason,{http:'http_rejected',network:'network_failure',timeout:'timeout'}[mode]);
   assert.equal(h.events.some(e=>['lead_submit','generate_lead'].includes(e[1])),false);
   const recovery=result.querySelector('.request-recovery textarea');
   assert.match(recovery.value,/Private note 42 Test Street/);
   assert.equal(recovery.readOnly,true);assert.equal(recovery.getAttribute('data-clarity-mask'),'true');
  }
  h.submit(f);await h.settle();assert.equal(h.posts.length,v.posts);
  assert.doesNotMatch(JSON.stringify(h.events),/4235550100|Test Street|Private note/);
  for(const a of h.w.document.querySelectorAll('a[href^="sms:"]'))assert.doesNotMatch(decodeURIComponent(a.href),/4235550100|Test Street|Private note/);
  h.dom.window.close();assertions++;
 }
 console.log('PASS '+assertions+' quick-request, validation, delivery, homepage/service-form and calculator checks; 0 live requests.');
})().catch(e=>{console.error(e);process.exit(1);});
