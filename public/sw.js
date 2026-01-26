const CACHE_NAME = 'my-app-cache-v1';
const resourcesToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Installation du Service Worker (tolérant aux erreurs)
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const results = await Promise.allSettled(
      resourcesToCache.map(async (url) => {
        try {
          const response = await fetch(url, { cache: 'no-cache' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          await cache.put(url, response.clone());
          return { url, ok: true };
        } catch (err) {
          console.warn('[sw] Failed to cache', url, err);
          return { url, ok: false, error: String(err) };
        }
      })
    );
    const failed = results
      .filter(r => r.status === 'fulfilled' && r.value && !r.value.ok)
      .map(r => r.value.url)
      .filter(Boolean);
    if (failed.length) {
      console.warn('[sw] Some resources failed to cache:', failed);
    }
    // termine l'installation même si certains fichiers ont échoué
    // @ts-ignore
    await self.skipWaiting();
  })());
});

// Gestion des requêtes réseau (basic cache-first fallback)
self.addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    try {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      return response;
    } catch (err) {
      return new Response('Service Worker fetch error', { status: 503 });
    }
  })());
});

// Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    // @ts-ignore
    await self.clients.claim();
  })());
});
