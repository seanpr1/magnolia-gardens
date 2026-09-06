# magnolia-gardens

Website source for **Magnolia Gardens Landscaping LLC** - residential lawn care in Kingsport and the Tri-Cities, TN.

- Live site: https://magnoliagardenslandscaping.com
- Owner: Sean Price (Member-Manager) | 423-390-9954
- Repo renamed to `magnolia-gardens` on 2026-05-21. GitHub auto-redirects the prior repo path; the custom domain (CNAME) is unaffected.

## Checks

No build step. Before committing, run:

    python3 scripts/site_check.py

It validates every JSON-LD block, FAQ parity between the visible FAQ and the FAQPage schema, the seasonal hero lines and title on the homepage, meta description lengths, internal links, and the sitemap. `--fix-faq` regenerates each page's FAQPage JSON-LD from its visible FAQ, so edit the HTML and run that instead of editing the schema by hand. The same script runs in GitHub Actions on every push and on the 1st of March, May, September, and December to catch stale seasonal copy.
