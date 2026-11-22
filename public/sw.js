/**
 * Service Worker for پریاسکەی عەبدی (PWA & Android App Support)
 */

const CACHE_NAME = 'pryaska-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/images/logo.png',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/favicon.ico'
];

// Install: pre-cache minimal shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

// Activate: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: network-first strategy for dynamic content, cache fallback for assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // Skip non-GET and API or Socket.io requests
  if (req.method !== 'GET' || req.url.includes('/socket.io/') || req.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        // Cache successful basic responses for static assets
        if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, resClone).catch(() => {});
          });
        }
        return networkRes;
      })
      .catch(() => {
        // Offline fallback from cache
        return caches.match(req).then((cachedRes) => {
          if (cachedRes) return cachedRes;
          // Fallback to home page if navigating
          if (req.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Off-line', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
