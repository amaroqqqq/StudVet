const CACHE_NAME = 'vet-atlas-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/style.css',
  '/src/data/animals.json',
  '/manifest.json'
  // Добавьте сюда пути к вашим 3D моделям, когда они будут готовы
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Возвращаем кэшированную версию или делаем запрос
        return response || fetch(event.request);
      }
    )
  );
});