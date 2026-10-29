# Acquisition improvements — October 26, 2026 (Eastern)

Status: draft implementation, not published. Baseline is main `f42812d1a317571dd6fd951ab1a0011fe3cb7150`, verified against the live production version marker. Private traffic, lead and customer evidence is intentionally kept out of this public repository.

## Changes

- Move the homepage photo/proof block after the quote form in document order. Named grid areas retain the two-column desktop layout and put copy, form, then proof in the narrow layout. Phone remains the only required quote field.
- State the service and Kingsport location in the H1, clarify cleanup/mowing scope, and add direct links to the existing cleanup, mowing and mulch pages. The established slogan remains elsewhere on the page.
- Include the lightbox stacking correction from draft PR #15 (`10000`, above the `9500` mobile quote bar). Do not merge both branches as separate copies of this fix; preserve PR #15's historical review evidence.
- Retain `/projects/` and `/customers/` as first-touch attribution paths across internal navigation. Unknown paths and contact-bearing query strings remain excluded. Five regression cases cover retained paths, navigation and privacy.
- Self-host the existing Fraunces and Inter font families as WOFF2, with `font-display: swap` and the original Unicode subsets. Twelve pages no longer depend on Google's external font stylesheet or font hosts. Font source URLs, hashes in filenames and SIL OFL license files are recorded in [FONTS.md](FONTS.md). This removes external dependencies; it is not a measured Lighthouse or conversion uplift.
- Focus the cleanup title on leaf removal/fall cleanup and add a sourced answer distinguishing private lawn/bed clearing and haul-off from Kingsport's separate municipal collection service. Visible FAQ and JSON-LD are synchronized.

Forms, endpoints, transport, analytics initialization, prices, contact details, service areas, existing URLs and customer terms remain unchanged. No live submission, CRM mutation, customer message, ad launch or production automation edit is part of this draft.

## Audit evidence

A fresh public crawl returned HTTP 200, one H1 and a matching self-canonical for all 15 sitemap routes. The live robots file permits crawling and references the sitemap. The live version marker matched the baseline above. The previously corrected email-helper 404 is documented in [INDEXING-REVIEW-2026-10-25.md](INDEXING-REVIEW-2026-10-25.md); it is not a missing service page.

Live desktop review at 1363 × 936 confirmed no horizontal overflow, the primary quote link focuses `hf2-phone`, optional details open, and phone is the only required input. No form was submitted. Historical October 21 mobile lab evidence (7.9-second LCP, performance score 60) is recorded on PR #15; it is not a new measurement of this candidate.

## Validation

`npm test` passes 313 counted checks: 61 static, 54 pricing/project, 117 request/adapter, 20 contact-link, 13 application and 48 shared-form/campaign/privacy checks, plus deterministic build, failed-build preservation, publish allowlist and release identity checks. Runtime: Node 24.22.1, npm 11.9.0, Python 3.12.14; the npm and Python versions differ from README pins. Locked dependencies unchanged. Transport and telemetry are mocked.

Managed preview starts but its browser route displays an empty directory listing despite the built `dist/index.html` being present. This is an environment limitation, not a production-site finding. Interactive narrow viewport, mobile keyboard, native call/SMS and screen-reader checks remain outstanding unless subsequent evidence is appended below. No physical-device verification or measured performance improvement is claimed.

Before release: inspect the exact hosted preview; check desktop and 320/390 px layouts, menus, photo viewer, optional fields and mocked result states; compare mobile PageSpeed/LCP/CLS against the baseline; complete any outstanding device checks; obtain owner publication approval. Preserve the existing intake-verification work rather than sending duplicate tests. After an authorized release, verify production revision and critical routes. Rollback baseline: `f42812d1a317571dd6fd951ab1a0011fe3cb7150`.

## Hosted preview follow-up

Netlify successfully built [PR #17's preview](https://deploy-preview-17--heartfelt-halva-7fa350.netlify.app/); the initial version marker matched commit `12589fa5ba95c35830bb38772c6fac1ccbea80ec`. GitHub's Site check also passed. At 1363 px, the preview had no horizontal overflow; the quote CTA focused the phone field, optional details expanded, and the photo dialog opened at z-index 10000 and closed with Escape. No submission was made. Visual inspection caught a new service-link navigation landmark inheriting the site's fixed-header styling; the follow-up changes that wrapper to a div with the same navigation role so it remains in the hero flow. The full test suite was rerun after that correction. Narrow viewport/device and fresh PageSpeed checks remain release gates.

## October 27: separate CTA labels from campaign attribution

The shared metrics adapter now emits internal button locations as `cta_source`, rather than the generic `source` parameter. Existing adapters can still pass their fixed `source` label internally; the boundary renames and sanitizes it before calling Analytics. Campaign UTM capture, event names, form payload fields and customer delivery are unchanged. Three mocked regression cases check normal CTA labels, unsafe input, absence of campaign/source overrides and preservation of first-touch UTM context.

This removes an ambiguous use of the traffic-source vocabulary. It does not retroactively repair historical Analytics reports or prove that this parameter caused every attribution anomaly. After an authorized release, inspect new acquisition data and optionally register `cta_source` as an event-scoped custom dimension if button-level reporting is needed. No GA4 settings or production scripts were changed by preparing this draft. Private account observations remain outside this public repository.

Validation: `npm test` passed 316 counted checks (61 static, 54 pricing/project, 117 request/adapter, 20 contact-link, 13 application and 51 shared-form/privacy), plus the existing deterministic build and release checks. Every transport and telemetry call in these tests is mocked. This follow-up changes no visible layout; the previously recorded physical-device and performance limits remain.

## October 28: release checks completed; publication still pending

Reviewed PR #17 at `f400c4b00e1583a94f12ee27d8d8fa1eec568668` against main `f42812d1a317571dd6fd951ab1a0011fe3cb7150`. No newer PR supersedes it; the discussion contains the successful hosting previews and no human change requests, and there are no inline review threads. PR #15 remains an overlapping historical draft; do not merge its duplicate lightbox change separately.

The local source tree `85d783322a302e2bbdf2081aa599af93ea6c10e8` matches the remote candidate tree. A fresh `npm test` passed **316 counted checks**, deterministic build, failed-build preservation, publication allowlist and release identity checks. Node 24.22.1, npm 11.9.0, Python 3.12.14; existing locked dependencies reused. Mocked checks cover phone-only and detailed forms, validation, rejection/uncertain deliveries, no automatic resend, service context, campaign attribution, sanitized CTA labels and throwing trackers. No real submissions or analytics calls are made by that suite.

### Hosted checks

- All **15 production sitemap pages** and all **15 Netlify preview pages** returned HTTP 200 with one H1 and the expected production canonical.
- All 15 preview HTML files match the local build after removing only the observed Netlify-injected collaboration drawer. All **21 checked preview assets** match byte-for-byte: seven form/campaign/navigation scripts, fonts.css and 13 WOFF2 fonts.
- Netlify and Cloudflare preview version markers both identify candidate `f400c4b`. The production marker still identifies `f42812d`, served by Cloudflare deployment `e95512ec`; production has not been changed.
- Hosted desktop interaction at a 1363-pixel browser width passed quote CTA focus to `hf2-phone`, optional-details open/close, no horizontal overflow, and the cleanup link through to the quick-request form with Cleanup selected. Phone remains the only required field.
- The photo viewer opens at z-index 10000, focuses Close, closes with Escape, and returns focus to the initiating photo.
- The existing live quick-request page initializes the GA4 `G-V93YBHW1PJ`, Clarity and Meta loaders and retains the established Formspree endpoint. This observes initialization, not provider-side event ingestion. The candidate does not alter those initializers or delivery infrastructure.
- Existing synthetic intake evidence was reused: a prior Formspree receipt and its archived Jobber request have the same submission ID and full message. A separate verification flow also created and archived another synthetic Jobber request on October 28. No duplicate lead was sent by this release check. Private identifiers and customer records are intentionally omitted.

An initial Python HTTP client received 403 responses from production; ordinary curl requests and the browser succeeded. The successful curl results above are the completed crawl evidence, not a claim based on that failed client.

### Fresh mobile performance

The PageSpeed API returned quota errors for production and preview. The official PageSpeed Insights website completed the following independent mobile lab runs, all using Lighthouse 13.5.0, emulated Moto G Power, Slow 4G and initial page load:

| Target and report | Performance | FCP | LCP | TBT | CLS | Speed Index |
|---|---:|---:|---:|---:|---:|---:|
| [Live production](https://pagespeed.web.dev/analysis/https-magnoliagardenslandscaping-com/40u9zwlnr6?form_factor=mobile) | 62 | 4.1 s | 7.9 s | 170 ms | 0.001 | 5.0 s |
| [Old build, Cloudflare URL, run 1](https://pagespeed.web.dev/analysis/https-e95512ec-magnolia-gardens-pages-dev/wmxbmj8qrj?form_factor=mobile) | 82 | 3.5 s | 3.5 s | 0 ms | 0 | 4.6 s |
| [Old build, Cloudflare URL, run 2](https://pagespeed.web.dev/analysis/https-e95512ec-magnolia-gardens-pages-dev/lym1r046ep?form_factor=mobile) | 87 | 2.7 s | 3.5 s | 0 ms | 0.001 | 2.7 s |
| [Candidate, Cloudflare URL, run 1](https://pagespeed.web.dev/analysis/https-a9219f7c-magnolia-gardens-pages-dev/k60vc16tru?form_factor=mobile) | 93 | 2.0 s | 2.6 s | 0 ms | 0 | 4.2 s |
| [Candidate, Cloudflare URL, run 2](https://pagespeed.web.dev/analysis/https-a9219f7c-magnolia-gardens-pages-dev/hjkp31ukyj?form_factor=mobile) | 92 | 2.1 s | 2.7 s | 0 ms | 0 | 4.1 s |

The two Cloudflare deployment URLs are the closer comparison: production-only analytics are disabled on both. Candidate LCP improved in these samples, but Speed Index varied and did not uniformly improve. The difference from the live production score cannot be attributed solely to this PR, because production loads additional tracking. Two lab samples are not real-user Core Web Vitals or a conversion guarantee. Recheck the actual production URL after an approved release.

All five runs scored 100 on automated accessibility. Deployment URLs are intentionally noindex and receive lower SEO scores for that reason; the live domain scored 100 for SEO. Production's best-practices result includes a Cloudflare Insights RUM CORS failure. That is a separate third-party telemetry observation, not evidence of a quote-delivery failure or a GA4/Clarity failure; no analytics account setting was changed.

### Remaining release decision and device checks

No confirmed candidate defect requiring an application-code change was found in the supported checks. This follow-up records verification only.

The available browser has no viewport-resize/mobile-emulation API, and no connected Mac browser was exposed. A temporary inline test-page navigation was blocked by the browser URL policy; it was not bypassed. Therefore **interactive 320/390-pixel checks, mobile menu/keyboard occlusion, physical iPhone call/SMS behavior and assistive-technology use remain unverified**. Lighthouse's mobile rendering and automated accessibility checks do not establish those interaction passes.

The physical-phone check is: open the [candidate preview](https://a9219f7c.magnolia-gardens.pages.dev/), open/close Menu, tap Request My Quote, confirm the telephone keyboard and reachable controls, expand/collapse Add details without sideways scrolling, open/close a photo, and confirm Call/Text offer 423-390-9954 without placing a call or sending a message. Leave the quote form unsubmitted.

Owner publication authorization is still missing. Existing draft implementation and previous PR approvals do not establish approval to merge PR #17. If the owner approves publication with the disclosed remaining test limits, merge the then-current reviewed head using the established GitHub workflow, confirm the new production version marker and critical routes/assets, verify tracking initialization, and record the observed deployment. Provider-side attribution needs a post-release data check; no additional live test lead is necessary unless separately requested. Rollback baseline remains `f42812d1a317571dd6fd951ab1a0011fe3cb7150`.
