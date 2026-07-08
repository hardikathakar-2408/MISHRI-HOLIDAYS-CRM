const { CORS, store, requireAuth } = require('./_shared');

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (!requireAuth(event)) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'unauthorized' }) };
  try {
    const booking = JSON.parse(event.body || '{}');
    const s = store(event);
    const list = (await s.get('bookings', { type: 'json' })) || [];
    const idx = list.findIndex(function (b) { return b.quotNo === booking.quotNo; });
    if (idx >= 0) list[idx] = booking; else list.unshift(booking);
    await s.setJSON('bookings', list);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
