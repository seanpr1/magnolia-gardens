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
