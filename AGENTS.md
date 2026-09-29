# Working on the public website

Follow the user's current requested outcome and scope. Read [README.md](README.md) and [docs/AUTHORING.md](docs/AUTHORING.md) before edits. For business decisions, consult the selected current Magnolia operations checkout's guidance when available; this public repository is not a copy of private operations records.

- Inspect the working tree and current PR head before editing or pushing. Preserve other work, reconcile changes, and never force-push an ongoing shared branch.
- Keep authoring HTML at existing paths. Build output is `dist/`; do not hand-edit it. Shared contact values belong in `config/site.json`, brand tokens in `assets/brand.css`, and customer planning prices in `assets/pricing.js`.
- Preserve phone-only requests, optional details, service context and existing URLs. Do not change prices, claims, service areas or customer promises as an incidental cleanup.
- Use shared form behavior and metrics modules. Delivery state must finish independently of tracking; accepted/unknown deliveries must not be automatically resent. Use fixed analytics labels and keep customer details out of telemetry.
- Test transport and analytics with mocks/interception. No customer records, credentials or real test submissions in the repository. Keep production Zap configuration read-only unless the user explicitly authorizes a change.
- Run `npm test` before proposing a commit. Record actual results and unresolved physical-device/delivery checks. Keep source FAQ and JSON-LD synchronized with `npm run fix:faq`.
- An authorized draft implementation does not authorize a production release, live lead test, customer message or PR merge. Record the draft/production distinction in [docs/RELEASE.md](docs/RELEASE.md).
