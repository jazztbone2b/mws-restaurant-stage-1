self.addEventListener('install', function(event) {
    event.waitUntil(
      caches.open('mws-restaurant-stage-1').then(function(cache) {
        return cache.addAll([
          '/',
          'index.html',
          'restaurant.html',
          'img',
          'css/styles.css',
          'data/restaurants.json',
          'js/main.js',
          'js/dbhelper.js',
          'js/restaurant_info.js',
        ]);
      })
    );
  });
  self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.match(event.request).then(function(response){
        if(response) return response;
        return fetch(event.request);
      })
    );
  });