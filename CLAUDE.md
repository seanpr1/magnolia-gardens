# CLAUDE.md — magnolia-gardens (website repo)

> Last updated: 2026-05-24

This is the **public website repo** for Magnolia Gardens Landscaping, LLC. It deploys to `magnoliagardenslandscaping.com` via GitHub Pages.

## You are probably in the wrong place

If you are looking for working rules, business spine, customer records, playbooks, pricing, or open questions, those live in the **private ops repo**:

- Repo: `github.com/seanpr1/magnolia-ops` (private)
- Local: `/Users/seanprice/magnolia-ops` (on Sean's machine)
- Read first: `magnolia-ops/CLAUDE.md` and `magnolia-ops/MAGNOLIA.md`

The ops repo is the single source of truth. Do not duplicate its content here.

## What lives in this repo

- `index.html` — the marketing site.
- `_estimator-wizard.html` — the lead-intake / quote-request form embedded into the marketing site.
- `ops-cqce2r.html` — the private operator dashboard (the `cqce2r` slug is a low-friction obscurity; not exposed in nav or sitemap).
- `assets/` — logos, favicons, hero pattern.
- `og-image.png` — Open Graph share image.
- `CNAME`, `robots.txt`, `sitemap.xml` — site config.

## Working rules

- This repo is **public**. Customer PII never lands here. Cross-check before committing anything that mentions a real customer name, address, or phone number.
- Voice for any marketing or website copy follows the rules in `magnolia-ops/CLAUDE.md` ("Voice" section).
- Changes ship via PR (the ops repo pushes direct to main; the site repo does not).
- Live deploy is GitHub Pages off `main`. CNAME points the custom domain at it.

## Halcyon residue

The previous brand (Halcyon Standard) left identifiers in this codebase that have since been renamed (e.g. the operator dashboard's localStorage key). If you find more Halcyon strings, rename them and add a one-time migration if user state would otherwise be lost. The renames already done are logged in `magnolia-ops/decisions/2026-05-24-pinned-context-reconciliation.md`.
