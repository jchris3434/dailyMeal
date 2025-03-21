const mongoose = require('mongoose');

// Schéma pour les heures d'ouverture
const openingHoursSchema = new mongoose.Schema({
  open: {
    type: String,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/  // Format HH:MM (00:00 - 23:59)
  },
  close: {
    type: String,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/  // Format HH:MM (00:00 - 23:59)
  }
}, { _id: false });

// Schéma pour le modèle Restaurant
const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du restaurant est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  address: {
    type: String,
    required: [true, 'L\'adresse du restaurant est requise'],
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(v) {
          return v.length === 2 && 
                 v[0] >= -90 && v[0] <= 90 && 
                 v[1] >= -180 && v[1] <= 180;
        },
        message: 'Les coordonnées doivent être au format [latitude, longitude]'
      }
    }
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez fournir une adresse email valide']
  },
  cuisine: {
    type: [String],
    default: []
  },
  openingHours: {
    monday: { type: openingHoursSchema, default: () => ({}) },
    tuesday: { type: openingHoursSchema, default: () => ({}) },
    wednesday: { type: openingHoursSchema, default: () => ({}) },
    thursday: { type: openingHoursSchema, default: () => ({}) },
    friday: { type: openingHoursSchema, default: () => ({}) },
    saturday: { type: openingHoursSchema, default: () => ({}) },
    sunday: { type: openingHoursSchema, default: () => ({}) }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexer la localisation pour les requêtes géospatiales
restaurantSchema.index({ location: '2dsphere' });

// Méthode pour trouver les restaurants à proximité
restaurantSchema.statics.findNearby = function(coordinates, maxDistance) {
  return this.find({
    location: {
      $geoWithin: {
        $centerSphere: [
          coordinates,
          maxDistance / 6378100 // Convertir la distance en radians (rayon de la Terre à l'équateur en mètres)
        ]
      }
    }
  });
};

module.exports = mongoose.model('Restaurant', restaurantSchema);
