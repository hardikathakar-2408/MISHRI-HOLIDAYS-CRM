/* Mishri CRM service worker — NETWORK-FIRST.
   Online  : always loads the newest deployed index.html (so a new deploy shows up
             on the next open, no stale cached copy).
   Offline : falls back to the last copy it saved, so the app still opens.
   Does not touch localStorage / IndexedDB — bookings are never affected.        */
const CACHE = 'mishri-crm-2026-10-05-r1';
const CORE = ['./', 'index.html', 'manifest.json'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); }));
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // CDN / desktop-server calls: untouched
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || caches.match('index.html') || caches.match('./'); });
    })
  );
});
