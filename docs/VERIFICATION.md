# Form measurement and delivery verification

## What each outcome means

| Signal | Definition | Counting rule |
|---|---|---|
| `mg_form_view` | At least 25% of the form is visible, or the visitor interacts/submits before visibility detection. | Once per form instance. |
| `mg_form_start` | Trusted interaction with a form control. Programmatic focus and Tab navigation alone are excluded. | Once per form instance. |
| `mg_form_attempt` | Submit reaches validation while the form is idle. | Each attempt, including validation failures. |
| `mg_form_invalid` | Invalid phone or optional email. | Fixed reason: `invalid_phone` or `invalid_email`; no transport. |
| `mg_form_error` | Provider rejection, network failure or deadline. | Fixed reason: `http_rejected`, `network_failure`, or `timeout`; no conversion. |
| `mg_form_accepted` | Formspree returns an HTTP success status. | Once per accepted form instance. Canonical browser acceptance metric. |
| Observable inquiry | An actionable request is visible in an authorized Magnolia inbox or record. | Verify downstream separately; reconcile duplicates. |
| Qualified inquiry / booked job | Confirmed business outcome in existing operational records. | Separate from acceptance and call/text clicks. |

Funnel properties use measurement version `3`, a fixed form location, and allowed service/size/frequency values. Missing values remain `unknown`. `lead_submit` and `generate_lead` are compatibility aliases for the same acceptance; never add all three together. Text/call clicks are intent, not completed calls, texts or leads. Preview hosts keep analytics disabled.

Every transport result closes that form instance to repeat submissions. Timeout/network failure cannot establish whether the request arrived. Homepage and quick-request also preserve the existing unconfirmed Zapier copy, so even a Formspree rejection uses uncertain-delivery recovery. Recovery provides native call/text links and a masked, read-only copy of entered details. It does not resend either route. Analytics exceptions cannot change the displayed result or reopen submission.

## Attribution and privacy

`assets/campaign-context.js` retains the original marketing path, external referrer origin and bounded campaign tags in session storage for a 30-minute visit. Internal navigation renews the expiry without replacing the original campaign. The submitting page is recorded separately. Service selection belongs to form context and does not overwrite campaign attribution. Storage failure falls back to the current page's in-memory context; cross-page retention cannot be guaranteed when browser storage is blocked.

Never put customer contact values in campaign tags. Arbitrary queries, referrer paths, email-shaped values and long phone-like values are excluded. Browser events have an allowlist of properties and values; diagnostic events contain fixed error categories, not error messages/URLs. Text links carry generic copy, not typed addresses or notes. Detailed input remains in the provider payload and masked form controls only.

## September 29 read-only evidence

- Eleven existing delivery notifications were inspected: nine homepage requests and two historical estimator requests. Some optional email/message fields were blank, but none established a fully phone-only receipt. They are historical route evidence, not acceptance totals for this draft.
- The featured submission recording showed a confirmation; a corresponding populated homepage notification was observable. The featured abandonment recording reached the first estimator step at the end. It did not identify a problematic field.
- The single dead-click recording targeted static headings/body copy and included text selection. It did not justify another interaction change.
- The existing testimonial was verified against its original five-star Google review. The homepage links its source listing. No new rating or claim was added.
- The current Formspree dashboard required sign-in. Phone-only provider rules, downstream routing and any Jobber creation remain unverified. The live Zap stayed read-only; no live form was submitted.

## Open verification after the approved September 29 release

PR #6 is merged and published; hosting revision and critical-page checks passed as recorded in [RELEASE.md](RELEASE.md). The following device and delivery checks remain unverified. The release did not include live test submissions or Zap changes.

1. With authorized provider access, inspect existing minimal requests for each route: homepage hero, homepage detailed, `/estimate/`, and service/area quote block. Verify usable phone, optional blanks, destination and follow-up ownership. If no qualifying record exists, obtain separate authorization for a controlled live test with downstream effects understood; do not infer delivery from mocks.
2. On physical iPhone and Android, verify phone keyboard/autofill, keyboard-open sticky clearance, optional details, error focus and native call/text handoff without sending. Desktop Chrome responsive checks are recorded in release evidence; they do not replace physical-device or assistive-technology checks.
3. Hosting revision and critical pages were verified after publication. Next compare complete periods with counts and denominators for starts, attempts, acceptances, observable inquiries, qualified inquiries and bookings. Production analytics receipt remains unverified. Investigate acquisition/collection changes separately from conversion changes. September 20–26 predates this redesign.

No new CRM integration, dashboard or traffic campaign is introduced by this work.
