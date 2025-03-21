const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du plat est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  price: {
    type: Number,
    required: [true, 'Le prix du plat est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Le restaurant est requis']
  },
  availableDate: {
    type: Date,
    default: Date.now
  },
  dietaryOptions: {
    type: [String],
    enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher']
  },
  image: {
    type: String
  },
  ingredients: {
    type: [String]
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Méthode statique pour trouver les plats par options diététiques
dishSchema.statics.findByDietaryOptions = function(options) {
  return this.find({ dietaryOptions: { $in: options } });
};

// Méthode statique pour trouver les plats par restaurant
dishSchema.statics.findByRestaurant = function(restaurantId) {
  return this.find({ restaurant: restaurantId });
};

// Méthode statique pour trouver les plats disponibles aujourd'hui
dishSchema.statics.findAvailableToday = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    availableDate: { $gte: today, $lt: tomorrow },
    isAvailable: true
  });
};

const Dish = mongoose.model('Dish', dishSchema);

module.exports = Dish;
