const { CORS, store, requireAuth } = require('./_shared');

// Mirrors mergeTombstones() in _shared.js (used for Bookings), but keyed by
// template `id` instead of `quotNo`. Kept as its own function here — rather
// than importing/modifying the Bookings one — so Bookings sync logic in
// _shared.js is never touched by this feature.
function mergeTemplateTombstones(existing, incoming) {
  var map = {};
  (existing || []).forEach(function (t) { if (t && t.id != null) map[t.id] = t; });
  (incoming || []).forEach(function (t) {
    if (!t || t.id == null) return;
    var cur = map[t.id];
    if (!cur || new Date(t.deletedAt || 0) > new Date(cur.deletedAt || 0)) {
      map[t.id] = t;
    }
  });
  return Object.keys(map).map(function (k) { return map[k]; });
}

// Mirrors mergeBookings() in bookings-sync.js — same newer-updatedAt-wins
// merge algorithm and the same tombstone-suppression rule, applied to a
// generic list of {id, updatedAt, ...} template items instead of
// {quotNo, updatedAt} bookings. Kept as its own function here (not
// imported/shared) so bookings-sync.js itself is never touched.
function mergeTemplateList(serverList, incomingList, tombstoneMap) {
  var map = {};
  (serverList || []).forEach(function (t) { if (t && t.id != null) map[t.id] = t; });
  (incomingList || []).forEach(function (t) {
    if (!t || t.id == null) return;
    var existing = map[t.id];
    // Backward compatible: an item with no updatedAt yet (created before
    // this feature existed) is treated as the oldest possible value, so it
    // never wins against a genuinely newer copy of the same id — but if no
    // other copy of that id exists yet on the server, it is still added
    // (existing is undefined, so `!existing` is true). This is what
    // guarantees existing users never lose a pre-existing template on their
    // first sync.
    if (!existing || new Date(t.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
      map[t.id] = t;
    }
  });
  // Apply delete tombstones AFTER the newer-wins merge above, exactly like
  // mergeBookings() does — a template survives only if it was edited AFTER
  // its own deletion (updatedAt > deletedAt), the same "edit after delete
  // wins" rule used everywhere else in this app.
  Object.keys(tombstoneMap || {}).forEach(function (id) {
    var tomb = tombstoneMap[id];
    var existing = map[id];
    if (existing && new Date(existing.updatedAt || 0) <= new Date(tomb.deletedAt || 0)) {
      delete map[id];
    }
  });
  return Object.keys(map).map(function (k) { return map[k]; });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (!requireAuth(event)) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'unauthorized' }) };
  try {
    const body = JSON.parse(event.body || '{}');
    const s = store(event);

    const serverPkg = (await s.get('pkgTemplates', { type: 'json' })) || [];
    const serverItin = (await s.get('itinTemplates', { type: 'json' })) || [];
    const serverPkgTomb = (await s.get('pkgTemplateTombstones', { type: 'json' })) || [];
    const serverItinTomb = (await s.get('itinTemplateTombstones', { type: 'json' })) || [];

    const mergedPkgTomb = mergeTemplateTombstones(serverPkgTomb, body.pkgTombstones || []);
    const mergedItinTomb = mergeTemplateTombstones(serverItinTomb, body.itinTombstones || []);
    const pkgTombMap = {}; mergedPkgTomb.forEach(function (t) { pkgTombMap[t.id] = t; });
    const itinTombMap = {}; mergedItinTomb.forEach(function (t) { itinTombMap[t.id] = t; });

    const mergedPkg = mergeTemplateList(serverPkg, body.pkgTemplates || [], pkgTombMap);
    const mergedItin = mergeTemplateList(serverItin, body.itinTemplates || [], itinTombMap);

    await s.setJSON('pkgTemplates', mergedPkg);
    await s.setJSON('itinTemplates', mergedItin);
    await s.setJSON('pkgTemplateTombstones', mergedPkgTomb);
    await s.setJSON('itinTemplateTombstones', mergedItinTomb);

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ ok: true, pkgTemplates: mergedPkg, itinTemplates: mergedItin })
    };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
