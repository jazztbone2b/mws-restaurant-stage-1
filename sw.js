//Cache the JSON responses for offline use by using the IndexedDB API
importScripts('../idb.js');

const restaurantsURL = 'http://localhost:1337/restaurants';

const dbPromise = idb.open('mws-restaurants', 2, (upgradeDb) => {
  switch(upgradeDb.oldVersion) {
    case 0:
      upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
  }
});

//get the url for the restaurants
fetch(restaurantsURL)
  .then((response) => {
    //return the response as json
    return response.json();
  })
  .then((restaurants) => {
    //put the json into the restaurants store
    dbPromise.then((db) => {
      let tx = db.transaction('restaurants', 'readwrite');
      let keyValStore = tx.objectStore('restaurants');
      restaurants.forEach((restaurant) => {
        keyValStore.put(restaurant);
      });
      return tx.complete;
      }).then(() => {
        console.log('Restaurant info added to idb');
      }).catch((err) => {
        console.log(`Woops... Error status: ${err}`);
      });
    });

//deliver the content from idb cache if network is unavailable
dbPromise.then((db) => {
  let tx = db.transaction('restaurants', 'readonly');
  let restStore = tx.objectStore('restaurants');
  console.log('getting items...');
  return restStore.getAll();
}).then((items) => {
  console.log(items);
}).catch((err) => {
  console.log(`Woops... Error status ${err}`);
});


let urls = [
  '/',
  'index.html',
  'restaurant.html',
  'img',
  'css/styles.css',
  'js/main.js',
  'js/dbhelper.js',
  'js/restaurant_info.js',
  'sw.js',
  'idb.js'
];

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