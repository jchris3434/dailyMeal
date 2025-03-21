const Restaurant = require('../models/restaurant');

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
exports.getRestaurants = async (req, res, next) => {
  try {
    let query;

    // Copier req.query
    const reqQuery = { ...req.query };

    // Traitement spécial pour la recherche par nom (recherche partielle)
    if (reqQuery.name) {
      reqQuery.name = { $regex: reqQuery.name, $options: 'i' };
    }

    // Champs à exclure
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Supprimer les champs à exclure de reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Créer la chaîne de requête
    let queryStr = JSON.stringify(reqQuery);

    // Créer les opérateurs ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Trouver les restaurants
    query = Restaurant.find(JSON.parse(queryStr));

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
    const total = await Restaurant.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Exécuter la requête
    const restaurants = await query;

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
      count: restaurants.length,
      pagination,
      data: restaurants
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new restaurant
// @route   POST /api/restaurants
// @access  Private (owner, admin)
exports.createRestaurant = async (req, res, next) => {
  try {
    // Ajouter l'utilisateur à req.body
    req.body.owner = req.user.id;

    // Vérifier si l'utilisateur est un propriétaire ou un admin
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Seuls les propriétaires et les administrateurs peuvent créer des restaurants'
      });
    }

    const restaurant = await Restaurant.create(req.body);

    res.status(201).json({
      success: true,
      data: restaurant
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

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private (owner of the restaurant, admin)
exports.updateRestaurant = async (req, res, next) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);

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
        error: 'Vous n\'avez pas l\'autorisation de modifier ce restaurant'
      });
    }

    restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private (owner of the restaurant, admin)
exports.deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

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
        error: 'Vous n\'avez pas l\'autorisation de supprimer ce restaurant'
      });
    }

    await restaurant.deleteOne();

    res.status(200).json({
      success: true,
      data: null
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get restaurants within a radius
// @route   GET /api/restaurants/radius/:zipcode/:distance
// @access  Public
exports.getRestaurantsInRadius = async (req, res, next) => {
  try {
    const { zipcode, distance } = req.params;

    // Obtenir les coordonnées lat/lng à partir du zipcode
    // Pour simplifier, nous utilisons directement les coordonnées dans le format 'lat,lng'
    const [lat, lng] = zipcode.split(',');

    // Calculer le rayon en radians
    // La Terre a un rayon d'environ 6378 km
    const radius = distance / 6378;

    const restaurants = await Restaurant.findNearby([parseFloat(lng), parseFloat(lat)], parseFloat(distance) * 1000);

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants
    });
  } catch (err) {
    next(err);
  }
};
