const CACHE_NAME = 'static-v3';  // Increment version number

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/index.html',
        '/styles.css',
        '/app.js',
        '/manifest.json',
        '/rsc/logo.png',
        '/rsc/ciac_logo.svg',
        '/rsc/ciac_logo-01.png',
        '/rsc/ciac_logo-02.png',
        '/rsc/send_btn.png',
        '/rsc/art1.jpg',
        '/rsc/art2.jpg',
        '/rsc/art3.jpg',
        '/rsc/bg_bric.jpg'  // Added new background image
      ]);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            // Delete old cache versions
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Immediately claim any clients
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Always try the network first
      return fetch(event.request)
        .then(networkResponse => {
          // Update the cache with the new version
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(() => {
          // If network fails, use cached version
          return response;
        });
    })
  );
});