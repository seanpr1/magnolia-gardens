/* Complete local Field Quote backups. No network or automatic overwrite. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MG_QUOTE_BACKUP = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SCHEMA = 'mgls-backup-2';
  const MAX_BYTES = 100 * 1024 * 1024;
  const PRICE_KEYS = ['stop', 'perMin', 'min', 'markup', 'buffer', 'freqWeekly', 'freqBiweekly', 'freqOnetime'];
  const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif']);
  const fail = message => { throw new Error(message); };
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const id = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(value);
  const timestamp = value => Number.isFinite(value) && value >= 0 && value <= 8640000000000000;
  const clone = value => JSON.parse(JSON.stringify(value));
  function text(value, label, optional = false) {
    if (optional && value === undefined) return;
    if (typeof value !== 'string' || value.length > 100000) fail('Invalid ' + label + '.');
  }
  function numeric(value, label) {
    if (!(typeof value === 'number' || typeof value === 'string') || !Number.isFinite(Number(value))) fail('Invalid ' + label + '.');
  }
  function pricingSnapshot(settings) {
    if (!object(settings)) fail('Missing backup pricing settings.');
    const result = {};
    for (const key of PRICE_KEYS) {
      if (typeof settings[key] !== 'number' || !Number.isFinite(settings[key]) || settings[key] < 0) fail('Invalid pricing setting: ' + key + '.');
      result[key] = settings[key];
    }
    if (!Number.isInteger(settings.pricingRev) || settings.pricingRev < 1) fail('Invalid pricing revision.');
    result.pricingRev = settings.pricingRev;
    return result;
  }
  function validateQuotes(quotes) {
    if (!Array.isArray(quotes) || quotes.length > 5000) fail('Invalid quote collection.');
    const quoteIds = new Set(), photoOwners = new Map();
    for (const q of quotes) {
      if (!object(q) || !id(q.id) || quoteIds.has(q.id)) fail('Invalid or duplicate quote ID.');
      quoteIds.add(q.id);
      if (!timestamp(q.created) || (q.updated !== undefined && !timestamp(q.updated))) fail('Invalid quote date.');
      if (!['draft', 'sent'].includes(q.status)) fail('Invalid quote status.');
      if (q.frequency !== undefined && !['weekly', 'biweekly', 'onetime'].includes(q.frequency)) fail('Invalid visit frequency.');
      if (!object(q.cust)) fail('Missing customer fields.');
      for (const field of ['name', 'addr', 'phone']) text(q.cust[field], 'customer ' + field);
      text(q.notes, 'quote notes', true);
      pricingSnapshot(q.pricingSnapshot);
      if (!Array.isArray(q.items) || q.items.length > 1000) fail('Invalid service collection.');
      const itemIds = new Set();
      for (const it of q.items) {
        if (!object(it) || !id(it.id) || itemIds.has(it.id)) fail('Invalid or duplicate service ID.');
        itemIds.add(it.id);
        text(it.service, 'service');
        text(it.inotes, 'service notes', true);
        if (!['time', 'manual', 'material'].includes(it.mode)) fail('Invalid pricing method.');
        if (it.minutes !== undefined) numeric(it.minutes, 'minutes');
        if (it.amount !== undefined) numeric(it.amount, 'amount');
        if (it.photos !== undefined && !Array.isArray(it.photos)) fail('Invalid photo references.');
        if ((it.photos || []).length > 1000) fail('Too many photos on one service.');
        for (const pid of it.photos || []) {
          if (!id(pid) || photoOwners.has(pid)) fail('Invalid or duplicate photo reference.');
          photoOwners.set(pid, q.id);
        }
      }
    }
    return photoOwners;
  }
  function validateEnvelope(value) {
    if (!object(value) || value.schema !== SCHEMA) {
      if (value && value.schema === 'mgls-quotes-1') fail('This older quotes-only export has no photo bytes or saved pricing. Restore requires a new complete backup made on the original device.');
      fail('This is not a supported Magnolia Field Quote backup.');
    }
    if (typeof value.exported !== 'string' || !Number.isFinite(Date.parse(value.exported))) fail('Invalid backup date.');
    pricingSnapshot(value.settings);
    const owners = validateQuotes(value.quotes);
    if (!Array.isArray(value.photos) || value.photos.length > 20000 || value.photos.length !== owners.size) fail('Backup is missing photos or contains extra photos.');
    if (value.quoteCount !== value.quotes.length || value.photoCount !== value.photos.length) fail('Backup counts do not match its contents.');
    return owners;
  }
  function validatePhotoMetadata(photo, owners, seen) {
    if (!object(photo) || !id(photo.id) || seen.has(photo.id)) fail('Invalid or duplicate photo ID.');
    seen.add(photo.id);
    if (owners.get(photo.id) !== photo.quoteId) fail('A photo is missing or attached to the wrong quote.');
    if (!IMAGE_TYPES.has(photo.type)) fail('Unsupported photo format.');
    if (!Number.isSafeInteger(photo.size) || photo.size < 1 || photo.size > MAX_BYTES) fail('Invalid photo size.');
  }
  function encode(bytes) {
    let value = '';
    for (let i = 0; i < bytes.length; i += 32768) value += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
    return btoa(value);
  }
  function decode(value) {
    if (typeof value !== 'string' || value.length > MAX_BYTES * 1.4 || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) fail('Invalid photo encoding.');
    let binary;
    try { binary = atob(value); } catch (_) { fail('Invalid photo encoding.'); }
    const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
    if (encode(bytes) !== value) fail('Invalid photo encoding.');
    return bytes;
  }
  async function digest(bytes) {
    if (!globalThis.crypto || !globalThis.crypto.subtle) fail('Photo verification is unavailable. Open Field Quote over HTTPS or localhost.');
    return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  function readSnapshot(db) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['quotes', 'photos'], 'readonly');
      const quotes = transaction.objectStore('quotes').getAll();
      const photos = transaction.objectStore('photos').getAll();
      transaction.oncomplete = () => resolve({quotes: quotes.result, photos: photos.result});
      transaction.onabort = () => reject(transaction.error || new Error('Could not read saved quotes and photos.'));
      transaction.onerror = () => {};
    });
  }
  async function createBackup(snapshot, settings, now = new Date()) {
    const savedPricing = pricingSnapshot(settings);
    const quotes = snapshot.quotes.map(original => {
      const q = clone(original);
      q.items.forEach(it => { delete it._thumbs; });
      q.pricingSnapshot = pricingSnapshot(q.pricingSnapshot || savedPricing);
      return q;
    });
    const owners = validateQuotes(quotes);
    const photosById = new Map(snapshot.photos.map(photo => [photo.id, photo]));
    const photos = [];
    let totalBytes = 0;
    for (const [pid, quoteId] of owners) {
      const photo = photosById.get(pid);
      if (!photo || photo.quoteId !== quoteId || !(photo.blob instanceof Blob)) fail('A saved photo is missing. No complete backup was created; existing data was not changed.');
      const type = photo.blob.type;
      const size = photo.blob.size;
      validatePhotoMetadata({id: pid, quoteId, type, size}, owners, new Set());
      totalBytes += size;
      if (totalBytes * 4 / 3 > MAX_BYTES) fail('Backup exceeds the 100 MB file limit. Existing data was not changed.');
      const bytes = new Uint8Array(await photo.blob.arrayBuffer());
      photos.push({id: pid, quoteId, type, size, sha256: await digest(bytes), data: encode(bytes)});
    }
    const payload = {schema: SCHEMA, exported: now.toISOString(), settings: clone(settings), quoteCount: quotes.length, photoCount: photos.length, quotes, photos};
    const serialized = JSON.stringify(payload);
    if (new Blob([serialized]).size > MAX_BYTES) fail('Backup exceeds the 100 MB file limit. Existing data was not changed.');
    return serialized;
  }
  async function readBackup(serialized) {
    if (typeof serialized !== 'string' || new Blob([serialized]).size > MAX_BYTES) fail('Choose a complete backup file no larger than 100 MB.');
    let payload;
    try { payload = JSON.parse(serialized); } catch (_) { fail('The backup file is not valid JSON. Nothing was restored.'); }
    const owners = validateEnvelope(payload), seen = new Set(), photos = [];
    let totalBytes = 0;
    for (const photo of payload.photos) {
      validatePhotoMetadata(photo, owners, seen);
      totalBytes += photo.size;
      if (totalBytes > MAX_BYTES) fail('Photo collection is too large.');
      if (typeof photo.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(photo.sha256)) fail('Missing photo integrity check.');
      const bytes = decode(photo.data);
      if (bytes.length !== photo.size || await digest(bytes) !== photo.sha256) fail('A photo is damaged or incomplete. Nothing was restored.');
      photos.push({id: photo.id, quoteId: photo.quoteId, blob: new Blob([bytes], {type: photo.type})});
    }
    return {schema: SCHEMA, exported: payload.exported, settings: payload.settings, quotes: payload.quotes, photos};
  }
  function planRestore(backup, current) {
    const existingQuotes = new Set(current.quotes.map(q => q.id));
    const reservedPhotos = new Set([...current.photos, ...backup.photos].map(p => p.id));
    const storedPhotos = new Set(current.photos.map(p => p.id));
    const photosById = new Map(backup.photos.map(p => [p.id, p]));
    const quotes = [], photos = [], skipped = [];
    let renamedPhotos = 0;
    for (const original of backup.quotes) {
      if (existingQuotes.has(original.id)) { skipped.push(original.id); continue; }
      const q = clone(original);
      q.items.forEach(it => {
        delete it._thumbs;
        if (it.photos) it.photos = it.photos.map(pid => {
          const source = photosById.get(pid);
          if (!source) fail('Backup is missing a photo.');
          let next = pid;
          if (storedPhotos.has(pid)) {
            let suffix = 1;
            do { next = pid.slice(0, 95) + '-restored-' + suffix++; } while (reservedPhotos.has(next));
            renamedPhotos++;
          }
          reservedPhotos.add(next);
          photos.push({id: next, quoteId: q.id, blob: source.blob});
          return next;
        });
      });
      quotes.push(q);
    }
    return {quotes, photos, skipped, renamedPhotos};
  }
  async function previewRestore(db, backup) {
    return planRestore(backup, await readSnapshot(db));
  }
  function restoreBackup(db, backup) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['quotes', 'photos'], 'readwrite');
      const quotesStore = transaction.objectStore('quotes'), photosStore = transaction.objectStore('photos');
      const quotesRequest = quotesStore.getAll(), photosRequest = photosStore.getAll();
      let pending = 2, plan, problem;
      function ready() {
        if (--pending) return;
        try {
          // Recheck conflicts inside the write transaction: another tab may
          // have saved a quote after the user reviewed the preview.
          plan = planRestore(backup, {quotes: quotesRequest.result, photos: photosRequest.result});
          for (const photo of plan.photos) photosStore.add(photo);
          for (const quote of plan.quotes) quotesStore.add(quote);
        } catch (error) { problem = error; transaction.abort(); }
      }
      quotesRequest.onsuccess = ready;
      photosRequest.onsuccess = ready;
      transaction.oncomplete = () => resolve({addedQuotes: plan.quotes.length, addedPhotos: plan.photos.length, skippedQuotes: plan.skipped.length, renamedPhotos: plan.renamedPhotos});
      transaction.onabort = () => reject(problem || transaction.error || new Error('Restore could not be saved. No quotes or photos were added.'));
      transaction.onerror = () => {};
    });
  }
  return {SCHEMA, MAX_BYTES, PRICE_KEYS, pricingSnapshot, readSnapshot, createBackup, readBackup, planRestore, previewRestore, restoreBackup};
});
