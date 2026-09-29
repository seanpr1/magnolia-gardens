# Website release record

## Verified production baseline — September 29, 2026

The implementation coordinator inspected current Cloudflare Pages metadata read-only on September 29. This records production independently of the draft work.

| Surface | Recorded state |
|---|---|
| Production | `https://magnoliagardenslandscaping.com/`; Cloudflare Pages project `magnolia-gardens`, production branch `main`, automatic production deploys enabled. |
| Production revision | `1c392f6edd8ee24ca8686a28074fcbfc03aae7fb` |
| Production deployment | `cd1ce52d-e9bf-43f9-96cf-87daba0d9996`, created `2026-09-20T01:42:46.648779Z` |
| Page evidence | September 29 handoff reported homepage and `/estimate/` matching that commit byte for byte. That comparison did not certify every deployed page. |
| Draft | [PR #6](https://github.com/seanpr1/magnolia-gardens/pull/6), branch `chatgpt/website-audit-fixes-2026-09-28`; reviewed base `c9ae1752617da9d560f5729669e5fb0fcdfb03bb`. The current head is identified by the PR and the generated preview marker below; historical source hashes are not substituted for the current deployment. |
| Draft preview | `https://deploy-preview-6--heartfelt-halva-7fa350.netlify.app/`; inspect its [`/version.json`](https://deploy-preview-6--heartfelt-halva-7fa350.netlify.app/version.json) for the built commit and deployment ID. |
| Rollback candidate | The recorded production deployment and revision above; reverify before any release. |

## Release prerequisite: Cloudflare build settings

The read-only inspection found empty Cloudflare build command, destination directory and root directory; previews are enabled for all branches. Both contexts use build image v3, compatibility date `2026-07-19`, no compatibility flags, and no configured environment variables or bindings.

`wrangler.jsonc` preserves that compatibility date and selects only `dist/`. This guard was verified on September 29 for application revision `f3a0a2e7bda0cdd223df4d20b7f979cb9419e1ea`: Cloudflare preview `554e1cc2-3fd4-4f24-ac97-146a6df4daa1` skipped the unspecified build command and failed because `dist` did not exist. It did not publish source templates. Netlify successfully built the rendered preview.

The new source contains contact placeholders and requires rendering. Before an authorized release/merge, separately authorize and verify the Cloudflare build configuration: Node 24.19.0, `npm run build`, output `dist/`. Do not publish the repository root. The current production account configuration has not been changed by this draft implementation.

## Current draft validation

- Source validation date: September 29, 2026. Current draft commit and preview deployment ID are generated in the marker linked above; the PR records the observed deployment and check results.
- Keep the draft open and unmerged until the release prerequisites below are satisfied.
- Offline setup/check: `npm ci --ignore-scripts`, then `npm test`.
- Actual offline result: a clean clone of application revision `f3a0a2e7bda0cdd223df4d20b7f979cb9419e1ea` with fresh locked dependencies passed on Node 24.19.0/npm 12.1.0/Python 3.14: build/failed-build preservation, 51 static checks, 54 pricing combinations, 79 adapter checks, and 18 shared-form/attribution/privacy contracts. No live requests.
- Browser evidence: 278 responsive checks across five widths/five pages; then 99 input/recovery/SMS checks and 87 homepage checks on the final application revision. The final checks verify visible result focus and no sideways hero scrolling. Twenty browser transport/throwing-tracker cases and campaign navigation/storage-fallback checks also passed. Physical-device limits below remain open.
- Preview verification: Netlify deployment `6abc37ab4fce2f0007a9a1f2` served application revision `f3a0a2e7bda0cdd223df4d20b7f979cb9419e1ea` with a clean working-tree marker. Five critical pages matched the local build after excluding the identified Netlify preview-toolbar injection; all 16 referenced JS/CSS content hashes matched. Preview noindex headers and no-store version marker were verified. GitHub Actions passed. Documentation-only follow-up commits may advance the head; use the generated marker for the current deployed head.
- Live submissions, customer messages, Zap changes and production release: outside this draft implementation.
- Remaining checks: physical iPhone/Android keyboard and native call/text behavior; assistive technology; production analytics configuration/receipt; observable downstream handling of phone-only inquiries. Mocked acceptance is not live delivery proof.

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
