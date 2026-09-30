# Magnolia Gardens website

Public source for [Magnolia Gardens Landscaping](https://magnoliagardenslandscaping.com/). Existing HTML is the editable content; a small static build resolves shared contact values and publishes only website files.

## Setup and checks

Use Node **24.19.0** (`.nvmrc`), npm **12.1.0**, and Python **3.14**. No Python packages or global test libraries are required. If using nvm, run `nvm install` and `nvm use`. To match the lockfile toolchain, install npm 12.1.0 with `npm install --global npm@12.1.0` once in that Node environment.

From a fresh clone:

```sh
npm ci --ignore-scripts
npm test
```

`npm test` builds `dist/`, checks deterministic rendering and the publish allowlist, runs the Python static checker, and runs pricing, quick-request and shared-form regression checks. Forms and telemetry use local mocks; tests do not submit real leads. GitHub Actions runs this same command. Seasonal checks intentionally fail when public seasonal copy becomes stale.

For a local preview:

```sh
npm run build
npm run serve
```

Open `http://localhost:8080`. Analytics only loads on configured production hosts. **Local and hosted previews still contain real public form endpoints; do not submit them manually.** Use the mocked tests, or an explicitly authorized controlled delivery test.

## Where to edit

- [Authoring map](docs/AUTHORING.md): content, forms, contact settings, brand, pricing, analytics, schema and build ownership.
- [Release record](docs/RELEASE.md): production verification, draft status, validation limits and release/rollback procedure.
- [Verification evidence](docs/VERIFICATION.md): funnel event definitions, delivery observations and replay review limits.
- [Coding guidance](AGENTS.md): contribution and verification rules.

Edit FAQ copy in its HTML page, then run `npm run fix:faq` to regenerate FAQPage JSON-LD. Run `npm test` afterward. Do not edit `dist/` or generated `site-config.js`.

## Publishing

Netlify reads `netlify.toml`, runs `npm run build`, and publishes **only `dist/`** for the draft preview. The build copies an explicit public allowlist, excluding repository guidance, tests, configuration sources and dependencies. It generates `version.json` from Git/hosting metadata and versions local JS/CSS URLs by content hash.

The build finishes rendering and validation in a temporary directory before replacing `dist/`. A failed build preserves the last successful output; do not mistake that older preview for a passing build.

Production is hosted on Cloudflare Pages. On September 29, 2026, Sean authorized the build-setting fix and a PR #6 preview retry. The project settings were applied and read back: build command `npm run build`, output `dist`, and an empty root directory (repository root). The existing `.nvmrc` selects Node 24.19.0. The Cloudflare preview built and deployed successfully; its revision marker, five critical pages and 16 referenced assets were verified. See the [release record](docs/RELEASE.md).

Sean subsequently approved publication. PR #6 merged into `main` and was published on September 29, 2026; the production marker, five critical pages and 16 referenced assets were verified. Physical-device, assistive-technology and actual phone-only receipt checks remain unverified. See the [release record](docs/RELEASE.md) for the deployed revision and rollback target.

The build settings apply project-wide. The legacy revision `1c392f6` lacks the new build files; restoring its existing deployment artifact is different from rebuilding that old source, which requires its legacy settings.

A successful PR preview does not change production. After an authorized release, verify `/version.json` against the hosting deployment and check critical page contents, then update the release record.
