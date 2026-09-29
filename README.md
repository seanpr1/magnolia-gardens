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

Production is hosted on Cloudflare Pages. Its currently recorded legacy build settings require a separately authorized update before release: build with `npm run build` and publish `dist/`. See the release record; do not merge raw templates into the production branch before that prerequisite is complete.

A successful PR preview does not change production. After an authorized release, verify `/version.json` against the hosting deployment and check critical page contents, then update the release record.
