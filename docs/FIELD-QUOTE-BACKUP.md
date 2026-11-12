# Field Quote: complete local backup and restore

This feature is an **unpublished draft** on `implementation/field-backup-2026-11-11`. It changes the existing `/quote/` tool, not public pricing or Jobber records. Nothing is uploaded to a server by backup or restore.

## Make and verify a backup

1. On the device/browser that holds the quotes, open Field Quote and return to All quotes.
2. Choose **Back up quotes + photos**. Save the resulting `magnolia-complete-backup-YYYY-MM-DD.json` file to a location accessible from a replacement device.
3. Confirm the actual file exists in the chosen location. A browser download starting is not confirmation that the file was retained. Cancelling a share sheet cancels backup delivery without starting another download.
4. For a recovery check, open the updated Field Quote tool in a separate browser profile or replacement device. Select **Restore from backup**, choose the file, review the counts and confirm. Open a restored quote and its photos. Existing records are preserved if the destination already contains quotes.

The app must first load online on the destination to cache its files. Once loaded, backup and restore work offline in the same browser. Safari, Chrome and a separately installed home-screen app can have separate storage; use the browser/app that actually contains the quotes.

## What the file preserves

The versioned `mgls-backup-2` JSON file contains every saved quote, its service fields, customer details, notes, dates, status and all **attached stored photo bytes**. Stored photos are the field tool's downscaled copies, not the camera originals. Temporary thumbnail URLs and unattached orphan photo records are not part of the backup. A missing referenced photo blocks export instead of producing an apparently complete backup.

Each exported quote also gets a pricing snapshot. Restore uses those saved inputs for the quote's line amounts, visit-frequency multiplier and total in the list, editor, preview and share text. This preserves the amount shown **when the backup was made**, including when the destination has different pricing settings. Re-backing-up an already restored quote retains its original snapshot. Export does not mutate the source quotes or their prices.

The file includes source device settings for reference. Restore does **not** replace destination settings, the service list or the HQ address. New destination quotes continue to use that device's settings. A restored service name remains available in its editor even if it is absent from the destination's service list.

This does not reconstruct an earlier accepted amount that was never stored, turn a sent quote into an accepted contract, or freeze every existing draft on its original device. Jobber remains the work record. Normal edits to a restored quote intentionally change its scope/amount while using its saved pricing inputs.

## Restore validation and conflicts

Restore checks the format and counts, required customer/service fields, safe record IDs, visit frequencies, numeric inputs, pricing snapshots and exact photo ownership. Each photo has a MIME type, byte count and SHA-256 integrity check. All checks finish before the review is offered. An integrity check detects damaged bytes; it is not proof of the file's author.

Quotes already present under the same ID are **skipped in full**, even if the file contains a different version. Their existing photos are also left alone. There is no automatic merge, replacement, newer-wins policy or deletion. To compare another version, restore into a separate browser profile; reconcile deliberately.

If a new quote's photo ID is already used locally, the imported photo gets a new ID and its imported quote reference is updated. The original photo is preserved. Conflicts are rechecked inside the write transaction, so a record created by another tab after review is also protected. New quote and photo writes share one IndexedDB transaction and use `add`, not `put`; success is reported only after commit. An abort rolls back the whole import.

## Limits

- Maximum JSON file size is **100 MB**. Oversized export/import fails without deleting existing data. Large files still depend on available browser memory and storage.
- Old `mgls-quotes-1` exports did not contain photo bytes or pricing inputs and are rejected with a specific explanation. Create a new complete backup on the original device when available. The tool cannot recover bytes that were never exported.
- Photos must use a supported raster MIME type: JPEG, PNG, WebP, GIF, AVIF, HEIC or HEIF. Image display still depends on the destination browser's decoder.
- The file contains customer details and photographs in readable form. Keep it private. Backup itself does not add encryption or cloud synchronization.
- Browser storage can still be cleared or evicted. A successful restore is not an external backup of that device.
- Physical iPhone/Android Files/share-sheet behavior, actual cross-device transfer and storage-pressure behavior are not certified by desktop automation.

## Implementation and checks

`quote/backup.js` owns serialization, validation, the restore plan and atomic storage writes. `quote/index.html` owns the existing UI plus review/confirm controls and quote-scoped pricing selection. `quote/sw.js` caches the backup module under the incremented quote cache version. No runtime dependency was added.

`npm test` includes `scripts/test-field-backup.cjs`: synthetic byte round trips, a megabyte photo, malformed and legacy files, missing/damaged photos, ownership and ID conflicts, no overwrite, repricing protection and rendering contracts. It runs alongside all existing website checks.

An additional actual-browser test uses a temporary Chrome profile with synthetic records and a localhost-only request allowlist:

```sh
npm run build
node scripts/test-field-backup-browser.cjs
```

Set `CHROME_BIN` if Chrome/Chromium is not at the macOS default path. This optional test verifies file-input review/cancel/confirm, real IndexedDB atomic rollback, conflict changes after review, decoded photos, duplicate import, preserved destination settings, share cancellation and offline service-worker reload. It does not exercise native operating-system file pickers or send a live form, email or customer message.
