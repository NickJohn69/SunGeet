const CACHE_NAME = 'sungeet-pwa-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Pass through audio stream requests (don't cache, just keep connection alive)
  if (url.pathname.startsWith('/api/stream') || url.pathname.startsWith('/api/download')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache static assets
  if (event.request.destination === 'image' || event.request.destination === 'font') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'keepalive') {
    // Keep the service worker active
  }
});
