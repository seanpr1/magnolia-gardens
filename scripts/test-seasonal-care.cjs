#!/usr/bin/env node
'use strict';
// Deterministic date + rendered DOM tests. No network, form delivery or telemetry.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const root = process.env.SITE_ROOT || path.resolve(__dirname, '../dist');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'assets/seasonal-care.js'), 'utf8');
const { copy, seasonContext, enhance } = require(path.join(root, 'assets/seasonal-care.js'));
let checks = 0;
function check(label, action) { action(); checks++; console.log('PASS: seasonal ' + label); }
function document() { return new JSDOM(html, { url: 'https://preview.example/' }).window.document; }
function metadata(d) {
  return [d.title, ...Array.from(d.querySelectorAll('meta[name="description"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],script[type="application/ld+json"]'), el => el.outerHTML)];
}
const months = ['winter', 'winter', 'spring', 'spring', 'summer', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter'];
for (const year of [2026, 2027, 2028, 2032]) {
  months.forEach((season, index) => check(`${year}-${index + 1} priority and spring year`, () => {
    assert.deepEqual(seasonContext(new Date(Date.UTC(year, index, 15, 17))), { season, springYear: index >= 8 ? year + 1 : year });
  }));
}
// UTC changes date before Eastern does; include standard/daylight offsets and leap day.
const boundaries = [
  ['2026-03-01T04:59:59Z', 'winter', 2026], ['2026-03-01T05:00:00Z', 'spring', 2026],
  ['2026-05-01T03:59:59Z', 'spring', 2026], ['2026-05-01T04:00:00Z', 'summer', 2026],
  ['2026-09-01T03:59:59Z', 'summer', 2026], ['2026-09-01T04:00:00Z', 'fall', 2027],
  ['2026-12-01T04:59:59Z', 'fall', 2027], ['2026-12-01T05:00:00Z', 'winter', 2027],
  ['2026-12-31T23:59:59Z', 'winter', 2027], ['2027-01-01T00:00:00Z', 'winter', 2027],
  ['2027-01-01T04:59:59Z', 'winter', 2027], ['2027-01-01T05:00:00Z', 'winter', 2027],
  ['2027-02-15T17:00:00Z', 'winter', 2027], ['2028-02-29T17:00:00Z', 'winter', 2028],
  ['2026-03-08T06:59:59Z', 'spring', 2026], ['2026-03-08T07:00:00Z', 'spring', 2026],
  ['2026-11-01T05:59:59Z', 'fall', 2027], ['2026-11-01T06:00:00Z', 'fall', 2027]
];
for (const [instant, season, springYear] of boundaries) {
  check('Eastern boundary ' + instant, () => assert.deepEqual(seasonContext(new Date(instant)), { season, springYear }));
}
check('visitor timezone cannot change the selected season', () => {
  const previous = process.env.TZ;
  try {
    for (const tz of ['UTC', 'America/Los_Angeles', 'Asia/Tokyo', 'Pacific/Auckland']) {
      process.env.TZ = tz;
      for (const [instant, season, springYear] of boundaries) assert.deepEqual(seasonContext(new Date(instant)), { season, springYear });
    }
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});
check('useful evergreen source HTML and stable search identity', () => {
  const d = document();
  assert.equal(d.title, 'Landscaping & Lawn Care in the Tri-Cities, TN | Magnolia Gardens');
  const description = d.querySelector('meta[name="description"]').content;
  assert.match(description, /across the Tri-Cities: Kingsport, Johnson City and Bristol/);
  for (const selector of ['meta[property="og:description"]', 'meta[name="twitter:description"]']) assert.equal(d.querySelector(selector).content, description);
  assert.doesNotMatch(metadata(d).slice(0, 4).join(' '), /\b20\d\d\b|\bfall\b|\bwinter\b|\bspring\b|\bsummer\b/i);
  assert.equal(d.querySelector('[data-season-line]').textContent, 'Ask about lawn care, cleanup and mulch for your property.');
  const section = d.querySelector('[data-season-care]');
  assert.equal(section.id, 'fall');
  assert.equal(section.querySelector('h2').textContent, 'Seasonal property care, off your list.');
  assert.deepEqual(Array.from(section.querySelectorAll('h3 a'), a => a.textContent), ['Cleanup', 'Mulch & Beds', 'Ongoing Lawn Care']);
  assert.equal(section.querySelectorAll('[data-season-card]').length, 3);
  assert.match(section.querySelector('[data-season-planning]').textContent, /address.*timing and availability/);
  assert.doesNotMatch(section.textContent, /\b20\d\d\b|pressure washing|proof.photo|Option \d|winter list|—/i);
  assert.equal(section.querySelector('[data-cta-source="fall_section"]').getAttribute('href'), '#heroIntakeForm');
  assert.match(section.querySelector('a[href^="sms:"]').href, /body=Hi%20Magnolia/);
  for (const link of section.querySelectorAll('h3 a')) assert.ok(fs.existsSync(path.join(root, link.getAttribute('href'), 'index.html')));
  assert.equal(d.querySelectorAll('nav a[href="#fall"]').length, 2);
  assert.ok(Array.from(d.querySelectorAll('nav a[href="#fall"]')).every(a => a.textContent === 'Seasonal care'));
  d.defaultView.close();
});
for (const [season, instant] of Object.entries({ winter: '2026-12-15', spring: '2027-03-15', summer: '2027-06-15', fall: '2027-10-15' })) {
  check(season + ' updates both surfaces, preserves links/intake/metadata and is idempotent', () => {
    const d = document();
    const meta = metadata(d);
    const form = d.getElementById('heroIntakeForm');
    const formBefore = form.outerHTML;
    const ctaBefore = d.querySelector('[data-season-care] .cta-repeat').outerHTML;
    const date = new Date(instant + 'T17:00:00Z');
    enhance(d, date);
    const section = d.querySelector('[data-season-care]');
    assert.equal(section.dataset.season, season);
    assert.equal(section.querySelector('h2').textContent, copy[season].headline + ' off your list.');
    assert.equal(d.querySelector('[data-season-line]').textContent, copy[season].booking);
    assert.equal(section.querySelector('[data-season-planning]').textContent, copy[season].planning.replace('{springYear}', seasonContext(date).springYear));
    assert.equal(copy[season].cards.length, 3);
    Array.from(section.querySelectorAll('[data-season-card]')).forEach((card, index) => {
      const expected = copy[season].cards[index];
      assert.equal(card.querySelector('h3 a').textContent, expected.name);
      assert.equal(card.querySelector('p').textContent, expected.description);
      assert.equal(card.querySelector('a').getAttribute('href'), expected.href);
      assert.ok(fs.existsSync(path.join(root, expected.href, 'index.html')), expected.href);
    });
    assert.doesNotMatch(section.textContent, /\{springYear\}|pressure washing|aeration|overseeding|fills up fast|ground recovers|proof.photo|—/i);
    assert.deepEqual(metadata(d), meta);
    assert.equal(d.getElementById('heroIntakeForm'), form);
    assert.equal(form.outerHTML, formBefore);
    assert.equal(section.querySelector('.cta-repeat').outerHTML, ctaBefore);
    const once = section.outerHTML;
    enhance(d, date);
    assert.equal(section.outerHTML, once);
    d.defaultView.close();
  });
}
check('December, January and February display the same upcoming spring', () => {
  for (const instant of ['2026-12-15', '2027-01-15', '2027-02-15']) {
    const d = document(); enhance(d, new Date(instant + 'T17:00:00Z'));
    assert.match(d.querySelector('[data-season-planning]').textContent, /spring 2027/);
    d.defaultView.close();
  }
});
check('browser startup uses the same date logic', () => {
  const d = document();
  class TestDate extends Date { constructor() { super('2026-12-01T04:59:59Z'); } }
  vm.runInNewContext(script, { document: d, Date: TestDate, Intl });
  assert.equal(d.querySelector('[data-season-care]').dataset.season, 'fall');
  d.defaultView.close();
});
check('unsupported timezone API leaves evergreen content intact', () => {
  const d = document(); const before = d.body.innerHTML;
  vm.runInNewContext(script, { document: d, Date, Intl: { DateTimeFormat() { throw new Error('Unavailable'); } } });
  assert.equal(d.body.innerHTML, before);
  d.defaultView.close();
});
check('incomplete markup leaves booking line and remaining fallback intact', () => {
  const d = document(); d.querySelector('[data-season-card] p').remove();
  const before = d.body.innerHTML; enhance(d, new Date('2026-12-15T17:00:00Z'));
  assert.equal(d.body.innerHTML, before);
  d.defaultView.close();
});
console.log(`PASS: ${checks} seasonal checks. No current-calendar assertions or network requests.`);
