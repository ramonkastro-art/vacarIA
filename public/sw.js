const CACHE_NAME = 'vacaria-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora: POST, extensões, APIs externas, chrome-extension
  if (
    event.request.method !== 'GET' ||
    url.protocol === 'chrome-extension:' ||
    url.hostname !== self.location.hostname
  ) {
    return; // deixa o browser lidar normalmente
  }

  // Chamadas de API interna → sempre rede, sem cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Arquivos de jogos e assets → rede primeiro, cache como fallback
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Só cacheia respostas válidas GET do mesmo domínio
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try { cache.put(event.request, clone); } catch(e) {}
          });
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
