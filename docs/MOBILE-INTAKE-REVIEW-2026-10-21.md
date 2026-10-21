# Mobile and intake verification — October 21, 2026

## Scope and release identity

Reviewed merged PRs [#13](https://github.com/seanpr1/magnolia-gardens/pull/13) and [#14](https://github.com/seanpr1/magnolia-gardens/pull/14), their testing limits, current source and production UI. Production `/version.json` returned `ab2ecdc4e0e176c4d06eedf63f18c7fb722f0017`, `production`, `main`, a clean tree and deployment `https://1bad46b6.magnolia-gardens.pages.dev`. This latest commit only records PR #14's release; it does not introduce a further application change.

This review prepares a draft correction. It does not authorize or claim a production release, live form submission, CRM write, message, automation edit or tracking-setting change. Public browsing and PageSpeed audits may generate ordinary page-view analytics; no live submission or call/text conversion was deliberately triggered. Offline tests mock transport and analytics.

## Completed checks

- Fresh locked install and `npm test`: 308 counted checks (61 static, 54 pricing, 117 request/delivery, 20 contact-link, 13 application and 43 shared-form/telemetry contracts), plus deterministic build, failed-build preservation, publish allowlist and revision checks. Runtime: Node 24.19.0, npm 11.9.0 and Python 3.12.14; npm/Python differ from documented pins. Dependencies unchanged.
- Live desktop Chrome at 1363 × 936: home, quick request, cleanup and crew-leader application had no horizontal overflow. Home and quick-request optional details open correctly; phone remains the only required quote field and is `type=tel`.
- Homepage gallery images load on reaching them. Photo enlargement, ArrowRight caption change, Escape and focus restoration work. Lazy images that had not entered the viewport were not misclassified as broken.
- Cleanup navigation reaches the service page. Its quote CTA opens/focuses the on-page request with cleanup context; it intentionally does not navigate away. Its text links retain the cleanup topic.
- Live application deep link selects the working crew-leader role and shows the three experience questions. General crew selection hides and disables leader fields; selecting leader again restores them. Approved pay/schedule wording and the application email alternative are present.
- Offline application tests cover required leader answers, error-summary focus and field links, phone-only/email-only contact, repeated day values, role switching, hidden-answer exclusion, success/double-click protection, rejection, uncertain response, redirect and network failure. Shared quote tests cover validation, deadline/late-response cases, terminal delivery state and throwing analytics. These establish behavior under mocks, not provider receipt or narrow-screen result appearance.

## Current mobile lab evidence

PageSpeed Insights ran Lighthouse 13.5.0 using an emulated Moto G Power and slow 4G. These are single-run lab observations, not physical-phone or real-user performance measurements. No real-user dataset was available.

| Page | Performance | Accessibility (automated only) | LCP | Blocking time | Layout shift |
| --- | ---: | ---: | ---: | ---: | ---: |
| [Home report](https://pagespeed.web.dev/analysis/https-magnoliagardenslandscaping-com/252zp3bx2h?form_factor=mobile) | 60 | 100 | 7.9 s | 300 ms | 0 |
| [Crew-leader report](https://pagespeed.web.dev/analysis/https-magnoliagardenslandscaping-com-apply/s95htdd0r4?form_factor=mobile) | 89 | 100 | 3.0 s | 0 ms | 0.007 |

The two mobile first-viewport screenshots were visually inspected: the homepage menu, text and quote CTA fit, and the application heading and leader description stack cleanly. This does not test an open mobile menu, keyboard, optional fields, full-page overflow, or result states. The quick-request audit returned “Unable to resolve” twice; that route did load and function in the separate live browser. No mobile score is claimed for it.

The homepage report flags render-blocking requests (estimated 1,780 ms saving), unused JavaScript and image delivery. The application flags render-blocking requests (estimated 1,330 ms saving). These estimates are not additive or guaranteed gains. Performance work should preserve script dependencies, form initialization, tracking and no-JavaScript fallback, then compare the exact preview with production before release.

## Confirmed correction prepared

The homepage photo dialog and mobile quote bar are fixed-position siblings directly under `body`. Production computed styles give the dialog `z-index:9000` and the quote bar `z-index:9500`; source CSS shows the bar below 768 px. Thus the mobile quote bar paints above an open modal and remains a pointer target outside it. The draft raises only the dialog to `10000`, keeping the quote bar below it. No layout, form, pricing, tracking or navigation logic changes.

Evidence is the production DOM/computed styles plus the responsive source rule. An interactive narrow-screen before/after reproduction was unavailable because the connected browser has no viewport control. That visual check remains a release gate; do not describe this draft as a verified physical-phone fix.

After the one-rule change, the complete `npm test` suite passed again. An isolated JSDOM check also passed the sibling stacking order, opening, caption navigation, Tab wrap, Escape and focus restoration, without external resources. JSDOM is not a rendering engine; this check does not replace the outstanding narrow-screen visual pass.

## Clarity and current console evidence

The October 20 digest covers October 11–17: 16 sessions, 12.5% dead clicks (2 sessions), 6.25% JavaScript errors (1 session), 6.25% quick backs (1 session), zero rage clicks. It predates both releases. The dashboard required sign-in, so the affected targets, exception and replay remain unknown; no causal connection to the new releases is asserted.

The current homepage Lighthouse report separately records a CORS failure when sending Cloudflare RUM to `https://cloudflareinsights.com/cdn-cgi/rum`, with a failed-resource message. The application audit reports no console-error failure. This is a current measurement-beacon observation, not evidence that customer forms failed, and not proof that it caused the historical Clarity metric. The live browsing logs contained extension-origin metadata errors; those were excluded from website defects. No hosting or analytics settings were changed.

## Delivery paths and evidence limits

| Route | Intended handling | Evidence available now |
| --- | --- | --- |
| Homepage hero/detailed, quick request, service/area requests | Shared code sends once to Formspree `mdajnnjw`; its server webhook feeds the published Zapier intake into Jobber and owner/customer notifications. | Existing October 12 real inquiry matched across Formspree email, Jobber request and acknowledgment. Predates current releases. No new post-release receipt found in the connected inbox/Jobber search. |
| Phone-only customer request | Documented October 18 v4 action matches/creates a client without fabricated email, creates an unscheduled request, and notifies the owner; ambiguous/archived matches go to review. | An archived isolated component-test request with original notes is present. The prior end-to-end owner-review email predates that repair. The complete repaired website → Formspree → Jobber → owner-notice chain remains unverified. |
| Crew-leader/general application | Separate Formspree endpoint `mgaewkjg`; leader payload has distinct role, three answers and subject. Published fallback is `apply@magnoliagardenslandscaping.com`. | Live role behavior and mocked payload/error checks pass. No application receipt found in the connected inbox. Current Formspree recipient/rules/log settings are behind sign-in; the advertised fallback alone does not prove the configured destination. |

The recent Zapier alert inspected was explicitly an intentional isolated test error with no customer action attempted; it is not an active customer-flow failure. No customer/test records were created, replayed, contacted or changed. Customer identities and private record IDs are intentionally excluded from this public repository.

## Remaining gates

1. Complete an interactive mobile viewport pass (320/390 px minimum), including menu, photo viewer, optional details and all accepted/rejected/uncertain result panels with intercepted transport and analytics. Check a physical iPhone and Android for keyboard/autofill, keyboard-open clearance, native call/text handoff without sending, and VoiceOver/TalkBack focus/announcements.
2. Reauthenticate for read-only Formspree inspection of both endpoints, recipients, validation rules, autoresponders, spam/quota and delivery logs; inspect current Zapier history and the Clarity replay when access is available. Secure Formspree sign-in was canceled in this review.
3. If existing records do not close the delivery gaps, obtain approval for explicitly marked, single-use tests only after inspecting downstream effects. Use owner-controlled contact information, check existing client matches first, prevent test advertising conversions through verified controls, capture submission IDs and reconcile provider/mailbox/Jobber results before any retry. Do not invent applicants or email addresses. Preserve and clearly mark test records according to the authorized cleanup plan.
4. Review the one-rule modal correction and its preview before requesting production publication. Mobile performance and the observed Cloudflare RUM error remain separate follow-through items; neither was silently changed.
