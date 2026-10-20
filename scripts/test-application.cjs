#!/usr/bin/env node
'use strict';
// Application regression checks. All transport is mocked; no live submissions.
const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(process.env.SITE_ROOT||path.join(__dirname,'..'));
const html=fs.readFileSync(path.join(root,'apply/index.html'),'utf8');
let cases=0;
function setup(query='',mode='ok'){
 const dom=new JSDOM(html,{url:'https://example.invalid/apply/'+query,runScripts:'outside-only'});
 const w=dom.window,posts=[],errors=[];
 w.addEventListener('error',e=>errors.push(e.message));
 w.AbortController=AbortController;
 w.fetch=async(url,options)=>{
  posts.push({url,data:options.body});
  if(mode==='network')throw Error('Synthetic network failure');
  if(mode==='pending')return new Promise(()=>{});
  return {ok:mode!=='rejected',status:mode==='rejected'?422:200,redirected:mode==='redirect',json:async()=>mode==='rejected'?{errors:[{field:'Leader - project example'}]}:mode==='unknown'?{}:{ok:true}};
 };
 const $=s=>w.document.querySelector(s);
 [...w.document.scripts].filter(s=>!s.src).forEach(s=>w.eval(s.textContent));
 const change=(selector,value)=>{const e=$(selector);e.value=value;e.dispatchEvent(new w.Event('change',{bubbles:true}));};
 const basics=()=>{
  change('#full-name','TEST ONLY Applicant');change('#phone','4235550100');change('#city','Kingsport');
  $('#flexible').checked=true;change('#start-timeframe','Within two weeks');change('#years','3 to 5 years');
  for(const name of ['Reliable transportation','18 or older','Authorized to work in US'])$("[name='"+name+"'][value='Yes']").checked=true;
  $('#accuracy').checked=true;
 };
 const leader=()=>{change('#leader-ownership','Ran projects and directed helpers');change('#leader-project','TEST: planned bed preparation and checked mulch finish.');change('#leader-helpers','TEST: assigned two helpers tasks and checked progress.');};
 const submit=()=>$('#app').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const settle=async()=>{await new Promise(r=>setImmediate(r));assert.deepEqual(errors,[]);};
 return {dom,w,$,posts,change,basics,leader,submit,settle};
}
async function scenario(fn){const h=setup(...(fn.args||[]));try{await fn(h);cases++;}finally{h.dom.window.close();}}
function withArgs(args,fn){fn.args=args;return fn;}
(async()=>{
 await scenario(async h=>{
  h.basics();h.submit();await h.settle();assert.equal(h.posts.length,0);
  assert.match(h.$('#alert').textContent,/Choose the opportunity/);
  assert.equal(h.$('#leader-details').hidden,true);
 });
 await scenario(withArgs(['?role=crew-member'],async h=>{
  h.basics();h.change('#years','None yet');h.submit();await h.settle();
  assert.equal(h.posts.length,1);assert.equal(h.$('#app').hidden,true);
  assert.equal(h.posts[0].data.get('Role applied for'),'General lawn and landscape crew');
  assert.equal(h.posts[0].data.has('Leader - project example'),false);
  assert.equal(h.posts[0].data.has('Email'),false);assert.equal(h.posts[0].data.has('email'),false);
  assert.equal(h.$('#general-opportunity').open,true);
  assert.equal(h.w.document.activeElement.id,'done');
  h.submit();assert.equal(h.posts.length,1);
 }));
 await scenario(withArgs(['?role=crew-leader'],async h=>{
  h.basics();h.submit();await h.settle();assert.equal(h.posts.length,0);
  assert.equal(h.$('#leader-details').hidden,false);
  assert.equal(h.w.document.activeElement.id,'alert');
  assert.equal(h.$('#leader-project').getAttribute('aria-invalid'),'true');
  h.$('#alert a[href="#leader-project"]').click();assert.equal(h.w.document.activeElement.id,'leader-project');
  h.leader();h.submit();await h.settle();assert.equal(h.posts.length,1);
  const data=h.posts[0].data;
  assert.equal(data.get('_subject'),'Crew leader application - Magnolia Gardens');
  assert.equal(data.get('Role applied for'),'Working landscape crew leader');
  assert.match(data.get('Leader - project example'),/^TEST:/);
  assert.equal(data.getAll('Days available').length,1);
 }));
 await scenario(withArgs(['?role=crew-leader'],async h=>{
  h.basics();h.leader();h.change('#role','General lawn and landscape crew');h.submit();await h.settle();
  assert.equal(h.posts[0].data.has('Leader - project example'),false);
  assert.equal(h.posts[0].data.has('Leader - guiding helpers'),false);
  assert.equal(h.posts[0].data.get('_subject'),'New job application - Magnolia Gardens');
 }));
 await scenario(withArgs(['?role=crew-leader'],async h=>{
  h.leader();h.change('#role','General lawn and landscape crew');
  h.change('#role','Working landscape crew leader');assert.match(h.$('#leader-project').value,/TEST:/);
  assert.equal(h.$('#leader-project').disabled,false);assert.equal(h.$('#leader-project').required,true);
 }));
 await scenario(withArgs(['?role=%3Cscript%3E'],async h=>{
  assert.equal(h.$('#role').value,'');assert.equal(h.$('#leader-details').hidden,true);
 }));
 await scenario(withArgs(['?role=crew-leader'],async h=>{
  h.basics();h.leader();h.change('#phone','');h.change('#email','test@example.invalid');
  h.$('#flexible').checked=false;h.$('[value="Mon"]').checked=true;h.$('[value="Tue"]').checked=true;
  h.submit();await h.settle();assert.equal(h.posts[0].data.get('email'),'test@example.invalid');
  assert.deepEqual(h.posts[0].data.getAll('Days available'),['Mon','Tue']);
 }));
 for(const mode of ['rejected','unknown','redirect','network'])await scenario(withArgs(['?role=crew-leader',mode],async h=>{
  h.basics();h.leader();h.submit();await h.settle();
  assert.equal(h.posts.length,1);assert.equal(h.$('#app').hidden,false);
  assert.equal(h.$('#done').classList.contains('show'),false);
  assert.equal(h.$('#send').disabled,false);assert.match(h.$('#leader-project').value,/TEST:/);
  assert.equal(h.$('#leader-project').disabled,false);
  if(mode==='rejected'){
   assert.equal(h.$('#leader-project').getAttribute('aria-invalid'),'true');
   h.change('#role','General lawn and landscape crew');
   assert.equal(h.$('#leader-details').hidden,true);assert.equal(h.$('#leader-project').hasAttribute('aria-invalid'),false);
  }
 }));
 await scenario(withArgs(['?role=crew-leader','pending'],async h=>{
  h.basics();h.leader();h.submit();h.submit();assert.equal(h.posts.length,1);
  assert.equal(h.$('#send').disabled,true);assert.equal(h.$('#role').disabled,true);
 }));
 // Markup remains honest without JS, including the email fallback and approved terms.
 const dom=new JSDOM(html);
 assert.match(dom.window.document.querySelector('noscript').textContent,/Apply by email/);
 assert.match(dom.window.document.querySelector('#leader-terms').textContent,/\$15–\$30 per hour, based on experience, plus bonus/);
 assert.match(dom.window.document.querySelector('#leader-terms').textContent,/Part-time seasonal/);
 assert.match(dom.window.document.querySelector('#general-opportunity').textContent,/\$15–\$30 per hour/);
 assert.match(dom.window.document.querySelector('#general-opportunity').textContent,/Part time and seasonal/);
 assert.match(dom.window.document.querySelector('#role-hint').textContent,/three short questions/);
 assert.equal(dom.window.document.querySelector('#app').action,'https://formspree.io/f/mgaewkjg');
 dom.window.close();cases++;
 console.log('PASS: '+cases+' application scenarios; zero live submissions.');
})().catch(error=>{console.error(error);process.exitCode=1;});
