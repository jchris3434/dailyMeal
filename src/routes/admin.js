const express = require('express');
const router = express.Router();
const { resetDailyDishes } = require('../services/dailyReset');
// Middleware d'authentification commenté pour les tests
// const { protect, authorize } = require('../middlewares/auth');

// @desc    Déclencher manuellement la réinitialisation quotidienne
// @route   POST /api/admin/reset-dishes
// @access  Public (temporairement pour les tests)
router.post('/reset-dishes', async (req, res) => {
  try {
    const result = await resetDailyDishes();
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        modifiedCount: result.modifiedCount
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la réinitialisation des plats'
    });
  }
});

module.exports = router;
