self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A simple fetch handler to satisfy the PWA installability criteria
  // You can implement more advanced caching strategies here (e.g. using Serwist)
});
