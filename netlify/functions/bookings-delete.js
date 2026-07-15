const { CORS, store, requireAuth, mergeTombstones } = require('./_shared');

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (!requireAuth(event)) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'unauthorized' }) };
  try {
    const body = JSON.parse(event.body || '{}');
    const s = store(event);
    const list = ((await s.get('bookings', { type: 'json' })) || [])
      .filter(function (b) { return b.quotNo !== body.quotNo; });
    await s.setJSON('bookings', list);
    // Record a tombstone for this deletion (see mergeTombstones/_shared.js) —
    // otherwise a different device that is currently offline, and still holds
    // an older copy of this same booking, would simply re-add it back the next
    // time IT syncs, since a plain array removal here has no memory of "this
    // quotNo was deleted" for future merges to check against.
    if (body.quotNo) {
      const tombstones = (await s.get('bookingTombstones', { type: 'json' })) || [];
      const merged = mergeTombstones(tombstones, [{ quotNo: body.quotNo, deletedAt: new Date().toISOString() }]);
      await s.setJSON('bookingTombstones', merged);
    }
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
