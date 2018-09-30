let urls = [
  '/',
  'index.html',
  'restaurant.html',
  'img',
  'css/styles.css',
  'js/main.js',
  'js/dbhelper.js',
  'sw.js',
  'manifest.json',
  'js/idb.js',
  'js/restaurant_info.js'
];

//cache the skeleton so the site can be created dynamically offline
for(let i=1; i<=10; i++) {
  urls.push(`restaurant.html?id=${i}`);
  }
  
const staticCacheName = 'mws-restaurants-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      return cache.addAll(urls);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if(response) return response;
      return fetch(event.request);
    })
  );
});