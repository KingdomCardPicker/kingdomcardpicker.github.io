var CACHE_NAME = 'kingdom-cache-v1';
var urlsToCache = [
    '/',
    '/index.html',
    '/css/main.css',
    '/scripts/kingdom.min.js',
    // Fonts
    '/fonts/Font-Headings.tff',
    '/fonts/Font-Main.tff',
    '/fonts/Font-Subheadings.tff',
    '/fonts/MaterialIcons-Regular.tff',
    // Images
    '/img/victory.svg'
];

self.addEventListener('install', function (event) {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', function (event) {
    console.log(event.request.url);
    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});

/*self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    if (urlsToCache.indexOf(cacheName) == -1) {
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
});*/