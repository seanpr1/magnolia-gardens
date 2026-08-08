/* Magnolia Gardens — pricing single source (conversion handoff §2).
   Every price the site computes or quotes in a component comes from here:
   - /estimate/ reads ENGINE + MINUTES + calc()
   - the shared quote block (assets/quote-block.js) reads PUBLISHED
   A price change is one edit in this file. Change it together with
   operations/pricing.md in the ops repo (MAGNOLIA.md §4). */
(function(){
  "use strict";

  /* ---------- pricing engine (aligned to Magnolia field engine) ---------- */
  const ENGINE = { stop:10, perMin:1.50, buffer:0.20, floor:50 };
  // estimated minutes on site by lawn size (mow + edge + blow), tuned to clean price anchors
  const MINUTES = { compact:25, midsize:42, spacious:64, estate:95 };
  const SIZE_LABEL = { compact:'compact lot', midsize:'mid-size lot', spacious:'spacious lot', estate:'estate property' };
  const SIZE_ACRE  = { compact:'under ¼ acre', midsize:'¼–½ acre', spacious:'½–1 acre', estate:'over 1 acre' };
  const SERVICE_LABEL = { mowing:'Recurring mowing', maintenance:'Full grounds care', cleanup:'One-time cleanup', mulch:'Mulch & beds' };

  const round5 = n => Math.round(n/5)*5;
  function baseVisit(size){
    const mins = MINUTES[size] * (1 + ENGINE.buffer);
    return Math.max(ENGINE.floor, ENGINE.stop + mins * ENGINE.perMin);
  }

  // returns the numbers to display for the chosen service+size
  function calc(service, size){
    const svc = service;
    const base = baseVisit(size);             // mow+edge+blow per visit

    if(svc === 'mowing'){
      const per = round5(base);
      // the range's low end is fuzzed down 10%, so clamp it back to the published
      // minimum — otherwise a compact lot quotes under the site-wide floor.
      const lowPer = Math.max(ENGINE.floor, round5(base*0.9));
      return {
        kind:'per-visit',
        label:'Estimated per visit',
        low: lowPer, high: round5(base*1.12),
        monthly:[ lowPer*4, round5(base*1.12*4) ],   // ~weekly
        tiers:[
          { n:'Good',   v:per,            u:'/ visit', d:'Mow, edge &amp; blow, every visit.' },
          { n:'Better', v:round5(base*1.22), u:'/ visit', d:'Adds string-trim detail &amp; crisp precision edging.', best:false },
          { n:'Best',   v:round5(base*1.5),  u:'/ visit', d:'Adds bed tidy &amp; seasonal touch-ups. Most popular.', best:true }
        ]
      };
    }
    if(svc === 'maintenance'){
      const per = round5(base*1.5);
      return {
        kind:'per-visit',
        label:'Estimated per visit',
        low: round5(base*1.35), high: round5(base*1.75),
        monthly:[ round5(base*1.35*4), round5(base*1.75*4) ],
        tiers:[
          { n:'Good',   v:round5(base*1.22), u:'/ visit', d:'Mow, edge, blow + light bed upkeep.' },
          { n:'Better', v:per,               u:'/ visit', d:'Adds trimming, shrubs &amp; full bed care.', best:false },
          { n:'Best',   v:round5(base*1.85), u:'/ visit', d:'Whole property handled + seasonal color. Most popular.', best:true }
        ]
      };
    }
    if(svc === 'cleanup'){
      const one = base*3.2;   // one-time reset scales with size
      return {
        kind:'one-time',
        label:'Estimated one-time',
        low: round5(one*0.85), high: round5(one*1.25),
        monthly:null,
        tiers:[
          { n:'Light',  v:round5(one*0.85), u:'one-time', d:'Mow-down, edge &amp; haul the clippings.' },
          { n:'Full',   v:round5(one),      u:'one-time', d:'Adds beds, leaves &amp; overgrowth reset.', best:true },
          { n:'Reset+', v:round5(one*1.25), u:'one-time', d:'Everything, plus mulch refresh &amp; detail.', best:false }
        ]
      };
    }
    // mulch — priced on site by bed area; show a starting range, no per-visit
    const start = base*2.4;
    return {
      kind:'range',
      label:'Typically starts around',
      low: round5(start*0.8), high: round5(start*1.6),
      monthly:null,
      tiers:null,
      note:'Mulch is priced by bed size and material — we confirm the exact number on site, usually same day.'
    };
  }

  const money = n => '$' + Number(n).toLocaleString('en-US');

  /* ---------- published range strings ---------- */
  const PUBLISHED = {
    floor: ENGINE.floor,
    minimumText: '$' + ENGINE.floor,
    // compact low $50 up to spacious Best-tier $190; estate lots are carved
    // out in copy as "larger and estate properties quoted higher"
    perVisitRange: '$50–$190',
    // homepage Full Lawn Service card. Resolved 2026-08-07 (ops repo
    // decisions/2026-08-07-fifty-dollar-floor-and-full-service-alignment.md):
    // entry matches the engine's compact full-grounds low; the card keeps a
    // trailing "+" for spacious Best and estate lots.
    fullServiceBand: '$75–$190',
    phoneDisplay: '423-390-9954',
    telHref: 'tel:4233909954',
    smsHref: 'sms:+14233909954',
    formspree: 'https://formspree.io/f/mdajnnjw'
  };

  window.MG_PRICING = { ENGINE, MINUTES, SIZE_LABEL, SIZE_ACRE, SERVICE_LABEL,
    round5, baseVisit, calc, money, PUBLISHED };
})();
