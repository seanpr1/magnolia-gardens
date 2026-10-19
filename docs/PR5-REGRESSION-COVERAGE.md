# PR #5 regression reconciliation

## Current revalidation — October 19, 2026

Refreshed existing head `63faa2342e6701e0633f41dad6f802ba41a9d310` against main `0f68f0fa921fe4700ad43f5c686a233d3ec90855`. The source patch still affects only the two test suites and two documentation files. The inquiry-disclosure selector change is preserved. All 12 cases below remain applicable; no obsolete estimator or mirror code was restored. Fresh `npm test` passed build/publish checks plus 55 static, 54 pricing, 117 adapter and 26 shared-form checks with zero live requests. The earlier mutation-test evidence below is historical, not rerun or claimed as new. Keep draft and unmerged pending review and release authorization.

## Prior reconciliation — October 18, 2026

Reviewed October 18, 2026 against `main` at `3c4fc9bb57dbde53a62754a6cdc8c117ae78fe76` and the existing PR #5 head `924aec56755d1fdf52aa36ba2a2190ebaaa79ff9`.

## Decision and integration

Keep PR #5 as an updated draft. The October 7 reconciliation already removed the obsolete inline-estimator test and ported its useful assertions to the shared controller and request-page suites. Current main has since shipped native phone/CTA validation, privacy checks and one Formspree submission with server-side routing. It still lacks the deadline, late-settlement and result-state protections retained here.

This update merges current main into the existing PR branch without rewriting history. It resolves conflicts in the two test suites and release record, preserves main's one-request and `submission_id` assertions, and uses the current uncertainty wording for HTTP rejection. The current native-form, privacy, service/area and duplicate-submission tests stay intact. Only two test files and two documentation files differ from current main; no production source or configuration is changed by this draft.

## All 12 original cases

`core` means `scripts/test-form-core.cjs`; `adapter` means `scripts/test-quick-request.cjs`. Both run through `npm test`, executing the complete current modules in isolated JSDOM windows with mocked transport.

| # | Original case | Coverage on current main | Useful protection retained in PR #5 |
|---|---|---|---|
| 1 | HTTP acceptance and cleared deadline | Acceptance, one conversion and terminal no-resend are covered. | Assert that acceptance cancels the one scheduled deadline. |
| 2 | HTTP rejection remains rejection | Core and adapters distinguish rejection and emit no acceptance. | Assert deadline cancellation after HTTP rejection. |
| 3 | Network rejection clears deadline without retry | Network failure and terminal no-retry behavior are covered. | Assert deadline cancellation after rejected fetch. |
| 4 | Synchronous transport failure cleanup | Existing transport mocks reject promises; they do not throw synchronously. | Assert cleanup, restored controls/busy state, failure metric and no resend after a synchronous provider throw. |
| 5 | 15-second timeout even if abort is ignored | Adapter accelerates the timer; core's pending fetch cooperates with abort. Neither asserts deadline cleanup or abort. | Use manual timers through the public core API to assert configured and fallback 15,000 ms, transport abort, cleanup and terminal failure even if fetch stays pending. A real watchdog fails a hanging controller. |
| 6 | Late response cannot reverse timeout | No direct late-settlement case. | Resolve or reject fetch after timeout and assert unchanged state, result, busy transitions and telemetry, with no resend. |
| 7 | Request options/body preserved | Main covers the single provider request, opaque submission reference and payload fields. The old generic caller-options API no longer exists. | Assert provider POST, FormData, Accept header and AbortSignal, with browser-owned multipart Content-Type. Retire the old caller-options identity/keepalive and removed browser-mirror assumptions. |
| 8 | Unknown delivery hides success and offers fallback | Uncertainty, masked recovery, no conversion and terminal state are covered. | Reject a success heading; assert uncertainty wording and visible native text/call destinations. |
| 9 | Acceptance does not promise booking or automatic SMS | Adapter checks that the request was sent. It does not reject unsupported follow-up promises. | Keep texting optional and reject saved/confirmed/booked, automatic-SMS and Jobber claims in the accepted result. |
| 10 | Initial markup has no unearned success indicator | No explicit initial result-visibility assertion. | Assert an empty, hidden result in static markup, after binding and while delivery is pending. |
| 11 | Each submission resets delivery before awaiting | Current controllers are terminal per form; the old repeat-attempt reset does not apply. | Reuse terminal-state coverage and the initial/pending invariant. Retire the old reset source pattern. |
| 12 | Duplicate/inactive-screen guard | Main covers in-flight and terminal duplicate suppression across shared forms. | Reuse those behavioral checks. Retire the removed wizard-screen source guard. |

The current-main tests introduced by PRs #9 and #10 are the integration baseline. PR #8's old raw-hook diagnostics and browser-mirror repair are not dependencies of this test reconciliation; none of that code is imported or enabled.

## Verification — October 18, 2026

- A complete checkout of main `3c4fc9b` passed `npm test`: deterministic build/publish checks, 55 static checks, 54 pricing combinations, 116 adapter checks and 18 shared-form contracts.
- The reconciled complete checkout passed the same command: 55 static checks, 54 pricing combinations, 117 adapter checks and 26 shared-form contracts. Every test used mocked transport; zero live requests were sent.
- Five temporary rendered-source mutations were each tested with both current-main and draft suites. Main passed all five; this draft rejected all five at the intended assertion: missing deadline cleanup, missing transport abort, fallback deadline changed to 16 seconds, exposed initial result and a false booking/automatic-SMS promise. The temporary copies were removed; production files were not edited.
- Locked dependencies were installed with `npm ci --ignore-scripts --no-audit --no-fund`; jsdom is 30.1.1. Runtime: Node 24.19.0, npm 11.9.0 and Python 3.12.14. The local npm/Python versions differ from documented CI pins 12.1.0/3.14. These results are local evidence, not a claim of a new CI or hosted-preview pass.
- `git diff --check` passed. The branch preserves current main as a merge parent and keeps the net diff limited to the two suites, this map and the release record.

These offline checks establish the tested browser contracts. Physical-device behavior, provider receipt, downstream Jobber creation, SMS delivery, booking and the production deployment require separate evidence. This draft update does not perform a production release, live form submission, account change or customer message.

## Earlier draft history

The original September 23 head was `dd6e38c4d95a81bf3358b27733d7b82484f16ff6`. PR #6 removed the inline functions that its excerpt-based test extracted. The October 7 reconciliation against `613aab8533ad4c7ab106b40fb9d5bc50a6d32182` removed that obsolete test and README, producing draft head `924aec56755d1fdf52aa36ba2a2190ebaaa79ff9`. The October 18 results above supersede that earlier draft's baseline and verification counts.
