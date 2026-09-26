// ─── Service worker — installable app shell, never caches member data ────────
// Strategy: cache-first for the static shell (so the app opens instantly and
// works on a flaky connection), but /api/* is ALWAYS network-only and never
// stored. A matrimonial platform must not leave profiles or messages in a
// shared-device cache.
const SHELL = 'shiarishta-shell-v1';
const SHELL_FILES = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never touch API traffic, never touch other origins, never cache non-GET.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  // Navigations: network first, fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((r) => r || Response.error())),
    );
    return;
  }

  // Hashed build assets are immutable — serve from cache, fill cache on miss.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((res) => {
      if (res.ok && (url.pathname.startsWith('/assets/') || SHELL_FILES.includes(url.pathname))) {
        const copy = res.clone();
        caches.open(SHELL).then((cache) => cache.put(request, copy));
      }
      return res;
    })),
  );
});
