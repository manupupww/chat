const CACHE_NAME = 'salonas-v3';
const ASSETS = [
  './',
  './index.html',
  './app.html',
  './booking-extension.js',
  './manifest-app.json',
  './icon-192.png',
  './icon-512.png'
];

// Install – cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate – clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch – network first, fallback to cache
self.addEventListener('fetch', e => {
  if (e.request.url.includes('voiceflow.com')) return;
  if (e.request.url.includes('googleapis.com')) return;
  
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
