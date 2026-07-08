const { CORS, store, requireAuth } = require('./_shared');

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (!requireAuth(event)) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'unauthorized' }) };
  try {
    const s = store(event);
    const list = (await s.get('hotels', { type: 'json' })) || [];
    return { statusCode: 200, headers: CORS, body: JSON.stringify(list) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
