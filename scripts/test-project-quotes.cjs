#!/usr/bin/env node
'use strict';
// Offline contract checks: project services never return a numeric estimate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/pricing.js'),'utf8'),context);
const p = context.window.MG_PRICING;
for(const service of ['cleanup','mulch','brush']){
  for(const size of ['', 'compact','midsize','spacious','estate','unknown']){
    for(const freq of ['weekly','biweekly','onetime']){
      const result = p.calc(service,size,freq);
      assert.equal(result.kind,'quote');
      assert.equal('low' in result,false);
      assert.equal('high' in result,false);
      assert.equal(result.monthly,null);
      assert.equal(result.tiers,null);
    }
  }
}
assert.equal(p.calc('unknown','midsize','weekly'),null);
for(const page of ['index.html','services/cleanup/index.html','llms.txt']){
  const text=fs.readFileSync(path.join(root,page),'utf8');
  assert.doesNotMatch(text,/spring.{0,30}reservation|rate locked through June|auto-resum|\$75 holds|spot.{0,20}for \$75/i,page);
}
console.log('PASS: 54 project combinations have no numeric price; invalid services fail closed; spring promotion removed from public copies.');
