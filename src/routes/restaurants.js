const express = require('express');
const router = express.Router();
const { 
  getRestaurants, 
  getRestaurant, 
  createRestaurant, 
  updateRestaurant, 
  deleteRestaurant,
  getRestaurantsInRadius
} = require('../controllers/restaurants');

// Middleware d'authentification
const { protect, authorize } = require('../middlewares/auth');

// Route pour la recherche par rayon
router.route('/radius/:zipcode/:distance')
  .get(getRestaurantsInRadius);

// Routes principales
router.route('/')
  .get(getRestaurants)
  .post(protect, authorize('owner', 'admin'), createRestaurant);

router.route('/:id')
  .get(getRestaurant)
  .put(protect, authorize('owner', 'admin'), updateRestaurant)
  .delete(protect, authorize('owner', 'admin'), deleteRestaurant);

module.exports = router;
