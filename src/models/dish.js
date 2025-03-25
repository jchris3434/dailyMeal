const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     WeeklySchedule:
 *       type: object
 *       required:
 *         - dayOfWeek
 *       properties:
 *         dayOfWeek:
 *           type: number
 *           description: Jour de la semaine (0 = dimanche, 6 = samedi)
 *           minimum: 0
 *           maximum: 6
 *         isAvailable:
 *           type: boolean
 *           description: Indique si le plat est disponible ce jour-là
 *           default: true
 *       example:
 *         dayOfWeek: 1
 *         isAvailable: true
 */
const weeklyScheduleSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: [0, 'Le jour doit être entre 0 (dimanche) et 6 (samedi)'],
    max: [6, 'Le jour doit être entre 0 (dimanche) et 6 (samedi)']
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Dish:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - restaurant
 *       properties:
 *         _id:
 *           type: string
 *           description: ID unique du plat généré automatiquement par MongoDB
 *         name:
 *           type: string
 *           description: Nom du plat
 *         description:
 *           type: string
 *           description: Description du plat
 *         price:
 *           type: number
 *           description: Prix du plat
 *           minimum: 0
 *         image:
 *           type: string
 *           description: URL de l'image du plat
 *         dietaryOptions:
 *           type: array
 *           items:
 *             type: string
 *             enum: [vegetarian, vegan, gluten-free, dairy-free, nut-free, halal, kosher]
 *           description: Options diététiques du plat
 *         ingredients:
 *           type: array
 *           items:
 *             type: string
 *           description: Liste des ingrédients du plat
 *         isAvailable:
 *           type: boolean
 *           description: Indique si le plat est disponible
 *           default: true
 *         weeklySchedule:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WeeklySchedule'
 *           description: Programmation hebdomadaire du plat
 *         restaurant:
 *           type: string
 *           description: ID du restaurant proposant le plat
 *         availableDate:
 *           type: string
 *           format: date-time
 *           description: Date de disponibilité du plat
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création du plat
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date de mise à jour du plat
 *       example:
 *         name: Plat Test
 *         description: Un plat délicieux pour les tests
 *         price: 12.99
 *         image: https://example.com/images/plat.jpg
 *         dietaryOptions: [vegetarian, gluten-free]
 *         ingredients: [tomate, mozzarella, basilic]
 *         isAvailable: true
 *         weeklySchedule: [
 *           { dayOfWeek: 1, isAvailable: true },
 *           { dayOfWeek: 3, isAvailable: true },
 *           { dayOfWeek: 5, isAvailable: true }
 *         ]
 *         restaurant: 5f8d0c1dcb2d663ae8c7a3b5
 */
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
  },
  weeklySchedule: {
    type: [weeklyScheduleSchema],
    default: []
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

// Méthode statique pour trouver les plats disponibles un jour spécifique de la semaine
dishSchema.statics.findAvailableByDayOfWeek = function(dayOfWeek) {
  return this.find({
    'weeklySchedule.dayOfWeek': dayOfWeek,
    'weeklySchedule.isAvailable': true,
    isAvailable: true
  });
};

const Dish = mongoose.model('Dish', dishSchema);

module.exports = Dish;
