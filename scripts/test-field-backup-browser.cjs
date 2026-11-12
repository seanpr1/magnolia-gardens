#!/usr/bin/env node
'use strict';
// Isolated Chrome profile, synthetic records, localhost-only request allowlist.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {spawn}=require('node:child_process');
const root=process.env.SITE_ROOT||path.resolve(__dirname,'..','dist');
const chromePath=process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if(!fs.existsSync(chromePath))throw new Error('Set CHROME_BIN to an installed Chrome/Chromium binary.');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mgls-backup-browser-'));
const mime={'.html':'text/html','.js':'text/javascript','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.json':'application/json'};
const server=http.createServer((req,res)=>{
  if(req.method!=='GET'){res.writeHead(405).end();return;}
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
let chrome,ws,passed=0;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  chrome=spawn(chromePath,['--headless=new','--remote-debugging-port=0','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-sync','about:blank'],{stdio:['ignore','ignore','pipe']});
  let stderr='';chrome.stderr.on('data',data=>{stderr+=data;});
  const deadline=Date.now()+15000;
  while(!stderr.includes('DevTools listening on ')&&Date.now()<deadline)await delay(50);
  const browserURL=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1];
  if(!browserURL)throw new Error('Chrome did not expose its isolated test debugger.');
  const debugOrigin=browserURL.replace(/^ws:/,'http:').split('/devtools/')[0];
  const target=await (await fetch(debugOrigin+'/json/new?about:blank',{method:'PUT'})).json();
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  let nextId=0;const pending=new Map(),blocked=[];
  function send(method,params={}){
    const id=++nextId;
    return new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timed out: '+method));},20000);
      pending.set(id,{resolve:value=>{clearTimeout(timeout);resolve(value);},reject:error=>{clearTimeout(timeout);reject(error);}});
      ws.send(JSON.stringify({id,method,params}));
    });
  }
  ws.onmessage=event=>{
    const message=JSON.parse(event.data);
    if(message.id){
      const waiter=pending.get(message.id);if(!waiter)return;pending.delete(message.id);
      if(message.error)waiter.reject(new Error(message.error.message));else waiter.resolve(message.result);
    }else if(message.method==='Fetch.requestPaused'){
      const {requestId,request}=message.params;
      if(request.method==='GET'&&(request.url.startsWith(origin+'/')||request.url.startsWith('blob:'+origin+'/')))send('Fetch.continueRequest',{requestId}).catch(()=>{});
      else{blocked.push(request.url);send('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'}).catch(()=>{});}
    }
  };
  async function evaluate(expression){
    const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
    return result.result.value;
  }
  async function waitFor(expression){
    const limit=Date.now()+15000;
    while(Date.now()<limit){try{if(await evaluate(expression))return;}catch(_){}await delay(40);}
    throw new Error('Browser condition timed out: '+expression);
  }
  async function test(name,expression){await evaluate(expression);passed++;console.log('PASS: '+name);}
  await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
  await send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await send('Page.navigate',{url:origin+'/quote/'});
  await waitFor('Boolean(window.MG_QUOTE_BACKUP)&&typeof db!=="undefined"&&Boolean(db)');
  await evaluate(String.raw`window.check=(condition,message)=>{if(!condition)throw Error(message);};
    window.fixtureSettings={stop:10,perMin:1.5,min:50,markup:1.25,buffer:20,freqWeekly:1,freqBiweekly:1.8,freqOnetime:1,pricingRev:3,hqEmail:'synthetic@example.invalid',services:['Mowing','Cleanup','Materials']};
    window.fixtureQuote={id:'imported-quote',created:1700000000000,status:'sent',frequency:'biweekly',cust:{name:'Synthetic restored quote',addr:'Not a real address',phone:''},notes:'Retain note',items:[
      {id:'a',service:'Mowing',mode:'time',minutes:'60',amount:'',inotes:'',photos:['shared-photo']},
      {id:'b',service:'Cleanup',mode:'manual',amount:'250',photos:[]},
      {id:'c',service:'Materials',mode:'material',amount:'80',photos:[]}]};
    window.fixtureBytes=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII='),c=>c.charCodeAt(0));
    window.fixturePhoto={id:'shared-photo',quoteId:'imported-quote',blob:new Blob([fixtureBytes],{type:'image/png'})};
    window.pickBackup=text=>{const dt=new DataTransfer();dt.items.add(new File([text],'synthetic-backup.json',{type:'application/json'}));document.getElementById('restoreFile').files=dt.files;document.getElementById('restoreFile').dispatchEvent(new Event('change',{bubbles:true}));};
    window.snapshotText=async()=>{const s=await MG_QUOTE_BACKUP.readSnapshot(db);return JSON.stringify({quotes:s.quotes,photos:await Promise.all(s.photos.map(async p=>({id:p.id,quoteId:p.quoteId,type:p.blob.type,bytes:Array.from(new Uint8Array(await p.blob.arrayBuffer()))})))});};
    window.writeRecords=(quotes,photos)=>new Promise((resolve,reject)=>{const t=db.transaction(['quotes','photos'],'readwrite');quotes.forEach(q=>t.objectStore('quotes').add(q));photos.forEach(p=>t.objectStore('photos').add(p));t.oncomplete=resolve;t.onabort=()=>reject(t.error);});`);
  await evaluate(String.raw`(async()=>{
    window.syntheticBackup=await MG_QUOTE_BACKUP.createBackup({quotes:[fixtureQuote],photos:[fixturePhoto]},fixtureSettings);
    window.existingQuote={...structuredClone(fixtureQuote),id:'existing-quote',cust:{name:'Synthetic existing quote',addr:'',phone:''}};
    await writeRecords([existingQuote],[{...fixturePhoto,quoteId:'existing-quote',blob:new Blob(['existing-photo-bytes'],{type:'image/jpeg'})}]);
    SET={...fixtureSettings,perMin:99,stop:300,min:999,markup:9,buffer:80,freqBiweekly:4};saveSettings(SET);
    window.settingsBefore=localStorage.getItem('mgls_set');window.beforeRestore=await snapshotText();await renderList();pickBackup(syntheticBackup);
  })()`);
  await waitFor('document.getElementById("backupStatus").textContent.includes("Backup verified")');
  await test('real file-input review validates photos and leaves IndexedDB untouched',String.raw`(async()=>{
    check(await snapshotText()===beforeRestore,'Preview changed stored data');
    check(document.getElementById('restoreSummary').textContent.includes('1 new quote(s) and 1 photo(s)'),'Missing restore counts');
    check(document.getElementById('restoreSummary').textContent.includes('1 photo ID conflict'),'Missing conflict explanation');
    check(document.documentElement.scrollWidth<=390,'Mobile review overflows');
  })()`);
  const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
  const screenshotPath=path.join(os.tmpdir(),'mgls-field-backup-review.png');
  fs.writeFileSync(screenshotPath,Buffer.from(screenshot.data,'base64'));console.log('Review screenshot: '+screenshotPath);
  await evaluate('document.getElementById("btnCancelRestore").click()');
  await test('cancel leaves existing quotes/photos unchanged',String.raw`(async()=>{check(await snapshotText()===beforeRestore,'Cancel mutated data');check(document.getElementById('restoreReview').hidden,'Review still open');})()`);
  await evaluate('pickBackup(syntheticBackup)');
  await waitFor('document.getElementById("backupStatus").textContent.includes("Backup verified")');
  await evaluate('document.getElementById("btnConfirmRestore").click()');
  await waitFor('document.getElementById("backupStatus").textContent.startsWith("Restored 1 quote(s) and 1 photo(s)")');
  await test('confirmed restore commits both stores and preserves destination data/settings',String.raw`(async()=>{
    const state=await MG_QUOTE_BACKUP.readSnapshot(db);
    check(state.quotes.length===2&&state.photos.length===2,'Wrong committed counts');
    check(JSON.stringify(state.quotes.find(q=>q.id==='existing-quote'))===JSON.stringify(existingQuote),'Existing quote changed');
    check(await state.photos.find(p=>p.id==='shared-photo').blob.text()==='existing-photo-bytes','Existing photo changed');
    const restored=state.quotes.find(q=>q.id==='imported-quote');
    check(restored.items[0].photos[0]==='shared-photo-restored-1','Photo reference not remapped');
    check(quoteTotals(restored).single===762.4,'Restored quote repriced');
    check(localStorage.getItem('mgls_set')===settingsBefore,'Destination settings changed');
    window.afterRestore=await snapshotText();
  })()`);
  await evaluate('document.querySelector(\'[data-id="imported-quote"].qcard\').click()');
  await waitFor('document.getElementById("s-edit").classList.contains("active")&&document.querySelector(".thumb img")&&document.querySelector(".thumb img").naturalWidth===1');
  await test('restored photo decodes and editor/preview show saved amount',String.raw`(()=>{
    check(document.getElementById('editTotal').textContent==='~$762.40','Editor repriced');
    check(!document.getElementById('restoredPricingHint').hidden,'Missing pricing explanation');
    document.getElementById('btnPreview').click();
    check(document.getElementById('previewBody').textContent.includes('~$762.40'),'Preview repriced');
    check(quoteText().includes('TOTAL: ~$762.40'),'Share text repriced');
    document.getElementById('btnBackEdit').click();document.getElementById('btnBackList').click();
  })()`);
  await evaluate(String.raw`window.downloads=[];
    Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false});
    const originalClick=HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click=function(){if(this.download){downloads.push(fetch(this.href).then(r=>r.text()));return;}return originalClick.call(this);};
    document.getElementById('btnExport').click();`);
  await waitFor('document.getElementById("backupStatus").textContent.startsWith("Download started")');
  await test('backup UI exports complete photo bytes with preserved snapshots',String.raw`(async()=>{
    check(downloads.length===1,'Download did not start');
    window.downloaded=await downloads[0];const saved=await MG_QUOTE_BACKUP.readBackup(downloaded);
    check(saved.quotes.length===2&&saved.photos.length===2,'Export incomplete');
    check(saved.quotes.find(q=>q.id==='imported-quote').pricingSnapshot.perMin===1.5,'Second backup repriced restored quote');
    pickBackup(downloaded);
  })()`);
  await waitFor('document.getElementById("backupStatus").textContent.startsWith("No new quotes")');
  await test('repeated restore skips existing IDs without duplicates or overwrite',String.raw`(async()=>{
    check(document.getElementById('btnConfirmRestore').disabled,'Duplicate-only restore enabled');
    check(await snapshotText()===afterRestore,'Repeated restore mutated data');
    document.getElementById('btnCancelRestore').click();pickBackup('{broken');
  })()`);
  await waitFor('document.getElementById("backupStatus").textContent.startsWith("Cannot restore")');
  await test('malformed file is rejected without a storage mutation',String.raw`(async()=>{check(await snapshotText()===afterRestore,'Malformed import mutated data');const missing=JSON.parse(syntheticBackup);missing.photos=[];missing.photoCount=0;pickBackup(JSON.stringify(missing));})()`);
  await waitFor('document.getElementById("backupStatus").textContent.includes("missing photos")');
  await test('missing photo file fails before any write',String.raw`(async()=>{check(await snapshotText()===afterRestore,'Incomplete import mutated data');})()`);
  await test('actual IndexedDB transaction abort rolls back an already queued photo write',String.raw`(async()=>{
    const source=await MG_QUOTE_BACKUP.readBackup(syntheticBackup);source.quotes[0].id='rollback-quote';source.photos[0].quoteId='rollback-quote';
    const oldAdd=IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add=function(value){if(this.name==='quotes'&&value.id==='rollback-quote')throw new DOMException('Synthetic quota failure','QuotaExceededError');return oldAdd.call(this,value);};
    let rejected=false;
    try{await MG_QUOTE_BACKUP.restoreBackup(db,source);}catch(error){rejected=true;}finally{IDBObjectStore.prototype.add=oldAdd;}
    check(rejected,'Failed write reported success');check(await snapshotText()===afterRestore,'Aborted transaction left partial data');
  })()`);
  await evaluate(String.raw`(async()=>{
    window.raceQuote={...structuredClone(fixtureQuote),id:'race-quote',items:[]};
    window.raceBackup=await MG_QUOTE_BACKUP.createBackup({quotes:[raceQuote],photos:[]},fixtureSettings);pickBackup(raceBackup);
  })()`);
  await waitFor('document.getElementById("backupStatus").textContent.includes("Backup verified")');
  await evaluate(String.raw`(async()=>{await writeRecords([{...raceQuote,notes:'Saved after review'}],[]);document.getElementById('btnConfirmRestore').click();})()`);
  await waitFor('document.getElementById("backupStatus").textContent.startsWith("Restored 0 quote(s)")');
  await test('conflicts created after review are rechecked inside the write transaction',String.raw`(async()=>{const s=await MG_QUOTE_BACKUP.readSnapshot(db);check(s.quotes.find(q=>q.id==='race-quote').notes==='Saved after review','Late quote overwritten');check(document.getElementById('backupStatus').textContent.includes('Skipped 1'),'Late conflict not reported');})()`);
  await evaluate(String.raw`Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Cancelled','AbortError');}});document.getElementById('btnExport').click();`);
  await waitFor('document.getElementById("backupStatus").textContent.startsWith("Sharing cancelled")');
  await test('cancelled share does not trigger an unwanted fallback download','check(downloads.length===1,"Share cancellation started another download")');
  await evaluate('navigator.serviceWorker.ready.then(()=>true)');await waitFor('Boolean(navigator.serviceWorker.controller)');
  await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await send('Page.reload',{ignoreCache:false});
  await waitFor('Boolean(window.MG_QUOTE_BACKUP)&&typeof db!=="undefined"&&Boolean(db)&&document.querySelectorAll(".qcard").length===3');
  await test('service-worker reload works offline with backup module and stored quotes','if(navigator.onLine||!document.getElementById("netstate").textContent.includes("Offline"))throw Error("Offline state not active")');
  await evaluate('document.querySelector(\'[data-id="imported-quote"].qcard\').click()');
  await waitFor('document.querySelector(".thumb img")&&document.querySelector(".thumb img").naturalWidth===1');
  await test('restored photo and saved amount remain available after offline reload','if(document.getElementById("editTotal").textContent!=="~$762.40")throw Error("Offline total changed")');
  assert.equal(blocked.length,0,'Unexpected external requests were blocked: '+blocked.join(', '));
  console.log('PASS: '+passed+' actual-browser contracts, including real IndexedDB rollback and offline reload. No external form or analytics requests.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  if(ws)ws.close();
  if(chrome){chrome.kill('SIGTERM');await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),delay(3000)]);}
  server.close();fs.rmSync(profile,{recursive:true,force:true,maxRetries:3});
});
