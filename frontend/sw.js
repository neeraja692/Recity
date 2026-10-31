/**
 * sw.js - ReCity Progressive Web App Service Worker
 * Ensures reliable offline capability and fast load times.
 */

const CACHE_NAME = 'recity-v1.1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/frontend/index.html',
  '/frontend/css/style.css',
  '/frontend/css/community.css',
  '/frontend/js/api.js',
  '/frontend/js/app.js',
  '/frontend/js/community.js',
  '/frontend/manifest.json',
  '/frontend/assets/icon.svg',
  '/assets/icon.svg'
];

// 1. Install Event: Cache Core Assets Resiliently
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Use allSettled so one 404 does not fail entire installation
      await Promise.allSettled(
        CORE_ASSETS.map(url =>
          cache.add(url).catch(err => console.debug('Cache pre-fill skipped for:', url))
        )
      );
      return self.skipWaiting();
    })
  );
});

// 2. Activate Event: Clean Stale Caches and Claim Clients Immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Safe Network / Cache Strategy with Offline Fallback
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // API Requests: Network-First with Offline JSON Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response(
          JSON.stringify({ offline: true, message: 'Offline mode active. Data will sync when reconnected.' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Static Assets and Document Navigation: Cache First with Background Update
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Asynchronously update cache in the background
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // If not cached, fetch from network
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(async () => {
        // Fallback for document navigation when offline
        if (event.request.mode === 'navigate') {
          const fallback = (await caches.match('/frontend/index.html')) || (await caches.match('/index.html'));
          if (fallback) return fallback;
        }
        return new Response('Network offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
