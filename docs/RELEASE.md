# Website release record

## Verified production baseline — September 29, 2026

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

These settings apply project-wide. Production `main` at `1c392f6edd8ee24ca8686a28074fcbfc03aae7fb` lacks `package.json` and the new build script; do not rebuild that old revision with the new settings. The existing production deployment remains unchanged and remains an existing artifact that can be restored if a rollback is separately authorized. Rebuilding that old source would require its legacy build settings; restoring the deployment artifact does not rebuild it. No rollback was performed. This authorization does not include a merge, production release, live lead submission or customer message.

The new source contains contact placeholders and requires rendering. Publish only `dist/`, never the repository root. Before any separately authorized release, verify a successful Cloudflare preview of the approved revision and complete the remaining release checks below.

### Historical evidence before the setting fix

The initial read-only inspection found empty Cloudflare build command, destination directory and root directory. `wrangler.jsonc` selected only `dist/` and preserved the compatibility date. Its output guard was verified on September 29 for application revision `f3a0a2e7bda0cdd223df4d20b7f979cb9419e1ea`: Cloudflare preview `554e1cc2-3fd4-4f24-ac97-146a6df4daa1` skipped the unspecified build command and failed because `dist` did not exist. It did not publish source templates. Netlify successfully built the rendered preview. This failure predates the authorized settings above.

## Current draft validation

- Source validation date: September 29, 2026. Current draft commit and preview deployment ID are generated in the marker linked above; the PR records the observed deployment and check results.
- Keep the draft open and unmerged. A merge or production release requires separate authorization and completion of the remaining verification.
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
| No release from this draft recorded | — | — | — |
