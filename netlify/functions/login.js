const { CORS, APP_PASSWORD, makeToken } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  try {
    const body = JSON.parse(event.body || '{}');
    const submitted = (body.password || '').toString();

    if (!APP_PASSWORD) {
      return {
        statusCode: 500,
        headers: CORS,
        body: JSON.stringify({ ok: false, error: 'Server has no password configured yet — set APP_PASSWORD in Netlify environment variables and redeploy.' })
      };
    }
    if (submitted && submitted === APP_PASSWORD) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, token: makeToken() }) };
    }
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: false, error: 'Wrong password' }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
