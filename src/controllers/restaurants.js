const Restaurant = require('../models/restaurant');

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
exports.getRestaurants = async (req, res, next) => {
  try {
    let query;

    // Copier req.query
    const reqQuery = { ...req.query };

    // Vérifier si des paramètres de géolocalisation sont présents
    const { lat, lng, maxDistance } = req.query;
    
    // Supprimer les paramètres de géolocalisation de reqQuery pour le traitement standard
    ['lat', 'lng', 'maxDistance'].forEach(param => delete reqQuery[param]);

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

    // Vérifier si tous les paramètres de géolocalisation sont présents
    if (lat && lng && maxDistance) {
      // Utiliser la méthode findNearby pour la recherche géospatiale
      const coordinates = [parseFloat(lng), parseFloat(lat)];
      const distance = parseFloat(maxDistance) * 1000; // Convertir en mètres
      
      query = Restaurant.findNearby(coordinates, distance).find(JSON.parse(queryStr));
    } else {
      // Recherche standard sans géolocalisation
      query = Restaurant.find(JSON.parse(queryStr));
    }

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
    
    // Compter les documents (avec ou sans géolocalisation)
    let total;
    if (lat && lng && maxDistance) {
      const coordinates = [parseFloat(lng), parseFloat(lat)];
      const distance = parseFloat(maxDistance) * 1000;
      total = await Restaurant.findNearby(coordinates, distance).find(JSON.parse(queryStr)).countDocuments();
    } else {
      total = await Restaurant.countDocuments(JSON.parse(queryStr));
    }

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
// @route   GET /api/restaurants/radius/:coordinates/:distance
// @access  Public
exports.getRestaurantsInRadius = async (req, res, next) => {
  try {
    const { coordinates, distance } = req.params;

    // Obtenir les coordonnées lat/lng à partir du format 'lat,lng'
    const [lat, lng] = coordinates.split(',');

    // Validation des coordonnées
    if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
      return res.status(400).json({
        success: false,
        error: 'Format de coordonnées invalide. Utilisez le format "latitude,longitude"'
      });
    }

    // Validation de la distance
    if (!distance || isNaN(parseFloat(distance))) {
      return res.status(400).json({
        success: false,
        error: 'Distance invalide. Veuillez fournir une valeur numérique en kilomètres'
      });
    }

    // Convertir la distance en mètres pour la recherche géospatiale
    const distanceInMeters = parseFloat(distance) * 1000;

    const restaurants = await Restaurant.findNearby([parseFloat(lng), parseFloat(lat)], distanceInMeters);

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants
    });
  } catch (err) {
    next(err);
  }
};
