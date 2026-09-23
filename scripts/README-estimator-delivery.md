# Estimator delivery regression checks

Reviewed September 23, 2026.

## Why this change is test-only

The current estimator source at `1c392f6edd8ee24ca8686a28074fcbfc03aae7fb` already distinguishes an accepted form response from unconfirmed delivery, hides the success indicator on failure, bounds the request wait, and explains that a text/visit needs confirmation. An older cached page contained different wording. Do not overwrite the newer implementation to fix the cached version.

This proposal adds no customer-facing code, price, offer, endpoint, tracker or integration change. It does not establish which revision a visitor currently receives from the production cache.

## Run in a complete checkout

With Node.js 22:

```bash
node scripts/test-estimator-delivery.cjs
```

The command reads `estimate/index.html` from the same checkout. It evaluates only the extracted deadline and delivery-status code with a mocked transport and fake timers. No form submission, webhook, email, SMS, analytics event or network request is sent. No files are written. Missing or changed source patterns fail the check rather than silently skipping it.

The 12 checks cover HTTP acceptance/rejection, network and synchronous transport failures, a 15-second timeout even when transport ignores abort, late-response handling, request-option preservation, truthful success/failure rendering, initial unknown-delivery markup, per-attempt status reset and the source-level duplicate-submit guard.

## Verification actually performed

The complete repository could not be downloaded into the execution environment. Relevant source ranges were read through the GitHub connector at the pinned revision above. The tests ran on a temporary local excerpt fixture containing the exact deadline and status-rendering code plus the relevant markup/submit-contract lines; omitted portions were explicitly marked. **12/12 checks passed on those excerpts.** Four deliberately damaged temporary variants (false success, stale status, removed abort and changed deadline) were rejected.

The temporary excerpt fixture is not shipped as a substitute estimator. These results are unit/source-contract evidence, not a fresh complete-checkout, full-form, static-site or browser test pass. Node syntax was also checked. No production delivery was tested.

## Before merging or claiming end-to-end verification

Run this command against the actual complete checkout, then run the existing `python3 scripts/site_check.py`. In an authorized local browser, block or mock all form, webhook, SMS, email and analytics traffic before exercising normal submission, HTTP rejection, offline/timeout, repeat submission, touch/keyboard validation, start-over and the text fallback. Check the deployed asset revision separately without submitting a live lead.

A form-provider HTTP acceptance is not proof that Jobber created a record, a customer received a text, a unique lead was counted, or a visit was booked. A timed-out request might still have reached a server; do not automatically replay it. Existing live automation configuration and test-event restrictions remain unchanged.
