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

## September 30 lead-intake investigation

This is verification work, not a production fix. PR #6 and PR #7 are merged;
the live revision marker read on September 30 reports clean production `main`
at `613aab8533ad4c7ab106b40fb9d5bc50a6d32182`.
Fresh page/asset byte-comparison requests returned HTTP 403 from this execution
client, so this session verifies the marker, not fresh full deployed-byte parity.
The PR #7 release record remains the earlier served-content evidence.

### Source and parsing boundary

| Form | Browser delivery | Receipt evidence |
|---|---|---|
| Homepage hero and detailed | Same FormData snapshot POSTed to Formspree and the unconfirmed Zapier mirror | A populated hero request on September 30 has a Formspree notification, matching Jobber notification and sent acknowledgment. This is not phone-only evidence. |
| `/estimate/` | Same two destinations; adapter adds service description and project scope | Historical populated requests; fully phone-only production receipt remains unverified. |
| Service/area quote block | Formspree only; no browser Zapier mirror | Do not assume automatic Jobber creation. Phone-only production receipt remains unverified. |
| Static homepage/request form without JavaScript | Native POST to the Formspree form action | Shared JavaScript and its Zapier mirror do not run. Service/area forms themselves require JavaScript; their static call/text links remain. |

`assets/form-core.js` validates phone, builds FormData **before** disabling
controls, then sends the same snapshot to both configured destinations when
the adapter enables the mirror. No custom multipart Content-Type is set; the
transport creates the boundary. Empty/invalid phone fails validation without
a request. Provider acceptance is still only Formspree HTTP success.

The saved September 9 Zap v6 deployment record documents this downstream path:
Catch Hook parsed output → Code step with mapped name/email/address and the
complete trigger-output JSON → existing name/email gate or fallback alert.
The classifier reads top-level phone from that complete object. Phone-only
data goes to `manual_review` with the phone preserved, not `empty_webhook`;
automatic intake still requires valid name/email. This is historical saved
configuration, not a fresh confirmation of the current published Zap.

Catch Hook returns parsed data. The alert's serialized `Raw Output` therefore
does not establish the original HTTP body, method, sender or Content-Type.
Zapier documents the distinction between [Catch Hook and Catch Raw Hook](https://help.zapier.com/hc/en-us/articles/8496288690317-Trigger-Zap-workflows-from-webhooks).
Do not change the production trigger type to obtain diagnostics: that changes
the data contract. Never GET a production catch-hook URL as a health check.

### What the alerts establish

Both September 29 alerts contain exactly `{"querystring": {}}`. The first
email was sent at 19:52:24 Eastern, before PR #6 production publication at
19:54:28. The second was sent at 20:53:56, after PR #7 publication at
20:38:36. Email send times are not original request times. Matching empty
alerts also predate the release. Neither timing nor this parsed payload proves
that the source was a customer, test, bot, GET request or lost lead.

A newer, populated homepage submission arrived at 10:12:43 Eastern on
September 30. Matching Jobber and acknowledgment emails followed within
13 seconds. This rules out a universal post-release failure for that
populated route. Customer identities and private message IDs are intentionally
kept out of this public repository.

### Safe verification and decision

- `npm test` passes: build/publish checks, 51 static checks, 54 pricing
  combinations, 89 adapter checks and 18 shared-form contracts.
- The adapter suite now includes 10 field/encoding cases: phone-only and
  populated requests through hero, detailed, quick-request, service and area
  forms. It inspects in-memory multipart serialization, decoded fields,
  destinations, unchanged optional values, metadata and duplicate protection.
  jsdom FormData is bridged to Node's native FormData for Request/Response
  encoding. This is not a real-browser transport or provider-parser test.
- Six local fixtures executed the exact classifier recovered from the saved
  v6 deployment record: empty alert, phone-only, complete mapped request,
  mapping mismatch, unavailable raw payload and malformed raw payload. All
  returned the documented classifications. No live Zap execution was made.

No website runtime defect was reproduced that explains these alerts. Keep the
phone-only flow and existing transport; do not roll back or invent mandatory
name/email fields. The remaining risk is unverified minimal-request receipt
and manual follow-up, plus the unknown source/parsing of the empty events.
This work changes tests/documentation only, with no production publication,
live test inquiries, Zap changes, customer messages or record writes.

### Remaining read-only check

Zapier redirected to sign-in during this investigation. With authorized access,
inspect the existing two runs near the alert email times, record their actual
trigger timestamps and versions, compare the hook URL to `config/site.json`,
inspect any child-key selection and complete Step 1 output, and compare the
Code-step inputs/outputs and fallback mappings with saved v6. Compare an
existing populated run and any existing phone-only run. Do not replay, test
actions, create a draft Zap or publish changes. If the original request method,
headers and unparsed body are unavailable, preserve that limit; do not infer
them from `querystring`. A live test would require separately authorized,
controlled downstream effects and should only follow this read-only check.
