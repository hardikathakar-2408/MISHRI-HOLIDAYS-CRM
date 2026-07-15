const { CORS, store, requireAuth } = require('./_shared');

// ── HOTEL MASTER SYNC (offline-safe) ─────────────────────────────────────
// Mirrors mergeTombstones() in _shared.js (Bookings) and
// mergeTemplateTombstones() in templates-sync.js (Package/Itinerary
// Templates) — same {id, deletedAt} shape, "newest deletedAt wins" rule —
// but kept as its own function here, not imported/shared, so neither
// Bookings sync logic in _shared.js nor Package/Itinerary Template sync
// logic in templates-sync.js is ever touched by this feature. Keyed by
// hotel `id`.
function mergeHotelTombstones(existing, incoming) {
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

// Mirrors mergeBookings() (bookings-sync.js) and mergeTemplateList()
// (templates-sync.js) — same newer-updatedAt-wins merge and the same
// "edit after delete survives" tombstone-suppression rule — applied to the
// Hotel Master list ({id, updatedAt, name, place, cat, ph, em, stars})
// instead of bookings or templates. Kept as its own function here so
// neither of those two files is imported, modified, or shared by
// reference.
//
// An incoming hotel with no updatedAt yet (saved by an older client, before
// this feature existed) is treated as the oldest possible value: it never
// wrongly wins over a genuinely newer copy of the same id, but if the
// server has no other copy of that id yet it is still kept (existing is
// undefined, so `!existing` is true) — so nobody's pre-existing Hotel
// Master directory is ever lost on the first sync after upgrading.
//
// Merging by `id` (never by array position or by re-adding on every sync)
// is what guarantees no duplicate hotel entries: the same id can only ever
// occupy one slot in the returned list, regardless of how many devices
// uploaded a copy of it.
function mergeHotelList(serverList, incomingList, tombstoneMap) {
  var map = {};
  (serverList || []).forEach(function (h) { if (h && h.id != null) map[h.id] = h; });
  (incomingList || []).forEach(function (h) {
    if (!h || h.id == null) return;
    var existing = map[h.id];
    if (!existing || new Date(h.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
      map[h.id] = h;
    }
  });
  // Apply delete tombstones AFTER the newer-wins merge above, exactly like
  // mergeBookings()/mergeTemplateList() do — a hotel survives only if it was
  // edited AFTER its own deletion (updatedAt > deletedAt), the same
  // "edit-after-delete wins" rule used everywhere else in this app. This is
  // what lets an offline "Remove hotel" reach every other device instead of
  // being silently resurrected by a later merge.
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

    const serverHotels = (await s.get('hotels', { type: 'json' })) || [];
    // Backward compatible: an older client that never sends "tombstones" is
    // treated as sending an empty list — merge behaves exactly as before.
    const serverTombstones = (await s.get('hotelTombstones', { type: 'json' })) || [];
    const mergedTombstones = mergeHotelTombstones(serverTombstones, body.tombstones || []);
    const tombstoneMap = {};
    mergedTombstones.forEach(function (t) { tombstoneMap[t.id] = t; });

    const merged = mergeHotelList(serverHotels, body.hotels || [], tombstoneMap);

    // Persisted under the SAME 'hotels' store key already used by
    // hotels.js (GET) and hotels-save.js (legacy overwrite-save) — so both
    // of those existing endpoints keep working exactly as before and stay
    // fully compatible with this new merge-based sync path.
    await s.setJSON('hotels', merged);
    await s.setJSON('hotelTombstones', mergedTombstones);

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, hotels: merged }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
