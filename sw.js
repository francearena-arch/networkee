const CACHE_NAME = 'networkee-v3-cache';
const ASSETS = [
  './', './index.html?v=3.0', './styles.css?v=3.0', './app.js?v=3.0', './manifest.json?v=3.0',
  './networkee-icon.png?v=3.0', './networkee-app-icon-192.png?v=3.0', './networkee-app-icon-512.png?v=3.0', './networkee-apple-touch-icon.png?v=3.0'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
