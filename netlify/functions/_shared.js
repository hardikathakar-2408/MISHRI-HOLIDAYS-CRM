const { getStore, connectLambda } = require('@netlify/blobs');
const crypto = require('crypto');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

function store(event) {
  connectLambda(event); // required in Lambda-compatibility mode (classic handler signature)
  return getStore('mishricrm');
}

// ---- password protection (data safety) ---------------------------------
// Set APP_PASSWORD and TOKEN_SECRET as Environment Variables in the
// Netlify dashboard (Site settings → Environment variables) — never
// commit real values into the repo. Login exchanges the password for a
// signed, stateless token (HMAC-SHA256, no session DB needed), valid 30
// days, sent back on every call as "Authorization: Bearer <token>".
const APP_PASSWORD = process.env.APP_PASSWORD || '';
const TOKEN_SECRET = process.env.TOKEN_SECRET || '';
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function sign(payloadB64) {
  return b64url(crypto.createHmac('sha256', TOKEN_SECRET).update(payloadB64).digest());
}
function makeToken() {
  const payload = { iat: Date.now(), exp: Date.now() + TOKEN_TTL_MS };
  const payloadB64 = b64url(JSON.stringify(payload));
  return payloadB64 + '.' + sign(payloadB64);
}
function verifyToken(token) {
  if (!token || typeof token !== 'string' || token.indexOf('.') === -1) return false;
  const [payloadB64, sig] = token.split('.');
  const expected = sign(payloadB64);
  const a = Buffer.from(sig || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    return !!(payload.exp && payload.exp > Date.now());
  } catch (e) {
    return false;
  }
}
// Password gateway disabled: all requests are left open.
function requireAuth(event) {
  return true;
}

module.exports = { CORS, store, APP_PASSWORD, makeToken, verifyToken, requireAuth };
