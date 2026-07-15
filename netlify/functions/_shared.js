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

// ---- delete tombstones (offline-safe deletion) -------------------------
// A tombstone is {quotNo, deletedAt}. Recorded server-side whenever a booking
// is deleted (both the immediate online delete and the background sync path),
// and persisted permanently in the 'bookingTombstones' store key — NOT just
// applied once and discarded — so that ANY other device, even one that syncs
// in much later with an older copy of that same booking, has its stale copy
// suppressed again instead of resurrecting it. Only the newest deletedAt per
// quotNo is kept. A booking whose own updatedAt is AFTER its deletedAt is
// treated as an intentional "un-delete" (an edit made after the deletion) and
// is allowed to survive — same newer-wins rule already used for every other
// merge conflict in this app.
function mergeTombstones(existing, incoming) {
  var map = {};
  (existing || []).forEach(function (t) { if (t && t.quotNo) map[t.quotNo] = t; });
  (incoming || []).forEach(function (t) {
    if (!t || !t.quotNo) return;
    var cur = map[t.quotNo];
    if (!cur || new Date(t.deletedAt || 0) > new Date(cur.deletedAt || 0)) {
      map[t.quotNo] = t;
    }
  });
  return Object.keys(map).map(function (k) { return map[k]; });
}

module.exports = { CORS, store, APP_PASSWORD, makeToken, verifyToken, requireAuth, mergeTombstones };
