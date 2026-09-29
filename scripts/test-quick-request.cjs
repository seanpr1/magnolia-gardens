#!/usr/bin/env node
'use strict';
// Runs entirely in an isolated DOM. Install jsdom in your test environment.
// No resource loader is enabled; every fetch is mocked before any app code runs.
const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
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
 w.eval(read('assets/form-metrics.js'));
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
  const a=h.$('[data-contact=text]');a.addEventListener('click',e=>e.preventDefault());a.click();assert.match(decodeURIComponent(a.href),/mulch <b>these beds<\/b>/);assert.equal(h.posts.length,2);h.dom.window.close();assertions++;
 }
 {
  const h=setup('estimate/index.html','?service=mulch');h.w.eval(read('assets/quick-request.js'));const f=h.$('#quickRequest');
  h.submit(f);await h.settle();assert.equal(h.posts.length,0);assert.equal(f.elements.phone.getAttribute('aria-invalid'),'true');
  f.elements.phone.value='4235550100';f.elements.email.value='invalid';h.submit(f);await h.settle();assert.equal(h.posts.length,0);assert.equal(f.querySelector('details').open,true);
  f.elements.email.value='';f.elements.message.value='Mulch two beds';f.elements.name.value='Test';f.elements.address.value='37664';h.submit(f);await h.settle();assert.equal(h.posts[0].data.message,'Mulch two beds');assert.equal(h.posts[0].data.project_scope,'Mulch two beds');assert.equal(h.posts[0].data.name,'Test');assert.equal(h.posts[0].data.address,'37664');h.dom.window.close();assertions++;
 }
 // The calculator needs no form, contact capture, lead POST or duplicate record.
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
  const h=setup('index.html');const script=[...read('index.html').matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(x=>x.includes('function wireQuoteForm'));
  h.w.eval(script);const f=h.$('#'+id);oneRequired(f);f.elements.phone.value='4235550100';f.elements.email.value='bad';h.submit(f);await h.settle();assert.equal(h.posts.length,0);assert.equal(f.querySelector('details').open,true);
  f.elements.email.value='';f.elements.message.value='Please quote a cleanup';h.submit(f);h.submit(f);await h.settle();assert.equal(h.posts.length,2);assert.equal(h.posts[0].data.message,'Please quote a cleanup');h.dom.window.close();assertions++;
 }
 for(const page of ['services/cleanup/index.html','areas/kingsport/index.html']){
  const h=setup(page);h.w.eval(read('assets/pricing.js'));const mount=h.$('script[src="/assets/quote-block.js"]');Object.defineProperty(h.w.document,'currentScript',{value:mount});h.w.eval(read('assets/quote-block.js'));
  const f=h.$('.mgqb form');oneRequired(f);f.elements.phone.value='4235550100';f.elements.message.value='Project details';h.submit(f);h.submit(f);await h.settle();assert.equal(h.posts.length,1);assert.equal(h.posts[0].data.message,'Project details');h.dom.window.close();assertions++;
 }
 console.log('PASS '+assertions+' quick-request, validation, delivery, homepage/service-form and calculator checks; 0 live requests.');
})().catch(e=>{console.error(e);process.exit(1);});
