const urlsToCache = [
    "./",
    "./index.html",
];

importScripts("./app/cache.js");
self.addEventListener("install", (event) => {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Read resources
            importScripts("./app/resources.js");
            return cache.addAll(urlsToCache.concat(kingdomResources));
        }),
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        }),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((cacheName) => {
                    if (cacheName != CACHE_NAME) {
                        return true;
                    } else {
                        return false;
                    }
                }).map((cacheName) => {
                    console.log(`Cleaned cache: ${ cacheName}`);
                    return caches.delete(cacheName);
                }),
            );
        }),
    );
});
