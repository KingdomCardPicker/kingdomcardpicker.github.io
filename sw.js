var urlsToCache = [
    './',
    './index.html'
];

importScripts("./app/cache.js");
self.addEventListener('install', function (event) {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            // Read resources
            importScripts("./app/resources.js");
            return cache.addAll(urlsToCache.concat(kingdomResources));
        })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    if (cacheName != CACHE_NAME) {
                        return true;
                    } else {
                        return false;
                    }
                }).map(function (cacheName) {
                    console.log("Cleaned cache: " + cacheName);
                    return caches.delete(cacheName);
                })
            );
        })
    );
});