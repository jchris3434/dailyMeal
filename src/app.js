const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Charger les variables d'environnement
dotenv.config();

// Initialiser l'application Express
const app = express();

// Middleware pour parser le JSON
app.use(express.json());

// Activer CORS
app.use(cors());

// Routes (à implémenter)
app.use('/api/restaurants', require('./routes/restaurants'));
// app.use('/api/dishes', require('./routes/dishes'));
// app.use('/api/auth', require('./routes/auth'));

// Middleware pour gérer les erreurs 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  });
});

// Middleware pour gérer les erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Erreur serveur'
  });
});

module.exports = app;
