const { CORS, store, requireAuth, mergeTombstones } = require('./_shared');

function mergeBookings(serverList, incomingList, tombstoneMap) {
  var map = {};
  (serverList || []).forEach(function (b) { if (b && b.quotNo) map[b.quotNo] = b; });
  (incomingList || []).forEach(function (b) {
    if (!b || !b.quotNo) return;
    var existing = map[b.quotNo];
    if (!existing || new Date(b.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
      map[b.quotNo] = b;
    }
  });
  // Apply delete tombstones AFTER the normal newer-wins merge above, so an
  // offline deletion (which never reached bookings-delete.js) is still
  // suppressed here. A booking survives only if it was edited AFTER its own
  // deletion (updatedAt > deletedAt) — the same newer-wins rule as everywhere
  // else, just applied to a delete-vs-edit conflict instead of edit-vs-edit.
  Object.keys(tombstoneMap || {}).forEach(function (qn) {
    var t = tombstoneMap[qn];
    var existing = map[qn];
    if (existing && new Date(existing.updatedAt || 0) <= new Date(t.deletedAt || 0)) {
      delete map[qn];
    }
  });
  return Object.keys(map).map(function (k) { return map[k]; })
    .sort(function (a, b) { return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0); });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (!requireAuth(event)) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'unauthorized' }) };
  try {
    const body = JSON.parse(event.body || '{}');
    const s = store(event);
    const serverList = (await s.get('bookings', { type: 'json' })) || [];
    // Backward compatible: an older client that never sends "tombstones" is
    // treated as sending an empty list — merge behaves exactly as before.
    const serverTombstones = (await s.get('bookingTombstones', { type: 'json' })) || [];
    const mergedTombstones = mergeTombstones(serverTombstones, body.tombstones || []);
    const tombstoneMap = {};
    mergedTombstones.forEach(function (t) { tombstoneMap[t.quotNo] = t; });
    const merged = mergeBookings(serverList, body.bookings || [], tombstoneMap);
    await s.setJSON('bookings', merged);
    await s.setJSON('bookingTombstones', mergedTombstones);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, bookings: merged }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
