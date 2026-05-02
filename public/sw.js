// Minimal service worker — satisfies installability requirement.
// No offline caching: all requests fall through to the network.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Network-only: pass all fetches straight through.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
