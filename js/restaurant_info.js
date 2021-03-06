let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const favIcon = document.querySelector('.favorite-button');
  favIcon.setAttribute('aria-label', 'button');
  favIcon.setAttribute('role', 'button');
  favIcon.id = `fav-${restaurant.id}`;
  favIcon.innerHTML = '♥';
  favIcon.addEventListener('click', () => {
    DBHelper.toggleFavoriteButton(event, restaurant.id)
  });

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = restaurant.name + ' logo';

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  DBHelper.checkForCachedReviews();
  DBHelper.checkForFavorite(restaurant.id);
  DBHelper.fetchReviewById(self.restaurant.id, (err, reviews) => {
    console.log(reviews);
    self.reviews = reviews;
    fillReviewsHTML();
    console.log('reviews filled');
  });
}

///////////////////////////////////////////////////////
/**
 * Push new review to the database
 */
saveNewReview = (event) => {
  event.preventDefault()
  console.log('saveNewReview');
  const [name, rating, comment] = [document.querySelector('#name-box'), document.querySelector('#rating-box'), document.querySelector('#submit-text-box')];
  
  console.log(comment);
  
  if (comment.value === '' || rating.value === '' || name.value === ''){
    console.log('empty comment');
    console.log(comment.value);
    alert('Please fill in all fields');
    return;
  } else {
    DBHelper.postReview(event, self.restaurant.id, name.value, rating.value, comment.value);
    DBHelper.clearReviewFields(name, rating, comment);
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.tabIndex = '0';
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.tabIndex = '0';
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {

  const container = document.getElementById('reviews-container');
  const title = document.createElement('h4');
  title.tabIndex = '0';
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.tabIndex = '0';
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.tabIndex = '0';
  let timeCreated = new Date(review.createdAt).toLocaleDateString('en-US');
  date.innerHTML = timeCreated;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.tabIndex = '0';
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.tabIndex = '0';
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.tabIndex = '0';
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
