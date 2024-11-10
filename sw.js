const CACHE_NAME = 'static-v10';  // Augmentation significative du numéro de version

self.addEventListener('install', event => {
  // Force l'installation immédiate
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
  // Force l'activation
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Force la suppression des anciens caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('New version activated');
    })
  );
  // Force la prise de contrôle immédiate
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    // Toujours essayer le réseau d'abord
    fetch(event.request)
      .then(networkResponse => {
        // Mettre à jour le cache avec la nouvelle version
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      })
      .catch(() => {
        // Si le réseau échoue, utiliser la version en cache
        return caches.match(event.request);
      })
  );
});