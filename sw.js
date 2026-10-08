const CACHE = 'misnotas-v1';
const ASSETS = [
  '/MISNOTAS/',
  '/MISNOTAS/index.html',
  '/MISNOTAS/manifest.json'
];

// Instalar y cachear recursos locales
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activar y limpiar cachés antiguos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Interceptar solicitudes HTTP
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Bypass de caché para la comprobación de versiones o APIs dinámicas
  if (url.pathname.endsWith('version.json') || url.searchParams.has('t')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Estrategia Cache First con Network Fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, copy));
        return response;
      }).catch(() => {
        // Fallback únicamente si la petición es de navegación de página
        if (e.request.mode === 'navigate') {
          return caches.match('/MISNOTAS/index.html') || caches.match('/MISNOTAS/');
        }
      });
    })
  );
});
