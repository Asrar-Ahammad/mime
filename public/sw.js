self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A simple fetch handler to satisfy the PWA installability criteria
  event.respondWith(fetch(event.request).catch(() => new Response('Offline')));
});
