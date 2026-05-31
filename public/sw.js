const CACHE_NAME = 'sungeet-pwa-v2';
const AUDIO_CACHE = 'sungeet-audio-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle audio stream requests from our API
  if (url.pathname.startsWith('/api/stream') || url.pathname.startsWith('/api/download')) {
    event.respondWith(fetch(event.request).then(response => {
      const clone = response.clone();
      caches.open(AUDIO_CACHE).then(cache => {
        cache.put(event.request, clone);
      });
      return response;
    }).catch(() => {
      return caches.match(event.request).then(cached => {
        return cached || new Response('Offline', { status: 503 });
      });
    }));
  }

  // Cache static assets (images, fonts, etc.)
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

// Listen for messages from the client to keep the service worker alive
self.addEventListener('message', (event) => {
  if (event.data === 'keepalive') {
    // Keep the service worker active
  }
});
