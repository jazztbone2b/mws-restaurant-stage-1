/*const restaurantsURL = 'http://localhost:1337/restaurants';
const reviewURL = `http://localhost:1337/reviews/`;*/

const dbPromise = idb.open('mws-restaurants', 5, (upgradeDb) => {
  switch(upgradeDb.oldVersion) {
    case 0:
      upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
    case 1:
      const reviewStore = upgradeDb.createObjectStore('reviews', { keyPath: 'id'});
      reviewStore.createIndex('reviewIdStore', 'restaurant_id');
  }
});

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  //change the port to 1337 to get info from the server
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get RESTAURANT_REVIEW_URL() {
    const port = 1337;
    return `http://localhost:${port}/reviews`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback){
    fetch(DBHelper.DATABASE_URL, { method: 'GET'})
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      }).then((restaurants) => {
        callback(null, restaurants);
        dbPromise.then((db) => {
          let tx = db.transaction('restaurants', 'readwrite');
          let keyValStore = tx.objectStore('restaurants');
          restaurants.forEach((restaurant) => {
            keyValStore.put(restaurant);
          });
          return tx.complete;
        }).then(() => {
          console.log('Restaurant info added to idb');
        });
      }).catch((err) => {
        console.log('It appears you are offline... Getting restaurant data from indexedDB...');
        console.log(err);
        
        //get the info from the database
        dbPromise.then((db) => {
          let tx = db.transaction('restaurants', 'readonly');
          let restStore = tx.objectStore('restaurants');
          return restStore.getAll();
        }).then((idbData) => {
          callback(null, idbData);
        });
      }
    );
  }

  /**
   * Fetch all reveiws.
   */
  static fetchReviews(){
    fetch(DBHelper.RESTAURANT_REVIEW_URL, { method: 'GET'})
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    }).then((reviews) => {
      dbPromise.then((db) => {
        let tx = db.transaction('reviews', 'readwrite');
        let keyValStore = tx.objectStore('reviews');
        reviews.forEach((review) => {
          keyValStore.put(review);
        });
        return tx.complete;
      }).then(() => {
        console.log('Reviews added to idb');
      });
    }).catch((err) => {
      console.log('It appears you are offline... Getting review data from indexedDB...');
      console.log(err);
    });
  }

  /**
   * Fetch a review by its ID.
   */
  static fetchReviewById(id, callback) {
    dbPromise.then((db) => {
      let tx = db.transaction('reviews', 'readonly');
      let store = tx.objectStore('reviews');
      let index = store.index('reviewIdStore');
      return index.getAll(id);
      }).then((idbData) => {
        console.log(idbData);
        callback(null, idbData);
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
