# PR #5 regression reconciliation

Reviewed October 7, 2026 against `main` at `613aab8533ad4c7ab106b40fb9d5bc50a6d32182` and the original PR #5 head `dd6e38c4d95a81bf3358b27733d7b82484f16ff6`.

The original test fails on the complete current checkout with `Missing or changed postWithDeadline function`. PR #6 replaced the inline estimator with the quick-request adapter and shared form controller. Restoring the obsolete functions, checkmark, wizard screen or repeat-attempt reset would test the wrong behavior.

Keep PR #5 as an updated, unmerged draft: useful gaps remain. Merge current main into its existing branch without rewriting history, remove the obsolete test and excerpt-based README, and put the applicable assertions in the two suites already run by `scripts/check.cjs` and `npm test`. No new test runner is needed.

## All 12 original cases

`core` below means `scripts/test-form-core.cjs`; `adapter` means `scripts/test-quick-request.cjs`. Both execute the full current modules in isolated JSDOM windows with mocked transport.

| # | Original case | Coverage on current main | Reconciliation in this draft |
|---|---|---|---|
| 1 | HTTP acceptance and cleared deadline | Core and adapter cover acceptance, one conversion and no repeat submission. | Add manual-clock deadline cancellation assertions after acceptance. |
| 2 | HTTP rejection remains rejection | Core and adapter already distinguish rejection and emit no acceptance. | Add deadline cancellation after rejection; reuse existing outcome tests. |
| 3 | Network rejection clears deadline without retry | Core and adapter already cover network failure and terminal no-retry behavior. | Add deadline cancellation after rejected fetch. |
| 4 | Synchronous transport failure cleanup | Main's core mock returns rejected promises; adapter fetch is async. Neither tests a synchronous provider throw. | Add a synchronous provider throw, cleanup, restored controls/busy state, failure metric and no resend. |
| 5 | 15-second timeout even if abort is ignored | Adapter has a pending fetch, but accelerates the timer and does not assert abort or timer cleanup. Core's timeout mock cooperates with abort. | Use manual timers through the public core API; assert configured and fallback 15,000 ms, abort, cleanup and terminal failure even with an indefinitely pending fetch. A real watchdog rejects a broken/hanging controller. |
| 6 | Late response cannot reverse timeout | Not directly covered. | Settle mocked fetch with late success or rejection after timeout; assert state, result callback, busy transitions and telemetry remain unchanged, with no resend. |
| 7 | Request options/body preserved without mutating caller | Core already checks a single shared payload snapshot and field preservation. The old generic options parameter no longer exists. | Strengthen the existing payload case with provider POST, FormData, Accept header, abort signal and browser-owned multipart Content-Type assertions. Retire the obsolete caller-options identity/keepalive contract; the existing mirror has its own options. |
| 8 | Unknown delivery hides success and offers fallback | Adapter already checks uncertain delivery, masked recovery, no conversion and terminal state. The old checkmark is gone. | Extend existing estimator failure cases to reject a success heading and verify uncertainty copy plus visible native text/call fallbacks. |
| 9 | Acceptance does not promise booking or automatic SMS | Adapter already asserts that the request was sent; forbidden promises are not explicitly checked. | Extend its accepted result assertions to keep texting optional and reject saved/confirmed/booked, automatic-SMS and Jobber claims. Do not restore the old visit wording. |
| 10 | Initial markup has no unearned success indicator | No explicit initial result visibility check. | Assert the actual result panel is empty and hidden in static markup, after binding and while transport is pending. |
| 11 | Each submission resets delivery before awaiting | Current controllers are terminal per form; old `leadSent` reset and repeat-attempt flow no longer apply. Existing core tests enforce terminal state. | Retire the reset source pattern. The initial/pending adapter case protects the remaining applicable invariant: no result or acceptance before delivery finishes. |
| 12 | Duplicate/inactive-screen guard | Core and adapter already test in-flight and terminal duplicate suppression. The `q3` wizard screen no longer exists. | Reuse existing behavioral coverage; retire the source-level screen guard. |

## Other work checked

PR #8 at `3181867f7249a1dc94c5a5bb89d5a3e6493ed1b4` separately adds multipart wire-format tests, native fallback repairs and disabled raw-hook diagnostic coverage. Its test changes were inspected; this draft does not copy those cases, alter that branch, enable diagnostics or modify the live Zap. Both drafts edit the same test files and will need the usual integration check when either later merges.

## Verification

- Full current-main baseline: `npm test` passed (deterministic build/publish checks, 51 static checks, 54 pricing combinations, 79 adapter checks and 18 core contracts).
- Updated complete checkout: `npm test` passed (same build/static/pricing checks, 80 adapter checks and 26 core contracts).
- Five deliberately damaged temporary build copies failed the appropriate suite: missing deadline cleanup, missing abort, changed deadline, exposed initial result and a false booking/SMS promise. The repository's production files were not edited for these checks.
- Environment: Node 24.19.0, npm 11.9.0, Python 3.12.14; all 37 locked dependencies installed with `npm ci --ignore-scripts --no-audit --no-fund`. The local npm/Python versions differ from the documented CI pins (12.1.0/3.14); this is not a claim of a new CI run.
- The legacy test and README are deleted. Only the two existing test files and documentation differ from current main. No production HTML, CSS, JS, configuration, endpoints, pricing or customer behavior changes.

These are offline full-source DOM/unit checks. They do not certify physical-device behavior, browser/provider receipt, Jobber creation, SMS delivery, booking or the production deployment. No live lead, webhook, customer message or analytics event is sent by the tests.
