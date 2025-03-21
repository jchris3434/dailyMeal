const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  updateDetails, 
  updatePassword
} = require('../controllers/users');

// Middleware d'authentification
const { protect } = require('../middlewares/auth');

// Routes publiques
router.post('/register', register);
router.post('/login', login);

// Routes protégées
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
