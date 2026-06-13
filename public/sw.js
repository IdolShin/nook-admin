const CACHE = 'nook-v2';
const OFFLINE_URL = '/offline';

const PRECACHE = [
  '/',
  '/offline',
  '/dashboard',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((cached) => {
          if (cached) return cached;
          if (e.request.headers.get('accept')?.includes('text/html')) {
            return caches.match(OFFLINE_URL);
          }
        })
      )
  );
});

// ─── Web Push: show the notification with title + body directly ──
// The backend (web-push) sends a JSON payload { title, body, icon, badge, tag }.
// We display it as a normal OS notification so the message text shows on the
// lock screen immediately — no need to open any app to read it.
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (_) {
    data = { title: 'Nook', body: e.data ? e.data.text() : '' };
  }
  const title = data.title || 'Nook';
  const options = {
    body:    data.body || '',
    icon:    data.icon || '/icons/icon-192.png',
    badge:   data.badge || '/icons/icon-192.png',
    tag:     data.tag || 'nook-msg',
    renotify: data.renotify !== false,
    data:    { url: data.url || '/' },
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Tapping the notification focuses an open tab or opens the app
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
