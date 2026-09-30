# Website authoring map

## Content and appearance

| Change | Editable source |
|---|---|
| Homepage copy, layout and proof | `index.html` |
| Service/area copy and layout | `services/*/index.html`, `areas/*/index.html` |
| Quick-request page | `estimate/index.html`, `assets/request.css` |
| Optional planning page | `estimate/planning/index.html`, `assets/planning-range.js` |
| Hiring/application pages | `hiring/index.html`, `apply/index.html` |
| Existing field quote tool | `quote/index.html`, `quote/sw.js` |
| Shared public palette, fonts and spacing/type tokens | `assets/brand.css` |
| Navigation behavior/styles | `assets/site-nav.js`, `assets/site-nav.css` |
| Work photos and logo files | `assets/work/`, other image files under `assets/` |

Keep page-specific layout rules in their existing stylesheets. Reuse brand variables instead of adding another palette. Logo/image artwork has its own colors; a brand change that includes artwork needs a separate asset edit and visual review.

Request cards use `request-surface`, forms use `request-form`, submit buttons use `request-action`, and delivery panels use `request-status`. Their shared finish lives in `assets/form-ui.css`, loaded **after** page/layout styles. Keep these classes in static HTML and in the service/area renderer; do not duplicate the polish in each page or attach it to generated IDs. Field, border and error colors live in `brand.css`.

The finish uses native controls and CSS, with no package or icon dependency. Preserve native disclosure markers, visible focus, 16px inputs, 48px targets, reduced-motion and forced-colors support. Avoid animated layout or result transforms: result focus and scroll positioning are part of delivery usability. After visual edits, check the home, quick-request and service/area forms at narrow and wide widths, including optional details and accepted/uncertain results.

## Contact and public configuration

Edit **`config/site.json`** for public phone formats, existing email destinations, form endpoints, timeout, and production analytics host names. The contact fields preserve separate purposes: `email` is public information, `ownerEmail` is the published direct contact, and `hiringEmail` is applications. Keep phone formats consistent when changing the number; the build rejects mismatches. These values are public and must never contain credentials.

HTML and `llms.txt` can reference `{{contact.phoneDisplay}}`, `{{contact.telHref}}`, and the other contact keys in that file. Static form actions can use `{{forms.formspree}}`; `{{forms.zapierMirror}}` is also supported. `{{brand.primary}}` reads `--gold` directly from `assets/brand.css`. Do not maintain a second theme-color value. Unknown placeholders fail the build.

The build resolves placeholders into static, crawlable output and generates `dist/assets/site-config.js`, exposing `window.MG_SITE_CONFIG` for scripts. Do not add a source copy of that generated file. Contact values are restricted to plain text safe for HTML attributes and JSON-LD strings; this is not a general template language.

## Forms and measurement

| Responsibility | Source |
|---|---|
| Shared validation, transport and final delivery state | `assets/form-core.js` |
| Landing campaign context and storage fallback | `assets/campaign-context.js` |
| Versioned funnel events and nonthrowing telemetry | `assets/form-metrics.js` |
| Homepage form presentation adapter | `assets/home-forms.js` |
| Quick-request presentation adapter | `assets/quick-request.js` |
| Service/area quote-block presentation adapter | `assets/quote-block.js` |
| Shared form/quote-block presentation | `assets/form-ui.css`, `assets/quote-block.css` |
| Browser error reports with fixed labels | `assets/error-reporting.js` |
| Offline behavior regressions | `scripts/test-form-core.cjs`, `scripts/test-quick-request.cjs` |

Load generated configuration and shared modules before adapters. Provider HTTP acceptance, observable receipt by Magnolia and later booking are separate outcomes. Browser tests establish only their mocked browser behavior.

See [verification evidence](VERIFICATION.md) for event definitions, delivery observations and replay review limits.

## Prices, SEO and deployment

- `assets/pricing.js` owns the customer planning calculator's numeric rules and published ranges. Preserve commercial terms during refactoring. `scripts/test-project-quotes.cjs` keeps project services from receiving lawn-size prices. The existing field tool under `quote/` is separate; changes to its commercial rules need explicit scope and verification.
- Page titles, descriptions, canonicals and JSON-LD stay in their HTML pages. Edit visible FAQ copy first, then `npm run fix:faq`; generated FAQ JSON-LD remains in the authoring page. Run `npm test` afterward.
- `sitemap.xml`, `robots.txt`, `llms.txt`, and `CNAME` remain explicit public source files.
- `scripts/build.cjs` resolves shared values, copies a public allowlist to `dist/`, creates runtime config/version metadata, and hashes local asset URLs. New top-level public directories must be deliberately added to the allowlist.
- `scripts/site_check.py` checks `dist/` by default; `SITE_ROOT` or `--root` can override it. Dependency, scratch and generated directories are excluded from source-mode scans. `npm test` supplies the rendered root to all checks.
- `netlify.toml` selects the Netlify draft-preview build command and `dist/` folder. `wrangler.jsonc` restricts Cloudflare Pages output to `dist/` while preserving the verified compatibility date. Cloudflare project settings were authorized, applied and read back on September 29, 2026: `npm run build`, output `dist`, empty root directory. The existing `.nvmrc` selects Node 24.19.0. The PR #6 preview built, deployed and passed the served-content checks recorded in [the release record](RELEASE.md). That record also defines authorization boundaries. `.github/workflows/site-check.yml` owns CI and scheduled seasonal verification.

Cloudflare's build settings apply project-wide. Sean subsequently approved publication, and PR #6 is now merged and deployed with this build system. Only the legacy revision `1c392f6` lacks the new build files; rebuilding that old source requires legacy settings. The [release record](RELEASE.md) identifies the verified deployment, existing rollback artifact and remaining verification limits.

The build is deterministic for identical source, configuration and hosting metadata. `version.json` records the commit's date, not a fabricated release time. Release verification date is recorded separately in `docs/RELEASE.md`.

Builds render into an ignored sibling staging directory and replace `dist/` only after rendering succeeds. Failed rendering leaves the previous output intact. Run one build at a time, and check its exit status before using the preview as current evidence.
