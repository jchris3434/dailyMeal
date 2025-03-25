/**
 * Service de réinitialisation quotidienne des plats
 * Ce service réinitialise les plats du jour à 1h00 chaque jour
 */
const cron = require('node-cron');
const Dish = require('../models/dish');

/**
 * Réinitialise les plats disponibles de la veille
 * - Met à jour le statut de disponibilité des plats de la veille uniquement
 * - Préserve les plats programmés pour les jours à venir
 */
const resetDailyDishes = async () => {
  try {
    // Date d'aujourd'hui à minuit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Date d'hier à minuit
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Date de demain à minuit
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Marquer tous les plats d'hier comme non disponibles
    // Mais ne touche pas aux plats programmés pour aujourd'hui ou les jours à venir
    const result = await Dish.updateMany(
      {
        availableDate: { $gte: yesterday, $lt: today },
        isAvailable: true
      },
      {
        isAvailable: false
      }
    );
    
    console.log(`[${new Date().toISOString()}] Réinitialisation quotidienne des plats effectuée avec succès. ${result.modifiedCount} plats mis à jour.`);
    return { 
      success: true, 
      message: 'Réinitialisation quotidienne effectuée avec succès', 
      modifiedCount: result.modifiedCount 
    };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erreur lors de la réinitialisation quotidienne des plats:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Planifie la tâche de réinitialisation quotidienne
 * Exécute la réinitialisation tous les jours à 1h00 du matin
 */
const scheduleDailyReset = () => {
  // Exécuter la tâche tous les jours à 1h00 du matin
  // Format cron: * * * * * *
  // seconde (0-59), minute (0-59), heure (0-23), jour du mois (1-31), mois (1-12), jour de la semaine (0-7)
  cron.schedule('0 0 1 * * *', async () => {
    console.log(`[${new Date().toISOString()}] Démarrage de la réinitialisation quotidienne des plats`);
    await resetDailyDishes();
  });
  
  console.log('Tâche de réinitialisation quotidienne des plats planifiée pour 1h00 du matin');
};

module.exports = {
  resetDailyDishes,
  scheduleDailyReset
};
