const User = require('../models/user');

// @desc    Enregistrer un utilisateur
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user' // Par défaut, le rôle est 'user'
    });

    // Envoyer la réponse avec le token JWT
    sendTokenResponse(user, 201, res);
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

// @desc    Connecter un utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Valider l'email et le mot de passe
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez fournir un email et un mot de passe'
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides'
      });
    }

    // Vérifier si le mot de passe correspond
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides'
      });
    }

    // Envoyer la réponse avec le token JWT
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mettre à jour les informations de l'utilisateur
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address
    };

    // Supprimer les champs non fournis
    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mettre à jour le mot de passe
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Vérifier le mot de passe actuel
    const isMatch = await user.matchPassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Mot de passe incorrect'
      });
    }

    // Définir le nouveau mot de passe
    user.password = req.body.newPassword;
    await user.save();

    // Envoyer la réponse avec le nouveau token JWT
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Obtenir tous les utilisateurs
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    let query;

    // Copier req.query
    const reqQuery = { ...req.query };

    // Champs à exclure
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Supprimer les champs à exclure de reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Créer la chaîne de requête
    let queryStr = JSON.stringify(reqQuery);

    // Créer les opérateurs ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Trouver les utilisateurs
    query = User.find(JSON.parse(queryStr));

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
    const total = await User.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Exécuter la requête
    const users = await query;

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
      count: users.length,
      pagination,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtenir un utilisateur par son ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Créer un utilisateur
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    } else if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Un utilisateur avec cet email existe déjà'
      });
    }
    next(err);
  }
};

// @desc    Mettre à jour un utilisateur
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    } else if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Un utilisateur avec cet email existe déjà'
      });
    }
    next(err);
  }
};

// @desc    Supprimer un utilisateur
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: null
    });
  } catch (err) {
    next(err);
  }
};

// Fonction utilitaire pour envoyer la réponse avec le token JWT
const sendTokenResponse = (user, statusCode, res) => {
  // Créer le token
  const token = user.getSignedJwtToken();

  // Options pour le cookie
  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Utiliser HTTPS en production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // Exclure le mot de passe de la réponse
  user.password = undefined;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      data: user
    });
};
