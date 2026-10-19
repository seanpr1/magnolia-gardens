# Website release record

## October 19, 2026: PR #5 refreshed against current main — draft only

Reconciled this existing draft with main `0f68f0fa921fe4700ad43f5c686a233d3ec90855` after the inquiry-disclosure release. The only merge conflict was two additive headers in this release record; both histories were retained. The published disclosure, privacy-link selector and single Formspree route remain intact. No phone-validation, seasonal-copy, gallery, client-portal, advertising or automation change is included in this reconciliation.

Fresh `npm test` passed deterministic build/publish checks and 252 counted checks (55 static, 54 pricing, 117 adapter, 26 shared-form contracts). `git diff --check` passed. The complete local baseline tree was verified against the remote main tree `ff1fcfb68af290265ff6a950d98fd741caf2436a`; the existing locked jsdom 30.1.1 dependency installation was reused without dependency changes. Local runtime: Node 24.21.0, npm 11.19.0, Python 3.14.5. npm differs from the documented 12.1.0 pin. This is local evidence, not a new CI or hosted-preview pass.

All 12 original regression cases remain reconciled in `docs/PR5-REGRESSION-COVERAGE.md`. The net change remains tests and documentation only; existing assertions reject false booking, automatic-SMS and downstream-Jobber success claims. Physical-device and live delivery verification require separate evidence. Keep this PR draft and unmerged. Explicit release authorization and deployed-revision verification remain separate gates. Tests used mocked transport and tracking; no real lead, customer message, CRM record, analytics event, integration edit or production deployment was performed.

## October 18, 2026: server-side inquiry disclosure draft

Prepared against current main and production revision `3c4fc9bb57dbde53a62754a6cdc8c117ae78fe76`. This is a source draft, not a production release or a change to data sharing. It adds a plain-language contact-sharing notice to the two homepage forms, quick-request page and shared service/area form, and a dedicated privacy section explaining the server-side Meta inquiry event and the limits of browser cookie blocking. It removes the quick-request page's conflicting promise that a phone number is used only for follow-up. Prices, form fields, endpoints, transport, analytics configuration and private automation behavior are unchanged.

The description follows the October 17 verified intake configuration: a valid email is required for the automatic path, while no-valid-email requests go to owner review without a server-side inquiry event. This does not claim that browser tracking is disabled for those visitors. The paused payment-event feed is not described as active. Updating notice text does not implement consent, opt-out handling or test exclusions, and does not certify compliance. Any choice to pause, gate or expand inquiry sharing requires its own reviewed implementation.

Before publication, recheck the actual published Meta field mappings and eligibility against this notice and obtain Sean's decision on this exact wording and continued sharing. Browser connection failures prevented a fresh authenticated Zapier inspection during preparation. The in-app browser supported local narrow/wide layout checks; their results are recorded below. The source patch must remain unpublished until these gates are resolved. Preserve unrelated draft PR #11 and reconcile changes against fresh main before merging.

Local browser checks at 390 and 1440 pixels covered the homepage, quick request, representative shared service form and privacy page. All eight page/width combinations had no horizontal overflow; the expected notices and privacy target were present. Desktop homepage and mobile quick-request screenshots were visually inspected. No form was submitted. These are local layout checks, not physical-device, assistive-technology, hosted-deployment or downstream delivery proof. A clean temporary checkout with the exact six-file patch passed npm test: deterministic build/publish checks, 55 static checks, 54 pricing combinations, 116 request/validation/delivery checks and 18 form/telemetry/privacy contracts. The older in-flight local run used the pre-update exact privacy-link selector and failed there; the fragment-compatible selector is included in the passing patch. Node 24.21.0, npm 11.19.0 and Python 3.14.5 were used; npm differs from the documented 12.1.0 pin. No dependency changes were made. No real form submission, customer message, new CRM record, Meta test event or production automation edit is part of this draft.

## Unreleased PR #5 regression reconciliation — October 18, 2026

PR #5 is reconciled with main `3c4fc9bb57dbde53a62754a6cdc8c117ae78fe76` on its existing draft branch. The merge resolves test/release-note conflicts while preserving the current Formspree-only route, submission reference, native validation, privacy and service/area tests. The net change from main is limited to two existing test suites and two documentation files. The [12-case coverage map](PR5-REGRESSION-COVERAGE.md) identifies the remaining unique protections and retires obsolete inline-estimator and browser-mirror assumptions.

Fresh local `npm test` passed deterministic build/publish checks, 55 static checks, 54 pricing combinations, 117 adapter checks and 26 shared-form contracts. Five deliberately damaged temporary rendered copies passed current-main tests and were rejected by the draft's added assertions: missing deadline cleanup, missing abort, altered fallback deadline, exposed initial result and false booking/automatic-SMS promises. Node 24.19.0, npm 11.9.0 and Python 3.12.14 were used; the npm/Python versions differ from CI pins, and no new CI or hosted-preview pass is claimed.

This remains an unmerged draft. Current public application bytes and configuration match main; there is no production release, live submission, customer message or account change in this update. Offline DOM tests do not establish physical-device behavior or actual downstream receipt. This entry supersedes the October 7 PR #5 draft note; the published release records below retain their original scope and dates.

## Website-owned intake repair, published October 13, 2026

Sean explicitly approved merge and live deployment. [PR #10](https://github.com/seanpr1/magnolia-gardens/pull/10) merged as `1db481514733ef56ab355261517423ba166ffedb` at `2026-10-13T04:20:37Z`. The public production `/assets/form-core.js` matched the approved source exactly after deployment. This verifies the repaired transport asset and the two live routes below; it is not a new whole-site deployment comparison.

Magnolia keeps its own website forms and analytics. Customer forms submit once to Formspree, which stores accepted inquiries and forwards them through its enabled server webhook to the published replacement automation. The former browser-triggered automation is disabled. The public browser webhook was removed. Form styling, optional fields, phone-only entry, original message, service/area context and privacy-safe analytics remain. JavaScript submissions include an opaque reference; native HTML forms still submit to Formspree without JavaScript. The privacy notice describes this routing.

The frontend acknowledges Formspree acceptance, not confirmed downstream Jobber delivery. The backend preserves the original inquiry in request Notes, checks the contact match and uses a bounded duplicate counter. Phone-only requests produce an owner notice. Invalid-contact records use an owner-review branch. Service property must be confirmed before quoting or scheduling; native questionnaire answers are separate from Notes.

Verification completed:
- Offline build/publish checks, 54 site checks, 54 pricing combinations, 116 request/validation/delivery checks and 18 shared form/telemetry/privacy contracts passed without live submissions.
- Site check and preview checks passed before merge.
- Two separately authorized public tests at approximately 00:24 and 00:25 Eastern on October 13 exercised the Bristol area form with full details and the cleanup service form with only a phone contact and labeled test message.
- Each produced one request with the original details in Notes, a Formspree receipt and the appropriate professional acknowledgment or owner notice. Both automation runs succeeded. The phone-only run visibly reported a Meta lead event sent.
- Both test requests were archived after record and Inbox verification. No quote, job, assessment or invoice was requested or created by these tests.

The two replacement tests matched an existing test contact; fresh-client creation on the replacement route was not separately tested. Isolated duplicate-counter and exact-contact-guard checks passed, but indefinite exactly-once delivery is not claimed. Spam reconciliation, failure-alert delivery, every live form, physical-device behavior, no-JavaScript downstream behavior and ad attribution remain outside complete verification. Account-side details and private record identifiers are retained in the private operations audit.

Recovery must coordinate the website and backend. Do not re-enable the former automation alongside the replacement or replay entire submissions after partial success without reconciling existing records, messages and events. This documentation follow-up changes no application bytes.

## Published PR #9 release, October 11, 2026

Sean authorized review, fixes, tests, commits, PR updates, merge, production publication and a narrowly scoped rollback after successful checks. This supersedes the earlier draft-only restriction for [PR #9](https://github.com/seanpr1/magnolia-gardens/pull/9).

[PR #9](https://github.com/seanpr1/magnolia-gardens/pull/9) merged through the normal merge process at `2026-10-11T13:56:52Z`, producing `712de91a4a7560d4d25ec5b39d8a5d6fa126d6e3`. No checks or protections were bypassed. Its exact final head, `055ee9bb56060478954b86d24bc06c2a27923857`, passed both GitHub Site check runs and Cloudflare/Netlify checks. Cloudflare preview deployment `8c2c59db-1ef3-4e93-9c9f-cdba6a5d9ba6` at [the immutable preview URL](https://8c2c59db.magnolia-gardens.pages.dev/) passed eight-page/39-asset GET comparisons, canonical/sitemap/exclusion/indexing checks and 52 desktop/mobile browser checks with intercepted submissions and analytics.

Cloudflare production deployment `e8ad7e04-fd08-44c3-81f1-1dd736c41acc` successfully published `dist/` at `2026-10-11T13:57:40.193896Z`; its [deployment URL](https://e8ad7e04.magnolia-gardens.pages.dev/) and the authenticated hosting record identify merged revision `712de91a4a7560d4d25ec5b39d8a5d6fa126d6e3`. The [live site's version marker](https://magnoliagardenslandscaping.com/version.json) matched with clean `main`/`production` metadata and `no-store`. Production GET checks passed eight critical pages (home, quick request, privacy, application, planner, mowing, cleanup and Kingsport), 40 referenced assets, exact built bytes after the narrowly identified Cloudflare transformations, canonical URLs, sitemap/robots and six private-file exclusions. Production has no preview `noindex` header or meta restriction. The www version marker, homepage and privacy page also passed, with apex canonical links. The merged revision's Site check and Cloudflare checks passed.

Another 52 production browser checks passed at 390px and 1440px with hosted fonts: seven page layouts, privacy/hiring links, navigation and canonicals, with zero submission attempts and external tracking blocked. Desktop homepage and mobile application/footer screenshots were visually inspected. No material regression was found and no rollback was performed. This documentation-only follow-up advances the source/version marker without changing public application bytes. The PR records its final deployed revision and deployment identity after verification; the immutable release deployment above remains the reference for the application change.

The reviewed draft was `9d7c135a2f576d338df95f60bc702a94cef6758c`. The release preserves native homepage quote links, ten-digit minimum native phone validation with normal formatting, phone-only requests and optional details. It adds `/privacy/` to the publish allowlist and sitemap, links privacy from forms and public footers, exposes the existing application through “Join our crew,” and prevents privacy clicks from counting as price-planner entry.

Independent review found remaining unsupported start-time and fixed-slot claims, a same-day promise on the 404 page and in `llms.txt`, a missing planner footer privacy link, and an unverified one-year application-retention promise. Those are corrected. Quote copy now explains scope/price review and confirmation before booking; start dates depend on availability. FAQ HTML and JSON-LD were regenerated together. Existing prices, contact information, service areas, endpoints, routing, analytics settings and shared transport code remain unchanged. A reproduced service/area result-positioning defect is also fixed: result panels now center after layout settles so their heading is not hidden behind fixed navigation.

Application retention is described without a fixed deletion deadline. The owner confirmed on October 11 that applications will be archived or deleted as appropriate. Archiving retains records. This release does not implement or verify a provider deletion schedule, consent configuration or legal compliance, and makes no claim that a published notice proves those practices.

The implementation was checked against current official provider information: [Formspree](https://formspree.io/legal/privacy-policy/), [Zapier](https://zapier.com/legal/data-privacy), [Google Workspace](https://workspace.google.com/security/), [Jobber](https://www.getjobber.com/privacy-policy/), [Intuit/QuickBooks](https://www.intuit.com/privacy/), [Google Analytics](https://policies.google.com/technologies/partner-sites), [Microsoft Clarity](https://learn.microsoft.com/en-us/clarity/setup-and-installation/privacy-disclosure), [Meta](https://www.facebook.com/privacy/policies/uso/), and [Cloudflare](https://developers.cloudflare.com/speed/observatory/rum-beacon/). The notice distinguishes the homepage/quick-request Zapier mirror from the Formspree-only service/area and application forms. Provider-side settings and downstream receipt are separate evidence scopes.

PR #8 remains separate, open and unmerged. Its overlapping native CTA and phone-validation fixes were inspected; the raw-hook diagnostic remains disabled on that branch (`url` empty, `expiresAt` zero) and is absent from this release. No diagnostic code or configuration was imported.

Current hosting was verified in the authenticated Cloudflare project: build command `npm run build`, output `dist`, empty root, production branch `main`, automatic production deployments enabled. The original PR #9 deployment `8dd80063-db89-4c81-ae32-9d25615093ba` was actually skipped. New release commits and the PR title omit skip markers to permit required CI and preview checks.

Verified rollback target: revision `613aab8533ad4c7ab106b40fb9d5bc50a6d32182`, Cloudflare deployment `63204170-1f2e-4465-902f-f3df9ae81997`, URL `https://63204170.magnolia-gardens.pages.dev/`. The public production marker matched; GET-only comparison passed seven pages and 39 assets, canonical/indexing checks, sitemap/robots and public-file exclusions. Comparisons allow only observed Cloudflare email encoding/decoder injection and one precisely matched Insights script where present.

Fresh local `npm test` passed the deterministic build/publish checks, 54 static checks, 54 pricing combinations, 88 request/adapter checks and 18 shared-form contracts, on Node 24.21.0/npm 12.1.0/Python 3.14.5. `npm run fix:faq` completed. Local intercepted Chromium checks exercised all 11 customer forms at 390px and 1440px, phone-only and full optional details, native validation and quote links without JavaScript, privacy/planner event separation, result focus, and rejection/network/timeout/throwing-tracker outcomes. Layout checks covered seven routes at 320px, 390px and 1440px. The initial broad harness recorded 669 successful assertions and five flags. Four flags were incorrect harness expectations about link count and rejection wording. A focused rerun reproduced the fifth: a desktop service-form rejection heading could sit behind fixed navigation. The shared result-positioning fix subsequently passed 128 browser assertions across all eight service/area pages at 390px and 1440px, including accepted/rejected headings below navigation, focused results, one POST and no resend. Desktop and mobile result screenshots were inspected. Native click checks used centered scrolling without forced clicks. Screenshots were inspected for mobile privacy, request, planner and recovery layouts. These local screenshots block external fonts; hosted typography is checked separately. Cloudflare preview `45aaea1b-2d8b-408b-98ce-6ba83eef556c` served revision `5a92b12a7000e970cef70ab4d2f8bf2a66afce63`; eight pages and 39 assets, canonicals, exclusions and preview indexing passed GET checks. Another 52 hosted-browser checks passed at desktop/mobile sizes with actual hosted fonts and intercepted submissions/analytics. Desktop homepage and mobile application/footer screenshots were inspected. The build reported a pre-existing high-severity advisory in test-only `source-map-js`; its lockfile is updated from 1.2.1 to 1.2.2 per [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q). No dependency is added or published. A fresh locked install and the complete local suite passed after the update; npm audit reported zero vulnerabilities. The exact final revision and production results are recorded above.

Physical iPhone/Android behavior, assistive-technology use, provider analytics receipt and downstream lead/application receipt remain unverified. All browser submissions and analytics checks use mocks/interception. No live leads, applications, customer messages, test events, replays or Zap changes are part of this release.

## Published release — September 29, 2026

Sean approved publication after the Cloudflare setting fix. [PR #6](https://github.com/seanpr1/magnolia-gardens/pull/6) merged into `main` as `ac429d2c69f4864449dcb7ebd3dab53adf38b259`. Cloudflare production deployment `21d32458-2d96-4b38-a376-9166eea97faf` succeeded at `2026-09-29T23:54:28.003533Z`.

GET-only production verification passed: the clean `main`/`production` version marker matched that revision and carried `no-store`; five critical pages matched the tested build after separately excluding one observed 367-byte Cloudflare Insights script per page; all 16 referenced JS/CSS assets matched exactly. Both www routes served the release with apex canonical links. No preview `noindex` header leaked into production. Cloudflare and repository checks passed.

Physical iPhone/Android behavior, assistive technology, production analytics receipt and actual phone-only downstream receipt remain unverified. Publication does not certify those outcomes. No live test submissions, customer messages, CRM writes or Zap changes were made during the release.

The rollback artifact is deployment `cd1ce52d-e9bf-43f9-96cf-87daba0d9996`, revision `1c392f6edd8ee24ca8686a28074fcbfc03aae7fb`. Restore that existing artifact if an authorized rollback is needed; rebuilding its legacy source requires legacy build settings. No rollback was performed. Later documentation-only commits may advance the served revision; read `/version.json` and the hosting deployment for the current head. The application release verified above remains the reference for unchanged application bytes.

## Previous production baseline and draft history — September 29, 2026

The implementation coordinator inspected Cloudflare Pages metadata on September 29. The production deployment and revision below remained unchanged after the authorized build-setting update and PR #6 preview retry recorded below.

| Surface | Recorded state |
|---|---|
| Production | `https://magnoliagardenslandscaping.com/`; Cloudflare Pages project `magnolia-gardens`, production branch `main`, automatic production deploys enabled. |
| Production revision | `1c392f6edd8ee24ca8686a28074fcbfc03aae7fb` |
| Production deployment | `cd1ce52d-e9bf-43f9-96cf-87daba0d9996`, created `2026-09-20T01:42:46.648779Z` |
| Page evidence | September 29 GET checks of the homepage and `/estimate/` match that commit after excluding exactly one observed 367-byte Cloudflare Insights script appended to each page. Raw response bytes differ by that script; this comparison does not certify every deployed page. |
| Draft | [PR #6](https://github.com/seanpr1/magnolia-gardens/pull/6), branch `chatgpt/website-audit-fixes-2026-09-28`; reviewed base `c9ae1752617da9d560f5729669e5fb0fcdfb03bb`. The current head is identified by the PR and the generated preview marker below; historical source hashes are not substituted for the current deployment. |
| Netlify draft preview | `https://deploy-preview-6--heartfelt-halva-7fa350.netlify.app/`; inspect its [`/version.json`](https://deploy-preview-6--heartfelt-halva-7fa350.netlify.app/version.json) for the built commit and deployment ID. |
| Cloudflare preview retry | [PR #6 preview](https://5edf95a6.magnolia-gardens.pages.dev/), deployment `5edf95a6-c57e-4c59-82d0-231d4b8715e1`, revision `a5cffee38638a0fe5b096095d9b11724c8715fc8`. Build and deployment succeeded at `2026-09-29T23:38:43.606003Z`; served-content checks passed as recorded below. The [branch alias](https://chatgpt-website-audit-fixes.magnolia-gardens.pages.dev/) advances with later draft deployments; use its `/version.json` to identify the served revision. |
| Rollback candidate | The recorded production deployment and revision above; reverify before any release. |

## Cloudflare build settings applied — September 29, 2026

Sean explicitly authorized the build-setting fix and a PR #6-only preview retry. The coordinator applied and read back these project settings:

| Setting | Applied value |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Empty (repository root) |

The existing `.nvmrc` selects Node 24.19.0. Source and runtime configuration were unchanged by this action: build image v3, compatibility date `2026-07-19`, no compatibility flags, and no configured environment variables or bindings. Previews remain enabled for all branches.

The retry log verified Node 24.19.0 and npm 12.1.0, a clean install of 37 packages, and `npm run build` producing 79 public files with the `branch-deploy` version context. Build and deployment succeeded at the time recorded above. Read-only verification confirmed the expected revision, `branch-deploy` context and clean working-tree marker, a `no-store` header on `/version.json`, five of five critical pages matching the local build exactly, and all 16 referenced JS/CSS assets matching their content hashes and local bytes. Later documentation commits trigger new previews; the version marker identifies their actual deployed revision.

These settings apply project-wide. The former production revision `1c392f6edd8ee24ca8686a28074fcbfc03aae7fb` lacks `package.json` and the new build script; do not rebuild that old revision with the new settings. At the time of the setting fix, its deployment remained unchanged. It is now the retained rollback artifact. Rebuilding that old source requires its legacy settings; restoring its deployment artifact does not rebuild it. No rollback was performed. The initial setting-fix authorization excluded publication; Sean subsequently approved the release recorded above.

The source contains contact placeholders and requires rendering. Publish only `dist/`, never the repository root. For future releases, verify a successful Cloudflare preview of the approved revision and record the checks and remaining limits below.

### Historical evidence before the setting fix

The initial read-only inspection found empty Cloudflare build command, destination directory and root directory. `wrangler.jsonc` selected only `dist/` and preserved the compatibility date. Its output guard was verified on September 29 for application revision `f3a0a2e7bda0cdd223df4d20b7f979cb9419e1ea`: Cloudflare preview `554e1cc2-3fd4-4f24-ac97-146a6df4daa1` skipped the unspecified build command and failed because `dist` did not exist. It did not publish source templates. Netlify successfully built the rendered preview. This failure predates the authorized settings above.

## Pre-release validation history

- Source validation date: September 29, 2026. Current draft commit and preview deployment ID are generated in the marker linked above; the PR records the observed deployment and check results.
- The earlier draft-only restriction was superseded by Sean's publication approval and the release recorded above. Verification limits remain explicit.
- Offline setup/check: `npm ci --ignore-scripts`, then `npm test`.
- Actual offline result: a clean clone of application revision `f3a0a2e7bda0cdd223df4d20b7f979cb9419e1ea` with fresh locked dependencies passed on Node 24.19.0/npm 12.1.0/Python 3.14: build/failed-build preservation, 51 static checks, 54 pricing combinations, 79 adapter checks, and 18 shared-form/attribution/privacy contracts. No live requests.
- Browser evidence: 278 responsive checks across five widths/five pages; then 99 input/recovery/SMS checks and 87 homepage checks on the final application revision. The final checks verify visible result focus and no sideways hero scrolling. Twenty browser transport/throwing-tracker cases and campaign navigation/storage-fallback checks also passed. Physical-device limits below remain open.
- Preview verification: Netlify deployment `6abc37ab4fce2f0007a9a1f2` served application revision `f3a0a2e7bda0cdd223df4d20b7f979cb9419e1ea` with a clean working-tree marker. Five critical pages matched the local build after excluding the identified Netlify preview-toolbar injection; all 16 referenced JS/CSS content hashes matched. Preview noindex headers and no-store version marker were verified. GitHub Actions passed. Documentation-only follow-up commits may advance the head; use the generated marker for the current deployed head.
- Live submissions, customer messages, Zap changes and production release: outside this draft implementation.
- Remaining checks: physical iPhone/Android keyboard and native call/text behavior; assistive technology; production analytics configuration/receipt; observable downstream handling of phone-only inquiries. Mocked acceptance is not live delivery proof.

## Request-form finish verified September 29, 2026

The draft now shares a restrained card treatment, native optional-details rows, clearer field boundaries and validation, consistent request buttons and neutral result typography. Shared CSS and brand tokens own the finish; no package was added. Keyboard focus remains visible; pointer-triggered results avoid an extra focus frame. The phone-only path, transport, analytics and prices are unchanged by this refinement.

`npm test` passed again: build checks, 51 static checks, 54 pricing combinations, 79 adapter checks and 18 shared-form contracts. A separate intercepted-browser pass passed 311 checks across 320, 390, 768 and 1440px widths, including native disclosures, input/invalid focus, reduced motion, forced colors and JavaScript-disabled native forms. All 16 narrow-screen accepted/uncertain results remained visible; keyboard result rings and touch result styling were checked separately. No live requests were sent. These screenshots/checks use fallback fonts because external requests are blocked; hosted typography is a separate preview visual check. Physical-device and downstream-delivery requirements above remain open.

## Identify a deployed revision

1. Read `/version.json` on the exact production or preview hostname. The build generates revision, source date, hosting context/deploy ID and local-change status from Git/hosting metadata. Local dirty builds identify themselves; they are not production evidence.
2. Match the revision and deployment ID to the hosting deployment. A green preview remains a preview.
3. Check `/`, `/estimate/`, a service quote page and required assets on that hostname. A marker alone does not establish that every critical page is correct.
4. Record the observation time separately from the source commit's date. Never hard-code a commit ID into the build script or a checked-in version marker.

The recorded production baseline predates `version.json`. For that baseline or a rollback to it, use hosting metadata and critical-page comparison; an absent marker is expected.

## Authorized release and rollback record

Before release, record the current production deployment/revision as the rollback target, the approved draft revision, checks passed and unresolved limits. After release, record the observed public version and critical-page results. If rollback is required and authorized, restore the known hosting deployment, verify its public marker/pages, and record the time and reason. Keep private submissions and credentials out of this public record.

| Verification date/time | Production revision / deploy ID | Release checks | Rollback revision / deploy ID |
|---|---|---|---|
| October 11, 2026, after `13:57:40Z` | `712de91a4a7560d4d25ec5b39d8a5d6fa126d6e3` / `e8ad7e04-fd08-44c3-81f1-1dd736c41acc` | Correct production marker; 8 pages, 40 assets, www canonicals and indexing; 52 production browser checks. Physical-device, assistive-technology and provider/downstream receipt remain unverified. | `613aab8533ad4c7ab106b40fb9d5bc50a6d32182` / `63204170-1f2e-4465-902f-f3df9ae81997` |
| September 29, 2026, after `23:54:28Z` | `ac429d2c69f4864449dcb7ebd3dab53adf38b259` / `21d32458-2d96-4b38-a376-9166eea97faf` | Correct production marker; 5 pages and 16 assets; www canonicals and indexing headers verified. Physical-device, assistive-technology, analytics receipt and actual phone-only receipt remain unverified. | `1c392f6edd8ee24ca8686a28074fcbfc03aae7fb` / `cd1ce52d-e9bf-43f9-96cf-87daba0d9996` |
