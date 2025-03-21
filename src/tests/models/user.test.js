const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../../models/user');
const Restaurant = require('../../models/restaurant');

// Utiliser la base de données MongoDB Docker pour les tests
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyMeal_test');
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('User Model Test', () => {
  beforeEach(async () => {
    // Nettoyer la collection avant chaque test
    await User.deleteMany({});
    await Restaurant.deleteMany({});
  });

  it('should create a new user with valid data', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.email).toBe(userData.email);
    // Le mot de passe doit être hashé, donc différent de l'original
    expect(savedUser.password).not.toBe(userData.password);
    expect(savedUser.role).toBe(userData.role);
  });

  it('should fail to create a user without required fields', async () => {
    const invalidUser = new User({ name: 'Invalid User' });
    
    let error;
    try {
      await invalidUser.save();
    } catch (e) {
      error = e;
    }
    
    expect(error).toBeDefined();
    expect(error.errors.email).toBeDefined();
    expect(error.errors.password).toBeDefined();
  });

  it('should validate email format', async () => {
    const userWithInvalidEmail = new User({
      name: 'Email Test User',
      email: 'invalid-email',
      password: 'password123',
      role: 'user'
    });

    let error;
    try {
      await userWithInvalidEmail.save();
    } catch (e) {
      error = e;
    }
    
    expect(error).toBeDefined();
    expect(error.errors.email).toBeDefined();
  });

  it('should not allow duplicate emails', async () => {
    // Créer un premier utilisateur
    const firstUser = new User({
      name: 'First User',
      email: 'duplicate@example.com',
      password: 'password123',
      role: 'user'
    });
    await firstUser.save();

    // Essayer de créer un deuxième utilisateur avec le même email
    const duplicateUser = new User({
      name: 'Duplicate User',
      email: 'duplicate@example.com',
      password: 'password456',
      role: 'user'
    });

    let error;
    try {
      await duplicateUser.save();
    } catch (e) {
      error = e;
    }
    
    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // Code d'erreur MongoDB pour les doublons
  });

  it('should correctly match passwords', async () => {
    const userData = {
      name: 'Password Test User',
      email: 'password@example.com',
      password: 'correctPassword',
      role: 'user'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    // Vérifier que la méthode matchPassword fonctionne correctement
    const isMatch = await savedUser.matchPassword('correctPassword');
    expect(isMatch).toBe(true);

    const isWrongMatch = await savedUser.matchPassword('wrongPassword');
    expect(isWrongMatch).toBe(false);
  });

  it('should generate a JSON Web Token', async () => {
    const userData = {
      name: 'JWT Test User',
      email: 'jwt@example.com',
      password: 'password123',
      role: 'user'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    const token = savedUser.getSignedJwtToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // Format JWT: header.payload.signature
  });

  it('should create a restaurant owner', async () => {
    const ownerData = {
      name: 'Restaurant Owner',
      email: 'owner@restaurant.com',
      password: 'password123',
      role: 'owner'
    };

    const owner = new User(ownerData);
    const savedOwner = await owner.save();

    expect(savedOwner.role).toBe('owner');

    // Créer un restaurant associé à cet owner
    const restaurant = new Restaurant({
      name: 'Owner\'s Restaurant',
      address: '123 Owner Street',
      location: {
        type: 'Point',
        coordinates: [48.8566, 2.3522]
      },
      owner: savedOwner._id
    });

    const savedRestaurant = await restaurant.save();
    expect(savedRestaurant.owner.toString()).toBe(savedOwner._id.toString());
  });
});
