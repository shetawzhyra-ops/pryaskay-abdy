/**
 * Service Worker for پریاسکەی عەبدی (PWA, Offline Fallback & Background Push Notifications)
 */

const CACHE_NAME = 'pryaska-cache-v7';
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/privacy.html',
  '/terms.html',
  '/manifest.json',
  '/css/tailwind.built.css',
  '/css/style.css',
  '/css/landing-heritage-test.css',
  '/css/app-heritage.css',
  '/css/app-dark-theme.css',
  '/css/dreams-heritage.css',
  '/exams.html',
  '/css/exams.css',
  '/js/exams.js',
  '/js/compliance.js',
  '/js/global-search.js',
  '/js/post-comments.js',
  '/images/logo.jpg?v=1796050000',
  '/images/pryaska_icon.png?v=6',
  '/images/avatar_male.svg?v=3.0',
  '/images/avatar_female.svg?v=3.0',
  '/images/icon-192.png?v=6',
  '/images/icon-512.png?v=6',
  '/favicon.png?v=6'
];

// Install: pre-cache app shell + offline folio
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(STATIC_ASSETS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up stale cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Background Web Push Notifications (VAPID)
self.addEventListener('push', (event) => {
  let payload = {
    title: 'پریاسکەی عەبدی',
    body: 'ئاگادارییەکی نوێت بۆ هاتووە',
    icon: '/images/logo.jpg?v=1796050000',
    badge: '/favicon.png?v=6',
    tag: 'pryaska-notif',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch (e) {
      payload.body = event.data.text() || payload.body;
    }
  }

  const options = {
    body: payload.body || '',
    icon: payload.icon || '/images/logo.jpg?v=1796050000',
    badge: payload.badge || '/favicon.png?v=6',
    tag: payload.tag || 'pryaska-notif',
    dir: 'rtl',
    lang: 'ckb',
    renotify: true,
    vibrate: [140, 60, 140],
    data: payload.data || { url: '/' }
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'پریاسکەی عەبدی', options)
  );
});

// Clicking a notification focuses or opens the exact target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (targetUrl && targetUrl !== '/' && 'navigate' in client) {
            return client.navigate(targetUrl).catch(() => client);
          }
          return client;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Fetch: network-first for dynamic pages & assets, offline.html fallback for navigations
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Skip non-GET, API calls, Socket.IO, and Range media requests
  if (
    req.method !== 'GET' ||
    req.headers.has('range') ||
    req.url.includes('/socket.io/') ||
    req.url.includes('/api/')
  ) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, resClone).catch(() => {});
          });
        }
        return networkRes;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === 'navigate') {
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) return offlinePage;
          const home = await caches.match('/');
          if (home) return home;
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});
