const express = require('express');
const router = express.Router();
const { 
  getDishes, 
  getDish, 
  createDish, 
  updateDish, 
  deleteDish,
  getDishesByRestaurant,
  getAvailableDishes
} = require('../controllers/dishes');

// Middleware d'authentification
const { protect, authorize } = require('../middlewares/auth');

// Route pour les plats disponibles aujourd'hui
router.route('/available')
  .get(getAvailableDishes);

// Route pour les plats par restaurant
router.route('/restaurant/:restaurantId')
  .get(getDishesByRestaurant);

// Routes principales
router.route('/')
  .get(getDishes)
  .post(protect, authorize('owner', 'admin'), createDish);

router.route('/:id')
  .get(getDish)
  .put(protect, authorize('owner', 'admin'), updateDish)
  .delete(protect, authorize('owner', 'admin'), deleteDish);

module.exports = router;
