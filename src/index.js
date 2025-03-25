const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Import du service de réinitialisation quotidienne
const { scheduleDailyReset } = require('./services/dailyReset');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
const connectDB = require('./config/db');
connectDB();

// Define routes
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/dishes', require('./routes/dishes'));
app.use('/api/admin', require('./routes/admin'));
// app.use('/api/users', require('./routes/users'));

// Default route
app.get('/', (req, res) => {
  res.send('DailyMeal API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  
  // Planifier la tâche de réinitialisation quotidienne
  scheduleDailyReset();
  console.log('Tâche de réinitialisation quotidienne des plats planifiée pour 1h00 du matin');
});

module.exports = app; // For testing purposes
