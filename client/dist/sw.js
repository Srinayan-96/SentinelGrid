// Kill-switch Service Worker to clear old caches
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map(key => caches.delete(key)));
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Proxy everything to network
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});
