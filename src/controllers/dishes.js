const Dish = require('../models/dish');
const Restaurant = require('../models/restaurant');

// @desc    Get all dishes
// @route   GET /api/dishes
// @access  Public
exports.getDishes = async (req, res, next) => {
  try {
    let query;

    // Copier req.query
    const reqQuery = { ...req.query };

    // Traitement spécial pour la recherche par nom (recherche partielle)
    if (reqQuery.name) {
      reqQuery.name = { $regex: reqQuery.name, $options: 'i' };
    }

    // Traitement spécial pour les options diététiques
    if (reqQuery.dietaryOptions) {
      // Normaliser les options diététiques en tableau, quelle que soit la façon dont elles sont passées
      let dietaryOptions;
      
      if (Array.isArray(reqQuery.dietaryOptions)) {
        dietaryOptions = reqQuery.dietaryOptions;
      } else if (typeof reqQuery.dietaryOptions === 'string') {
        // Si c'est une chaîne, vérifier si elle contient une virgule (format CSV)
        if (reqQuery.dietaryOptions.includes(',')) {
          dietaryOptions = reqQuery.dietaryOptions.split(',');
        } else {
          dietaryOptions = [reqQuery.dietaryOptions];
        }
      } else {
        dietaryOptions = [reqQuery.dietaryOptions];
      }
      
      // Vérifier que toutes les options sont valides
      const validOptions = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher'];
      const filteredOptions = dietaryOptions.filter(opt => validOptions.includes(opt));
      
      if (filteredOptions.length > 0) {
        reqQuery.dietaryOptions = { $in: filteredOptions };
      } else {
        delete reqQuery.dietaryOptions; // Supprimer le filtre si aucune option valide
      }
    }

    // Champs à exclure
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Supprimer les champs à exclure de reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Créer la chaîne de requête
    let queryStr = JSON.stringify(reqQuery);

    // Créer les opérateurs ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Trouver les plats
    query = Dish.find(JSON.parse(queryStr));

    // Sélection de champs
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Tri
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    // Utiliser une copie de la requête pour le comptage
    const countQuery = JSON.parse(queryStr);
    const total = await Dish.countDocuments(countQuery);

    query = query.skip(startIndex).limit(limit);

    // Exécuter la requête
    const dishes = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: dishes.length,
      pagination,
      data: dishes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single dish
// @route   GET /api/dishes/:id
// @access  Public
exports.getDish = async (req, res, next) => {
  try {
    const dish = await Dish.findById(req.params.id);

    if (!dish) {
      return res.status(404).json({
        success: false,
        error: 'Plat non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: dish
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new dish
// @route   POST /api/dishes
// @access  Private (owner, admin)
exports.createDish = async (req, res, next) => {
  try {
    // Vérifier si le restaurant existe
    const restaurant = await Restaurant.findById(req.body.restaurant);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant non trouvé'
      });
    }

    // Vérifier si l'utilisateur est le propriétaire du restaurant ou un admin
    if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'avez pas l\'autorisation d\'ajouter un plat à ce restaurant'
      });
    }

    const dish = await Dish.create(req.body);

    res.status(201).json({
      success: true,
      data: dish
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    next(err);
  }
};

// @desc    Update dish
// @route   PUT /api/dishes/:id
// @access  Private (owner of the restaurant, admin)
exports.updateDish = async (req, res, next) => {
  try {
    let dish = await Dish.findById(req.params.id);

    if (!dish) {
      return res.status(404).json({
        success: false,
        error: 'Plat non trouvé'
      });
    }

    // Trouver le restaurant associé au plat
    const restaurant = await Restaurant.findById(dish.restaurant);

    // Vérifier si l'utilisateur est le propriétaire du restaurant ou un admin
    if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'avez pas l\'autorisation de modifier ce plat'
      });
    }

    dish = await Dish.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: dish
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete dish
// @route   DELETE /api/dishes/:id
// @access  Private (owner of the restaurant, admin)
exports.deleteDish = async (req, res, next) => {
  try {
    const dish = await Dish.findById(req.params.id);

    if (!dish) {
      return res.status(404).json({
        success: false,
        error: 'Plat non trouvé'
      });
    }

    // Trouver le restaurant associé au plat
    const restaurant = await Restaurant.findById(dish.restaurant);

    // Vérifier si l'utilisateur est le propriétaire du restaurant ou un admin
    if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'avez pas l\'autorisation de supprimer ce plat'
      });
    }

    await dish.deleteOne();

    res.status(200).json({
      success: true,
      data: null
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get dishes by restaurant
// @route   GET /api/dishes/restaurant/:restaurantId
// @access  Public
exports.getDishesByRestaurant = async (req, res, next) => {
  try {
    const dishes = await Dish.find({ restaurant: req.params.restaurantId });

    res.status(200).json({
      success: true,
      count: dishes.length,
      data: dishes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get dishes available today
// @route   GET /api/dishes/available
// @access  Public
exports.getAvailableDishes = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dishes = await Dish.find({
      availableDate: { $gte: today, $lt: tomorrow },
      isAvailable: true
    });

    res.status(200).json({
      success: true,
      count: dishes.length,
      data: dishes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Programmer un plat pour des jours spécifiques de la semaine
// @route   POST /api/dishes/:id/schedule
// @access  Private (owner of the restaurant, admin)
exports.scheduleDish = async (req, res, next) => {
  try {
    let dish = await Dish.findById(req.params.id);

    if (!dish) {
      return res.status(404).json({
        success: false,
        error: 'Plat non trouvé'
      });
    }

    // Trouver le restaurant associé au plat
    const restaurant = await Restaurant.findById(dish.restaurant);

    // Vérifier si l'utilisateur est le propriétaire du restaurant ou un admin
    if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'avez pas l\'autorisation de programmer ce plat'
      });
    }

    // Valider les données de programmation
    if (!req.body.schedule || !Array.isArray(req.body.schedule)) {
      return res.status(400).json({
        success: false,
        error: 'Données de programmation invalides'
      });
    }

    // Valider chaque entrée de programmation
    for (const entry of req.body.schedule) {
      if (typeof entry.dayOfWeek !== 'number' || entry.dayOfWeek < 0 || entry.dayOfWeek > 6) {
        return res.status(400).json({
          success: false,
          error: 'Le jour de la semaine doit être un nombre entre 0 (dimanche) et 6 (samedi)'
        });
      }

      if (typeof entry.isAvailable !== 'boolean') {
        entry.isAvailable = true; // Valeur par défaut
      }
    }

    // Mettre à jour la programmation hebdomadaire
    dish.weeklySchedule = req.body.schedule;
    await dish.save();

    res.status(200).json({
      success: true,
      data: dish
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtenir la programmation hebdomadaire d'un plat
// @route   GET /api/dishes/:id/schedule
// @access  Public
exports.getDishSchedule = async (req, res, next) => {
  try {
    const dish = await Dish.findById(req.params.id);

    if (!dish) {
      return res.status(404).json({
        success: false,
        error: 'Plat non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: dish._id,
        name: dish.name,
        weeklySchedule: dish.weeklySchedule
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtenir tous les plats disponibles un jour spécifique de la semaine
// @route   GET /api/dishes/available/day/:dayOfWeek
// @access  Public
exports.getDishesByDayOfWeek = async (req, res, next) => {
  try {
    const dayOfWeek = parseInt(req.params.dayOfWeek, 10);

    // Valider le jour de la semaine
    if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({
        success: false,
        error: 'Le jour de la semaine doit être un nombre entre 0 (dimanche) et 6 (samedi)'
      });
    }

    // Trouver les plats disponibles ce jour-là
    const dishes = await Dish.findAvailableByDayOfWeek(dayOfWeek);

    res.status(200).json({
      success: true,
      count: dishes.length,
      data: dishes
    });
  } catch (err) {
    next(err);
  }
};
