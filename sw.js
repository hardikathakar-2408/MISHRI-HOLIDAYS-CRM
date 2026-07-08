// Mishri Holidays CRM — Service Worker
// Purpose: (1) satisfy PWA "installability" so mobile/desktop can install
//          the app icon, (2) cache the app shell so it opens instantly
//          even with a poor connection. API calls always go to the
//          network first (never served stale from cache) so sync stays live.
const CACHE = 'mishricrm-shell-v1';
const SHELL_URL = './';

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll([SHELL_URL]);
    }).catch(function () { /* ignore — app still works without precache */ })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var url = event.request.url;

  // Never cache API calls — always hit the network so sync data is live
  if (url.indexOf('/api/') !== -1) {
    event.respondWith(fetch(event.request).catch(function () {
      return new Response(JSON.stringify({ ok: false, offline: true }), { headers: { 'Content-Type': 'application/json' } });
    }));
    return;
  }

  // App shell: network-first, fall back to cache when offline
  event.respondWith(
    fetch(event.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
      return res;
    }).catch(function () {
      return caches.match(event.request).then(function (cached) {
        return cached || caches.match(SHELL_URL);
      });
    })
  );
});
