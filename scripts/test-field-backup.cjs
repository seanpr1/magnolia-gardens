#!/usr/bin/env node
'use strict';
// Synthetic local fixtures only. No customer records or network requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const root = process.env.SITE_ROOT || path.resolve(__dirname, '..', 'dist');
const backup = require(path.join(root, 'quote/backup.js'));
const settings = {stop:10,perMin:1.5,min:50,markup:1.25,buffer:20,freqWeekly:1,freqBiweekly:1.8,freqOnetime:1,pricingRev:3,hqEmail:'synthetic@example.invalid',services:['Mowing','Cleanup','Materials']};
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=', 'base64');
const quote = {id:'synthetic-quote',created:1700000000000,updated:1700000000100,status:'sent',frequency:'biweekly',cust:{name:'Synthetic fixture',addr:'Not a real address',phone:''},notes:'Retain crew note',acceptedValue:762.4,items:[
  {id:'time-item',service:'Mowing',mode:'time',minutes:'60',amount:'',inotes:'Retain service note',photos:['synthetic-photo'],_thumbs:[{url:'blob:temporary'}]},
  {id:'manual-item',service:'Cleanup',mode:'manual',amount:'250',photos:[],tiers:{legacy:123}},
  {id:'material-item',service:'Materials',mode:'material',amount:'80',photos:[]}
]};
const photo = {id:'synthetic-photo',quoteId:quote.id,blob:new Blob([png],{type:'image/png'})};
let passed = 0;
async function test(name, run) {await run();passed++;console.log('PASS: '+name);}
async function rejected(payload, pattern) {await assert.rejects(backup.readBackup(typeof payload === 'string'?payload:JSON.stringify(payload)),pattern);}
(async()=>{
  const serialized = await backup.createBackup({quotes:[quote],photos:[photo]},settings,new Date('2026-11-11T12:00:00Z'));
  const payload = JSON.parse(serialized), restored = await backup.readBackup(serialized);
  await test('complete backup round trip retains photo bytes, MIME, notes, status and quoted values',async()=>{
    assert.equal(payload.schema,'mgls-backup-2');
    assert.equal(payload.photoCount,1);assert.equal(payload.quoteCount,1);
    assert.deepEqual(Buffer.from(await restored.photos[0].blob.arrayBuffer()),png);
    assert.equal(restored.photos[0].blob.type,'image/png');
    assert.equal(restored.quotes[0].notes,quote.notes);
    assert.equal(restored.quotes[0].status,'sent');
    assert.equal(restored.quotes[0].acceptedValue,762.4);
    assert.deepEqual(restored.quotes[0].items[1].tiers,{legacy:123});
    assert.equal('_thumbs' in restored.quotes[0].items[0],false);
    assert.equal('pricingSnapshot' in quote,false);
    assert.deepEqual(restored.quotes[0].pricingSnapshot,backup.pricingSnapshot(settings));
  });
  await test('megabyte photo bytes round trip without base64 parser stack overflow',async()=>{
    const bytes=Buffer.concat([png,Buffer.alloc(1024*1024,255)]);
    const large={...photo,blob:new Blob([bytes],{type:'image/png'})};
    const result=await backup.readBackup(await backup.createBackup({quotes:[quote],photos:[large]},settings));
    assert.deepEqual(Buffer.from(await result.photos[0].blob.arrayBuffer()),bytes);
  });
  await test('backup aborts on missing or misowned stored photo',async()=>{
    await assert.rejects(backup.createBackup({quotes:[quote],photos:[]},settings),/saved photo is missing/);
    await assert.rejects(backup.createBackup({quotes:[quote],photos:[{...photo,quoteId:'different'}]},settings),/saved photo is missing/);
  });
  await test('no-photo and empty collections remain restorable',async()=>{
    const noPhotos=structuredClone(quote);noPhotos.items[0].photos=[];
    const result=await backup.readBackup(await backup.createBackup({quotes:[noPhotos],photos:[]},settings));
    assert.equal(result.photos.length,0);
    assert.equal((await backup.readBackup(await backup.createBackup({quotes:[],photos:[]},settings))).quotes.length,0);
  });
  await test('invalid JSON, unknown schema and legacy quotes-only export fail before restore',async()=>{
    await rejected('{',/not valid JSON/);
    await rejected({schema:'future-version'},/not a supported/);
    await rejected({schema:'mgls-quotes-1',quotes:[quote]},/older quotes-only/);
  });
  await test('missing, duplicated and incorrectly owned photo records fail validation',async()=>{
    const absent=structuredClone(payload);absent.photos=[];absent.photoCount=0;await rejected(absent,/missing photos/);
    const wrong=structuredClone(payload);wrong.photos[0].quoteId='other';await rejected(wrong,/wrong quote/);
    const duplicate=structuredClone(payload);duplicate.quotes[0].items[1].photos=['synthetic-photo'];await rejected(duplicate,/duplicate photo reference/);
  });
  await test('changed bytes, wrong length, invalid base64 and missing hashes cannot pass photo checks',async()=>{
    for(const change of [
      p=>{p.photos[0].data=Buffer.from('damaged photo').toString('base64');},
      p=>{p.photos[0].size++;},
      p=>{p.photos[0].data='not a base64 photo!?';},
      p=>{p.photos[0].sha256='';}
    ]) {const changed=structuredClone(payload);change(changed);await rejected(changed,/photo|Photo/);}
  });
  await test('unsafe IDs, malformed fields and incompatible pricing cannot reach the renderer',async()=>{
    const changes=[
      p=>{p.quotes[0].id='"><img onerror=bad>';},
      p=>{p.quotes[0].cust.name={bad:true};},
      p=>{p.quotes[0].items[0].minutes='<script>';},
      p=>{p.quotes[0].pricingSnapshot.perMin='1.5';},
      p=>{p.quotes[0].frequency='invalid';},
      p=>{p.photos[0].type='image/svg+xml';},
      p=>{p.quoteCount=5;},
      p=>{p.quotes.push(structuredClone(p.quotes[0]));p.quoteCount++;}
    ];
    for(const change of changes){const changed=structuredClone(payload);change(changed);await rejected(changed,/Invalid|Unsupported|counts/);}
  });
  await test('conflicting quotes are skipped without mutation or photo replacement',async()=>{
    const current={quotes:[structuredClone(quote)],photos:[photo]};
    const before=JSON.stringify(current.quotes),plan=backup.planRestore(restored,current);
    assert.equal(plan.quotes.length,0);assert.equal(plan.photos.length,0);
    assert.deepEqual(plan.skipped,[quote.id]);
    assert.equal(JSON.stringify(current.quotes),before);
    assert.equal(current.photos[0].blob,photo.blob);
  });
  await test('photo ID collision remaps imported references and preserves both stored photos',async()=>{
    const current={quotes:[{id:'other-quote'}],photos:[{...photo,quoteId:'other-quote'},{id:'synthetic-photo-restored-1'}]};
    const plan=backup.planRestore(restored,current);
    assert.equal(plan.quotes.length,1);assert.equal(plan.photos.length,1);assert.equal(plan.renamedPhotos,1);
    assert.equal(plan.photos[0].id,'synthetic-photo-restored-2');
    assert.equal(plan.quotes[0].items[0].photos[0],plan.photos[0].id);
    assert.equal(current.photos[0].id,'synthetic-photo');
    assert.equal(restored.quotes[0].items[0].photos[0],'synthetic-photo');
  });
  await test('a later backup preserves already-restored pricing despite different device settings',async()=>{
    const changed={...settings,perMin:999,stop:500};
    const again=await backup.readBackup(await backup.createBackup({quotes:restored.quotes,photos:restored.photos},changed));
    assert.deepEqual(again.quotes[0].pricingSnapshot,restored.quotes[0].pricingSnapshot);
    assert.equal(again.settings.perMin,999);
  });
  const html=fs.readFileSync(path.join(root,'quote/index.html'),'utf8');
  const inline=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://synthetic.invalid/quote/'});
  const w=dom.window;
  w.indexedDB={open:()=>({})};
  w.scrollTo=()=>{};
  w.eval(inline+'\nwindow.__fieldTest={setSettings:s=>{SET=s;},total:q=>quoteTotals(q).single,render:q=>{CUR=q;fillEdit();buildPreview();return {edit:document.getElementById("editTotal").textContent,preview:document.getElementById("previewBody").textContent,text:quoteText(),items:document.getElementById("items").textContent,hint:document.getElementById("restoredPricingHint").hidden};}};');
  await test('restored totals, editor, preview and share text retain source pricing under different destination rates',async()=>{
    w.__fieldTest.setSettings(settings);
    assert.equal(w.__fieldTest.total(quote),762.4);
    w.__fieldTest.setSettings({...settings,perMin:99,stop:300,min:999,markup:9,buffer:80,freqBiweekly:4});
    const copy=structuredClone(restored.quotes[0]);
    assert.equal(w.__fieldTest.total(copy),762.4);
    const rendered=w.__fieldTest.render(copy);
    assert.equal(rendered.edit,'~$762.40');
    assert.match(rendered.preview,/~\$762\.40/);
    assert.match(rendered.text,/TOTAL: ~\$762\.40/);
    assert.match(rendered.text,/Mowing — \$108/);
    assert.match(rendered.text,/Materials — \$100/);
    assert.equal(rendered.hint,false);
    assert.notEqual(w.__fieldTest.total(quote),762.4);
  });
  await test('frequency, materials-only, minimum and manual-price cases use the saved source engine',async()=>{
    const cases=[];
    for(const frequency of ['weekly','biweekly','onetime']){
      for(const items of [
        [{id:'a',service:'Mowing',mode:'time',minutes:'1',photos:[]}],
        [{id:'a',service:'Materials',mode:'material',amount:'20',photos:[]}],
        [{id:'a',service:'Cleanup',mode:'manual',amount:'175.25',photos:[]}],
        []
      ]) cases.push({...quote,frequency,items});
    }
    for(const q of cases){
      w.__fieldTest.setSettings(settings);const expected=w.__fieldTest.total(q);
      w.__fieldTest.setSettings({...settings,perMin:99,stop:800,min:999,markup:7,buffer:50,freqBiweekly:5});
      assert.equal(w.__fieldTest.total({...q,pricingSnapshot:backup.pricingSnapshot(settings)}),expected);
    }
  });
  await test('backup UI describes skip and pricing behavior and service worker includes new offline module',async()=>{
    assert.match(html,/Existing quotes and photos will stay as they are/);
    assert.match(html,/whose IDs are already on this device will be skipped/);
    assert.match(html,/current device settings apply to new quotes/i);
    assert.match(html,/<script src="backup\.js"><\/script>/);
    assert.match(fs.readFileSync(path.join(root,'quote/sw.js'),'utf8'),/'\.\/backup\.js'/);
  });
  dom.window.close();
  console.log('PASS: '+passed+' field backup/restore contracts; all fixtures synthetic and offline.');
})().catch(error=>{console.error(error);process.exitCode=1;});
