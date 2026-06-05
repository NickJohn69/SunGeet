const CACHE_NAME = 'sungeet-pwa-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Clean old caches
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Pass through API requests (stream, search, artist, download, lyrics)
  if (url.pathname.startsWith('/api/')) {
    // For stream requests, fetch with no-cors to support audio playback
    if (url.pathname.startsWith('/api/stream')) {
      event.respondWith(fetch(event.request));
      return;
    }
    // Other API routes - pass through
    return;
  }

  // Pass through Deezer CDN audio requests
  if (url.hostname.includes('dzcdn.net') || url.hostname.includes('deezer.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache images (album art, artist photos)
  if (event.request.destination === 'image' || event.request.destination === 'font') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => cached || new Response('', { status: 404 }));
      })
    );
    return;
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'keepalive') {
    // Keep the service worker active for background audio playback
  }
});
