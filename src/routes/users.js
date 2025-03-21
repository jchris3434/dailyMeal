const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUser, 
  createUser, 
  updateUser, 
  deleteUser
} = require('../controllers/users');

// Middleware d'authentification
const { protect, authorize } = require('../middlewares/auth');

// Toutes les routes nu00e9cessitent une authentification et un ru00f4le d'admin
router.use(protect);
router.use(authorize('admin'));

// Routes principales
router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
