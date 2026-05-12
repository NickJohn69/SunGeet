const CACHE_NAME = 'sungeet-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // We handle specific offline functionality in the app itself via IndexedDB.
  // This minimal fetch listener is mainly to satisfy PWA install requirements.
});
