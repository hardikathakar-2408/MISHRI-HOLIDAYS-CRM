const { CORS, store, requireAuth } = require('./_shared');

function mergeBookings(serverList, incomingList) {
  var map = {};
  (serverList || []).forEach(function (b) { if (b && b.quotNo) map[b.quotNo] = b; });
  (incomingList || []).forEach(function (b) {
    if (!b || !b.quotNo) return;
    var existing = map[b.quotNo];
    if (!existing || new Date(b.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
      map[b.quotNo] = b;
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
    const merged = mergeBookings(serverList, body.bookings || []);
    await s.setJSON('bookings', merged);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, bookings: merged }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
