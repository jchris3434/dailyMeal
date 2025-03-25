const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Import du service de réinitialisation quotidienne
const { scheduleDailyReset } = require('./services/dailyReset');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = require('./config/db');
connectDB();

// Import de l'application Express configurée
const app = require('./app');

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  
  // Planifier la tâche de réinitialisation quotidienne
  scheduleDailyReset();
  console.log('Tâche de réinitialisation quotidienne des plats planifiée pour 1h00 du matin');
});

module.exports = app; // For testing purposes
