# Form measurement and delivery verification

## October 4: customer submission audit and native fallback fixes

The deployed revision was read from `/version.json` as clean production
`613aab8533ad4c7ab106b40fb9d5bc50a6d32182`. Tests used those public page and
asset bytes in real Chromium at desktop (1440 × 1000) and mobile (390 × 844)
sizes. Every provider POST and analytics request was intercepted before page
navigation. Synthetic details never reached Formspree, Zapier, Jobber or a
mailbox. These tests verify browser behavior and payload construction; they
do not establish provider acceptance or downstream delivery.

### Coverage and routing

| Customer option | Browser coverage | Delivery boundary |
|---|---|---|
| Homepage hero and detailed form; `/estimate/` quick request | Each form with phone only and all optional details, at both sizes | Formspree primary plus the existing separate Catch Hook copy; matching decoded multipart fields at both destinations |
| `/services/mowing/`, `/services/maintenance/`, `/services/cleanup/`, `/services/mulch/`, `/services/brush-clearing/` | Each form with phone only and all optional details, at both sizes | Formspree only; no direct Zapier mirror |
| `/areas/kingsport/`, `/areas/bristol/`, `/areas/johnson-city/` | Each form with phone only and all optional details, at both sizes | Formspree only; no direct Zapier mirror |
| `/estimate/planning/` | All 24 service/size/frequency links at both sizes; one complete planner-to-quick-request submission at each size | Planner carries context to `/estimate/`; it is not a separate submission or a numeric-price payload |
| Call, text and text-photos links | Destination/link inspection, including the no-JavaScript fallbacks | Opens the device's phone/message app; no call, text or photo was sent |

All **44** normal browser cases passed. Phone-only optional blanks, formatted
phone numbers, full details/Unicode, context fields, one request per configured
destination, confirmation/focus and duplicate-submit protection were checked.
Two mobile optional-details clicks initially timed out in the test harness;
both passed with the control centered in the viewport, without force-clicking
or changing website code. All **44** validation/honeypot cases also passed.
All **66** failure cases (each form × both sizes × HTTP rejection, network
failure and the actual 15-second timeout) preserved recovery details and
call/text options, emitted no acceptance, and did not automatically resend.
Two failure cases needed the same centered-scroll harness retry. Planner
checks covered its 24 combinations at each size (48 in total).

The eight service/area forms are JavaScript enhancements. Without JavaScript,
their existing call/text and quick-request links remain available. The two
homepage forms and quick-request form retain native Formspree POSTs, without
the JavaScript-only mirror, timestamp or campaign fields. Hiring and the
internal quote tool are separate from these customer inquiry routes.

### Confirmed defects and draft repairs

The deployed site has two fallback defects when JavaScript is unavailable:
two repeated homepage quote buttons have no native destination, and the three
native phone inputs accept non-phone text such as `abc`. PR #8 changes those
two buttons into links to the existing hero form and adds native phone
patterns matching the existing JavaScript minimum of ten digits. Formatted
and international numbers remain accepted. These repairs are **draft only**;
the deployed site still has the defects until a later authorized release.
Normal JavaScript intake, optional-field requirements, endpoints, prices and
the production Zap are unchanged.

All ten focused browser checks of the draft passed: six native-form cases
reject letters/short numbers and accept a valid phone with optional email
blank; two no-JavaScript CTA checks navigate to the form; two JavaScript CTA
checks retain phone focus. The audit also exercised 22 production
no-JavaScript route cases and reproduced both inert CTA locations. Those
defect reproductions are evidence of the deployed problems, not claims that
every production fallback works.

The full repository suite passed after these repairs: deterministic
build/publish checks, 51 static checks, 54 pricing combinations, 89 adapter
checks and **71** shared-form contracts. Regression checks cover native
phone validation and each quote link's real destination. Provider/analytics
transport in that suite is mocked, and remote CI is intentionally skipped
by the draft's deployment-suppression markers.

### Actual receipt evidence and remaining delivery checks

Fresh read-only Gmail and Jobber inspection matched the latest visible
populated website receipt (September 30) to its existing Jobber request,
including phone, contact details and project message, plus a SENT
acknowledgment. This establishes preservation of that specific inquiry;
SENT does not establish customer receipt or reading. Private identifiers and
follow-up details remain in the existing private investigation record.

The production Zap remains enabled on published v6. Its published classifier
and fallback email mapping were read again. Sixteen offline cases using that
classifier preserve phone-only details for manual review; automatic intake
requires a name and valid email. The fallback is configured to send the state
and complete captured payload to the quotes inbox. This is configuration and
offline evidence, not a new phone-only receipt. Service/area forms have no
direct automatic Jobber route in the website and must also be reconciled
against Formspree and the inbox.

**No all-clear for lost submissions is claimed.** Formspree requires sign-in
before its current Inbox, Spam, Over Limit, quota and delivery/workflow
settings can be inspected. Its [over-limit documentation](https://help.formspree.io/articles/form-and-project-settings/over-limit-submissions)
explains that forms can keep accepting stored submissions while notifications
and plugins stop at the account limit. No quota failure was established in
this audit; mailbox and Zap-history absence cannot exclude that condition.
Current-release fully phone-only and service/area provider receipt, physical
iPhone/Android handoff, and actual call/SMS delivery remain unverified.
No live test, replay, customer contact, Zap change, deployment or merge was
performed. Preserve existing records and inspect those provider folders before
choosing any recovery or controlled live test.

## October 4: separate raw-hook diagnostic prepared, disabled

Zapier Support's October 4 reply was read directly and supersedes the earlier
unresolved diagnostic-path question. Catch Hook and Catch Raw Hook are separate
triggers. The existing Catch Hook endpoint cannot retain its current parsed
output and also expose future raw requests. For multipart FormData, Catch Raw
Hook retains the unparsed body and headers, with a **2 MB body limit**; it does
not produce the production Zap's normalized fields. A parser would be needed
for field extraction, but is unnecessary for the first raw-body screenshot.
The [official webhook guide](https://help.zapier.com/hc/en-us/articles/8496288690317-Trigger-Zap-workflows-from-webhooks)
also documents the trigger distinction and limit. The private investigation
record retains the support message identity and exact receipt time.

Support recommends preserving the production Zap and using a separate Catch
Raw Hook diagnostic Zap for a small number of future mirrored submissions.
An unpublished Zap can receive controlled editor test samples during setup;
it is not a reliable passive collector for an extended production window.
Support requested a screenshot of one mirrored Catch Raw Hook test result.
No diagnostic Zap, webhook URL, sample, screenshot or support reply has been
created/sent in this draft update.

This resolves the supported **future diagnostic method**, not the cause of the
old empty runs. Support says `{"querystring": {}}` only establishes that no
parsed body fields were retained; it cannot identify the original sender or
distinguish absent fields from an unparsed body format. Historical source
identity, possible duplicate upstream requests and current-release phone-only
receipt/manual follow-up remain unverified.

### Draft implementation and bounds

`config/site.json` leaves `forms.rawHookDiagnostic` at
`{"url":"","expiresAt":0}`. **The new diagnostic webhook URL is unset and is
the missing external configuration.** No production endpoint is reused or
invented. The normal Formspree request and existing Catch Hook copy retain
their destinations, fields and behavior.

The optional branch in `assets/form-core.js` applies only to forms already
using the production mirror: homepage hero/detailed and `/estimate/`.
Service/area forms, hiring and native no-JavaScript submissions are unchanged.
It reuses the completed FormData snapshot captured before controls are
disabled, including adapter and campaign fields. It adds no payload fields,
custom multipart header, telemetry, storage or customer-facing UI.

The diagnostic is armed only in a selected page's in-memory configuration,
with an expiry no more than five minutes away. It attempts at most **one** raw
POST across that page's forms, even if that POST fails. Invalid configuration,
expired/missing expiry, a non-Zapier URL or either existing destination is
ignored. Normal validation and honeypot handling still send nothing.
The primary Formspree request starts before the diagnostic fetch. The extra
`no-cors` request is never awaited or retried; thrown errors, rejected or
pending requests and opaque responses cannot control customer results or
conversion metrics. It omits `keepalive` to avoid competing with the existing
mirror's shared keepalive body quota; navigation can cancel the diagnostic.

This is a one-page controlled test, not a global sampling system. Reloading
clears the arm and resets the attempt allowance; another sample requires
explicitly arming again. Do not commit a real URL/expiry or broadcast this
configuration to visitors. Keep the test page open while collecting evidence.
The 2 MB limit is enforced by Zapier, not measured by this helper; choose one
small text-only sample well below that limit.

### Offline validation on October 4

The updated draft passed `npm test` with Node 24.21.0 (within the declared
24.x engine range), npm 12.1.0 and Python 3.14.5: deterministic build/publish
checks, 51 static checks, 54 pricing combinations, 89 adapter checks (including
the existing 10 multipart-encoding cases) and 70 shared-form contracts.
The latter include disabled/invalid/expired/colliding configuration, one
attempt across forms, payload preservation, dispatch order and all four
primary outcomes crossed with diagnostic success/rejection/failure/throw/hang.
The committed configuration is also checked to remain blank and disarmed.
All transport and telemetry were mocked; no provider or analytics requests
were made. These results do not prove actual browser transport, Zapier raw
capture, downstream receipt or the requested screenshot.

### Smallest later test and cleanup

These steps are prepared for a separately authorized live test; none has run.

1. Create a **separate** diagnostic Zap with Webhooks by Zapier → Catch Raw
   Hook. Do not change the production Zap's trigger, mappings, version,
   alerts or downstream steps. Keep the diagnostic free of Jobber, email,
   conversion and other downstream actions. Open its trigger Test tab and
   copy its new URL. Do not probe either hook with GET.
2. Use a page running this reviewed draft only after preview/release or local
   live-test execution is authorized. Ordinary local previews still contain
   real production intake endpoints. Decide the single sample and account
   for its normal Formspree/production-Zap effects before submission; a
   synthetic sample can still create real records or messages.
3. In that page's browser console, fill the empty string below with the new
   diagnostic URL and run it once. This does not submit the form. The empty
   default stays disabled. Do not change `formspree` or `zapierMirror`.

   ```js
   window.MG_SITE_CONFIG.forms.rawHookDiagnostic = {
     url: '', // UNSET: separate Catch Raw Hook URL supplied by its Test tab
     expiresAt: Date.now() + 5 * 60 * 1000
   };
   ```

4. Submit one authorized small sample through an eligible form. Use the
   existing `submitted_at`, form `source` and submitting path to correlate
   the three copies and capture times; add no special customer fields. In
   the diagnostic Zap's Test tab, retrieve that sample and inspect the raw
   multipart body and headers, including Content-Type/boundary and expected
   fields/optional blanks. A `no-cors` browser response is not proof of
   receipt. Reusing FormData preserves field content, not byte-identical
   multipart boundaries or headers across separate requests.
5. Capture the requested screenshot showing the **separate diagnostic**
   trigger, matched sample, raw body and relevant headers. Keep customer
   data, hook URLs and private account details out of the public PR. Store
   the original privately; review/redact unrelated sensitive content before
   an authorized reply in the existing support case. Record actual capture
   and provider results; do not fabricate a screenshot from local mocks.
6. Disarm immediately by setting the object back to
   `{url: '', expiresAt: 0}` or closing/reloading the page. Disable/remove
   the separate diagnostic Zap after its authorized window, leaving the
   production Zap alone. Never automatically resend a failed/unknown
   sample; any further sample needs an explicit decision about duplicates.

A later passive traffic window would need separately reviewed collection and
deployment choices; this one-page test does not silently enable one.

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
automatic intake still requires valid name/email. Authenticated read-only
inspection on September 30 confirmed published v6 and the same executed
classifier in both empty runs and the newer populated run.

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
September 30. Its live run contains the populated top-level contact fields,
classifies them as `ready`, and successfully executes Jobber client lookup,
request creation and the Gmail acknowledgment. Matching Formspree, Jobber
and acknowledgment emails corroborate the same submission. This rules out a universal post-release failure for that
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

### Completed live read-only inspection

After authentication, the two existing alert runs were traced through Catch
Hook, Code, fallback and Gmail. Gmail-step output IDs match the two supplied
messages exactly. Both ran published v6; the enabled Zap still uses v6.
An existing unpublished draft was left untouched.

| Event | Actual trigger time (Eastern) | Observed path |
|---|---|---|
| First alert | September 29, 19:52:08 | Catch Hook contains only empty querystring; Code receives exactly `{"querystring": {}}`; `empty_webhook`; fallback email |
| Second alert | September 29, 20:53:49 | Same parsed output, Code input and classification; fallback email |
| Populated homepage request | September 30, 10:12:43 | Top-level contact/body fields; `ready`; automatic Jobber and acknowledgment path |

Times use the editor's explicit GMT-07:00 timestamps converted to Eastern,
corroborated by message timestamps. The legacy history table labels those
same displayed clock values UTC; that inconsistent label is not used here.

The configured hook URL matches `config/site.json`; Pick off a Child Key
is empty. No contact fields disappeared between the captured trigger output
and the classifier. The inspected history does not expose the original HTTP
method, headers, sender or unparsed body. Therefore it cannot determine why
those requests were empty or whether data was lost before parsed capture.
A populated run also has an empty querystring alongside its populated body
fields: an empty querystring by itself is not evidence of a failed POST.

The source-to-alert trace is now verified, but there is still no observed
fully phone-only production receipt in the inspected evidence. Phone-only
submissions depend on manual review; Formspree-only routes must not be assumed
to enter Jobber. Closing that specific delivery gap requires an existing
qualifying receipt or a separately authorized controlled live test with
downstream effects understood. No replay, test action, Zap edit or publication
was performed.

## October 1 follow-up: September 30 evening alerts

This initial mailbox-only pass is retained as dated evidence. The completed
authenticated follow-up below supersedes its run-identity and access gaps.

The September 30 PR update at 21:33:40 UTC predates three additional alert
emails: two at 22:10:30 UTC and one at 23:01:15 UTC. All three contain exactly
`{"querystring": {}}` and `Classification: empty_webhook`.

### Message identity and source-run limits

The simultaneous emails have different Gmail message IDs, thread IDs and
RFC Message-ID headers. They are two distinct email artifacts, each carrying
both SENT and INBOX labels; those labels are not separate notifications.
Their bodies and second-level timestamps match. Neither their bodies nor
their available MIME headers contain a Zapier run or source-request ID.
This does **not** establish whether one source run sent twice or two source
runs sent once each. Do not deduplicate source events by timestamp/body alone.

The later email has a third distinct message identity, 50 minutes 45 seconds
after the simultaneous pair. It establishes later alert recurrence; without
the run-to-Gmail-output mapping it does not establish a distinct source run
or identify its original request.

### Later populated submissions

Connected Gmail searches completed by October 1, 13:18 UTC covered messages after the
PR update, after the simultaneous pair and after the later alert. Searches
included spam/trash and Formspree, submission, manual-review, quote-request,
webhook and business-quotes sender/recipient terms. All result pages were
exhausted; no later populated submission notification was found. This is a
bounded mailbox finding, not proof that no submission reached a provider or
another destination.

The populated September 30 14:12:43 UTC Formspree receipt was reread. It
predates both the PR update and these alerts, so it is earlier corroborating
evidence, not a subsequent successful submission. Its successful populated
route remains the separately verified September 30 finding above; it does
not close current-release fully phone-only delivery or manual-follow-up gaps.

### Repository decision and remaining check

Fresh remote inspection found PR #8 still draft/unmerged at
`3fdced19bc5991e8ea73e19a63d10eaf5bfbdfc3`, with base/main at
`613aab8533ad4c7ab106b40fb9d5bc50a6d32182`, before this documentation
update. Its only existing changes were this record and the adapter test file.
The current shared controller still validates phone, snapshots FormData
before disabling controls, and sends that snapshot once to each configured
destination. No runtime defect or regression was demonstrated.

The assessment therefore remains unchanged: preserve the current website
behavior and investigate source identity/parsing separately. These emails
alone do not justify a transport change, mandatory contact fields, retry,
alert suppression or pricing change. Catch Hook's parsed empty object is
not the original HTTP request.

Live run-history inspection in this follow-up stopped at sign-in pending
account confirmation. Source-run deduplication remains unresolved. Once
authorized access is restored, match each email ID against saved Gmail-step
outputs and compare trigger/run IDs and timestamps; inspect later existing
runs for populated fields. Do not test, replay or edit the Zap.

This follow-up updates evidence only. Earlier test results above remain
dated results; no new local test pass, live Zap version check, production
deployment or fresh served-byte verification is claimed.

## Completed authenticated follow-up — October 2, 00:35 UTC

After the owner confirmed the Magnolia account, authenticated read-only
inspection matched **each of the three Gmail message IDs to a different Zap
run's saved step 12 output**. The simultaneous emails therefore came from
two separate Zap executions, each producing its own email. They were not
two sends from one Zap run.

| Alert email time, September 30 (UTC) | Catch Hook execution time (UTC) | Verified trace |
|---|---|---|
| 22:10:30, first message | 22:10:23 | Separate v6 run; empty trigger output; `empty_webhook`; fallback; matching Gmail output |
| 22:10:30, second message | 22:10:23 | Different v6 run; empty trigger output; `empty_webhook`; fallback; matching Gmail output |
| 23:01:15 | 23:00:52 | Third v6 run; empty trigger output; `empty_webhook`; fallback; matching Gmail output |

All three Code inputs contain exactly `{"querystring": {}}`; their outputs
have `intake_ready=no` and `submission_state=empty_webhook`. Each history
entry reports two tasks; path B ran and automatic-intake path A did not.
Private run/message identifiers and direct evidence links are retained in
the existing private intake record, not this public repository.

Two executions can still be upstream duplicates of the same original
request. The inspected parsed trigger data does not expose an original
request/event identifier, HTTP method, headers, sender or unparsed body.
Thus the single-run duplicate-email question is resolved, while upstream
request deduplication and the cause of the empty requests remain unknown.
Trigger timestamps come from the editor's explicit America/New_York
GMT-04:00 display. The legacy history table misleadingly labels the same
clock values UTC; that label was not used for conversion.

The enabled published Zap remains v6, "Website payload classification and
accurate alerts." Its existing unpublished draft was left untouched.
Refreshed all-status Last 30 days history showed 18 runs on one page, with
both pagination directions disabled and the 23:00:52 UTC run newest. No
subsequent run, including a populated one, was visible through this
inspection. Connected Gmail searches through October 2, 00:31 UTC likewise
found no later intake notification. These are bounded observations of this
Zap and mailbox, not proof of no provider submissions elsewhere.

The latest populated notification in this evidence remains September 30
14:12:43 UTC, before the PR update and all three evening alerts. Its
previously verified successful route does not establish post-alert recovery
or fully phone-only current-release delivery.

The later run confirms recurrence under the same v6 logic and does not
change the evidence-only assessment. No website runtime defect was
established. Remote main remains
`613aab8533ad4c7ab106b40fb9d5bc50a6d32182`; PR #8 was still open/draft at
`af5c26e8aea26ffd7cee0bf1ad0122200d641ad9` before this follow-up.
No code fix, suppression, pricing change, runtime behavior change, replay,
test event, Zap edit or production publication was made. Local test suites
were not rerun for this documentation-only update.
