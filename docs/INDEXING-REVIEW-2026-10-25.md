# Indexing review — October 25, 2026 (Eastern)

Status: **published and live-verified** after Sean's explicit approval. PR #16 merged as `7160d5051cbdb1b4d69c4bef2c65dcabadacbd7c` at `2026-10-26T00:38:49Z` (October 25 Eastern), deployed at `https://12dee136.magnolia-gardens.pages.dev`. Google has processed the sitemap and discovered the canonical projects page; indexing remains pending. The observations below retain the original investigation timeline. Existing draft PR #15 is independent and untouched.

## Confirmed 404 and cause

Search Console's domain property lists exactly one 404 URL: `https://magnoliagardenslandscaping.com/cdn-cgi/l/email-protection`. The examples table says first detected/last crawled October 20; URL Inspection gives last crawl October 22 at 11:40:22 AM, Googlebot smartphone, crawl allowed, failed 404, and referring page `https://magnoliagardenslandscaping.com/privacy/`. The report header displays October 18 despite later row/inspection dates; do not use that header to date the cause or attribute it to a release.

A fresh public fetch independently returns HTTP 404 at that helper URL. Live page extraction exposes links to it with encoded fragments on 13 of the 15 sitemap pages. The GitHub HTML instead contains ordinary `mailto:` links. Cloudflare's documented email obfuscation rewrites these at the edge. This is a provider-generated helper URL, not a missing Magnolia service or customer page. No evidence establishes that PR #13 or #14 introduced an unintended page deletion.

The patch wraps 17 existing static email anchors on 14 HTML pages (including the legacy hiring page and application fallback) in Cloudflare's documented email-exclusion comments. It preserves every original address, label, HTML attribute and script. It requires no Cloudflare account-setting change. It makes these already-public email links directly readable by crawlers as well as visitors; spam-harvesting resistance for those links is reduced. No new public information is introduced. The helper itself remains an intentional 404; do not invent content, redirect it to the homepage, put it in the sitemap, or request its indexing.

## Other Search Console exclusions

| Category | Exact URLs | Finding |
|---|---|---|
| Alternate page with proper canonical (7) | `https://www.magnoliagardenslandscaping.com/`; `https://magnoliagardenslandscaping.com/?MA`; `https://magnoliagardenslandscaping.com/?ND`; `https://magnoliagardenslandscaping.com/estimate/?service=mulch`; `https://www.magnoliagardenslandscaping.com/estimate/?service=mulch`; `https://www.magnoliagardenslandscaping.com/services/mulch/`; `https://www.magnoliagardenslandscaping.com/services/maintenance/` | Expected duplicate/canonical exclusions. Preserve useful service parameters and working aliases. |
| Page with redirect (2) | `http://magnoliagardenslandscaping.com/`; `http://www.magnoliagardenslandscaping.com/` | Fresh fetches follow to working HTTPS homepages; both declare the non-www HTTPS homepage canonical. |
| Crawled, currently not indexed (2) | `https://www.magnoliagardenslandscaping.com/customers/`; `https://www.magnoliagardenslandscaping.com/projects/` | Both render real content and declare their non-www equivalents canonical. They are not 404s. Do not force duplicate www URLs into the index. |

Initially, direct URL Inspection of `https://magnoliagardenslandscaping.com/projects/` reported URL unknown to Google, no crawl, and no referring sitemap detected. The page is present in the current live sitemap and reachable through navigation. An indexing request was attempted, but Google returned “We had a problem submitting your indexing request” and “Could not connect to the reCAPTCHA service.” No successful submission or indexing is claimed. The browser connection was subsequently recovered in a fresh tab. Direct inspection of `https://magnoliagardenslandscaping.com/customers/` reports **URL is on Google / Page is indexed**. No indexing request is needed for that already-indexed canonical page.

## Sitemap discovery corrected in Search Console

The domain property's Submitted sitemaps table initially contained zero entries. The existing verified `https://magnoliagardenslandscaping.com/sitemap.xml` was submitted on October 25. Google displayed **Sitemap submitted successfully**, then a table row with **Success**, **15 discovered pages**, and submitted/last-read dates of October 25, 2026. This confirms successful submission and processing, not that every page is already indexed. The earlier absence of a submitted sitemap is not proof Google could not discover the file through robots.txt.

## Website verification

- All 15 URLs in the live sitemap were fetched successfully with real page titles/content and matching self-canonicals. The source and live sitemap have the same URLs. This covers home, request, planning, projects, customers, privacy, application, all five services and all three areas.
- Live `robots.txt` allows crawling and names the correct HTTPS non-www sitemap. No crawl block was added.
- All source files were verified by Git blob hash against main before editing (206 matches, zero mismatches). All 14 application diffs reduce byte-for-byte to their baselines after removing the 17 new comment pairs.
- `npm ci --offline --ignore-scripts` and `npm test` passed: deterministic build, failed-build preservation and publish/release identity; 61 static checks, 54 price combinations, 117 request/adapter cases, 20 contact-link cases, 13 application scenarios and 43 shared-form/privacy contracts (308 counted checks). Runtime: Node 24.21.0, npm 11.19.0, Python 3.14.5; Node/npm differ from repository pins. Dependencies unchanged. No live form submissions or analytics requests from tests.
- The static checker validates internal relative links, FAQ/schema parity and sitemap canonical coverage. Existing forms, routes, canonical tags, robots rules and sitemap are unchanged.

Both GitHub Site check runs, Cloudflare Pages and Netlify deployment passed for application revision `f7dc22ba234971166a866703a759315f1d5ddd8c`. The [Cloudflare preview](https://9acbf635.magnolia-gardens.pages.dev/) version marker reports that exact revision, `branch-deploy`, and a clean working tree. Home, privacy and application content/canonicals render correctly; extracted links contain no `/cdn-cgi/` email helper. This preview does not prove production-domain edge behavior. The documentation follow-up changes no application files.

## Published release and Google follow-up

Owner approval was received and PR #16 merged with an expected-head guard. GitHub and Cloudflare checks passed. Production `/version.json` returned the exact merge `7160d5051cbdb1b4d69c4bef2c65dcabadacbd7c`, clean `main`/`production`, and deployment `https://12dee136.magnolia-gardens.pages.dev`. This establishes production publication, beyond the earlier preview checks.

Fresh fetches of all 15 sitemap pages and legacy `/hiring/` returned real content and expected canonical URLs, with zero email-helper links. Browser inspection across the affected page families confirmed direct original mailto destinations, zero helper anchors, zero `data-cfemail` elements and no Cloudflare email-decoder script. The legacy hiring URL still opens the application page. Home, quick-request, application and mulch form structures were inspected without submission. No live lead/application, email or customer message was sent. [Production privacy-page screenshot](review/indexing-production-7160d50.jpg). Application files remain exactly the tested and approved candidate; this final record and screenshot are documentation only.

After sitemap processing, Search Console changed canonical `/projects/` to **Discovered - currently not indexed**, and explicitly lists `https://magnoliagardenslandscaping.com/sitemap.xml` under discovery. A retry of Request indexing again failed with “We had a problem submitting your indexing request” and “Could not connect to the reCAPTCHA service.” No CAPTCHA was solved and no successful individual request is claimed. Additional sign-in was not required. The sitemap remains **Success, 15 discovered pages**; the canonical customer page is already indexed.

Remaining: Google needs to crawl/select the canonical projects page. A later individual request can be retried if necessary when the reCAPTCHA service works. Search Console may retain the historical helper 404; that alone does not mean a customer page is missing. No “Validate fix” request was made for an endpoint intentionally kept nonexistent. Google controls indexing timing and selection. The pre-release rollback target is `ab2ecdc4e0e176c4d06eedf63f18c7fb722f0017` / `https://1bad46b6.magnolia-gardens.pages.dev`.

References: [Cloudflare email obfuscation and targeted exemption](https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/); [Google crawling-error guidance](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors); [404 report](https://search.google.com/search-console/index/drilldown?resource_id=sc-domain%3Amagnoliagardenslandscaping.com&item_key=CAMYDSAC).

