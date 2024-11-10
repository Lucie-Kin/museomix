const CACHE_NAME = 'static-v11';  // Incrémentation du numéro de version

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
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
        '/rsc/bg_bric.jpg'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Nouvelle version activée');
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});