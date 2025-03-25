const request = require('supertest');
const mongoose = require('mongoose');
require('dotenv').config();

// Modu00e8les nu00e9cessaires pour les tests
const User = require('../../models/user');
const Restaurant = require('../../models/restaurant');
const Dish = require('../../models/dish');

// Importer l'application Express
let app;

beforeAll(async () => {
  // Connexion u00e0 la base de donnu00e9es de test
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyMeal_test');
  
  // Importer l'application apru00e8s la connexion u00e0 la base de donnu00e9es
  app = require('../../app');
});

afterAll(async () => {
  await mongoose.disconnect();
});

// Fonction pour du00e9boguer les erreurs
const logError = (err) => {
  console.log('DEBUG ERROR:', err);
};

describe('Roles and Permissions', () => {
  let regularUserToken;
  let ownerToken;
  let adminToken;
  let restaurantId;
  let dishId;
  let regularUserId;
  let ownerId;
  let adminId;

  // Avant tous les tests, cru00e9er des utilisateurs avec diffu00e9rents ru00f4les
  beforeAll(async () => {
    try {
      // Nettoyer les collections
      await User.deleteMany({});
      await Restaurant.deleteMany({});
      await Dish.deleteMany({});

      // Cru00e9er un utilisateur ru00e9gulier
      const regularUser = await User.create({
        name: 'Regular User',
        email: 'user@test.com',
        password: 'password123',
        role: 'user'
      });
      regularUserId = regularUser._id;
      regularUserToken = regularUser.getSignedJwtToken();

      // Cru00e9er un propriu00e9taire de restaurant
      const owner = await User.create({
        name: 'Restaurant Owner',
        email: 'owner@test.com',
        password: 'password123',
        role: 'owner'
      });
      ownerId = owner._id;
      ownerToken = owner.getSignedJwtToken();

      // Cru00e9er un administrateur
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin'
      });
      adminId = admin._id;
      adminToken = admin.getSignedJwtToken();

      // Cru00e9er un restaurant pour les tests
      const restaurant = await Restaurant.create({
        name: 'Test Restaurant',
        address: '123 Test Street',
        location: {
          type: 'Point',
          coordinates: [48.8566, 2.3522]
        },
        owner: ownerId
      });
      restaurantId = restaurant._id;

      // Cru00e9er un plat pour les tests
      const dish = await Dish.create({
        name: 'Test Dish',
        description: 'A test dish',
        price: 12.99,
        restaurant: restaurantId,
        dietaryOptions: ['vegetarian']
      });
      dishId = dish._id;
    } catch (err) {
      logError(err);
      throw err;
    }
  });

  describe('Restaurant Owner Permissions', () => {
    it('should allow owner to create a restaurant', async () => {
      try {
        const restaurantData = {
          name: 'New Restaurant',
          address: '456 New Street',
          location: {
            type: 'Point',
            coordinates: [48.8566, 2.3522]
          }
        };

        const res = await request(app)
          .post('/api/restaurants')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(restaurantData)
          .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('New Restaurant');
        expect(res.body.data.owner.toString()).toBe(ownerId.toString());
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should allow owner to update their own restaurant', async () => {
      try {
        const updateData = {
          name: 'Updated Restaurant Name'
        };

        const res = await request(app)
          .put(`/api/restaurants/${restaurantId}`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(updateData)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('Updated Restaurant Name');
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should allow owner to create a dish for their restaurant', async () => {
      try {
        const dishData = {
          name: 'New Dish',
          description: 'A new test dish',
          price: 15.99,
          restaurant: restaurantId,
          dietaryOptions: ['vegan']
        };

        const res = await request(app)
          .post('/api/dishes')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(dishData)
          .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('New Dish');
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should not allow owner to update another owner\'s restaurant', async () => {
      try {
        // Cru00e9er un autre propriu00e9taire et son restaurant
        const anotherOwner = await User.create({
          name: 'Another Owner',
          email: 'another@test.com',
          password: 'password123',
          role: 'owner'
        });
        const anotherOwnerToken = anotherOwner.getSignedJwtToken();

        const anotherRestaurant = await Restaurant.create({
          name: 'Another Restaurant',
          address: '789 Another Street',
          location: {
            type: 'Point',
            coordinates: [48.8566, 2.3522]
          },
          owner: anotherOwner._id
        });

        // Essayer de mettre u00e0 jour le restaurant avec le premier propriu00e9taire
        const updateData = {
          name: 'Unauthorized Update'
        };

        const res = await request(app)
          .put(`/api/restaurants/${anotherRestaurant._id}`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(updateData)
          .expect(403);

        expect(res.body.success).toBe(false);
      } catch (err) {
        logError(err);
        throw err;
      }
    });
  });

  describe('Regular User Permissions', () => {
    it('should not allow regular user to create a restaurant', async () => {
      try {
        const restaurantData = {
          name: 'Unauthorized Restaurant',
          address: '999 Unauthorized Street',
          location: {
            type: 'Point',
            coordinates: [48.8566, 2.3522]
          }
        };

        const res = await request(app)
          .post('/api/restaurants')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send(restaurantData)
          .expect(403);

        expect(res.body.success).toBe(false);
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should allow regular user to view restaurants', async () => {
      try {
        const res = await request(app)
          .get('/api/restaurants')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should allow regular user to view dishes', async () => {
      try {
        const res = await request(app)
          .get('/api/dishes')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should not allow regular user to create a dish', async () => {
      try {
        const dishData = {
          name: 'Unauthorized Dish',
          description: 'An unauthorized dish',
          price: 9.99,
          restaurant: restaurantId,
          dietaryOptions: ['vegetarian']
        };

        const res = await request(app)
          .post('/api/dishes')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send(dishData)
          .expect(403);

        expect(res.body.success).toBe(false);
      } catch (err) {
        logError(err);
        throw err;
      }
    });
  });

  describe('Admin Permissions', () => {
    it('should allow admin to view all users', async () => {
      try {
        const res = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(3); // Au moins 3 utilisateurs cru00e9u00e9s
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should allow admin to update any restaurant', async () => {
      try {
        const updateData = {
          name: 'Admin Updated Restaurant'
        };

        const res = await request(app)
          .put(`/api/restaurants/${restaurantId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('Admin Updated Restaurant');
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should allow admin to update any dish', async () => {
      try {
        const updateData = {
          name: 'Admin Updated Dish',
          price: 19.99
        };

        const res = await request(app)
          .put(`/api/dishes/${dishId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('Admin Updated Dish');
        expect(res.body.data.price).toBe(19.99);
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should allow admin to create a user', async () => {
      try {
        const userData = {
          name: 'Created By Admin',
          email: 'adminCreated@test.com',
          password: 'password123',
          role: 'user'
        };

        const res = await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(userData)
          .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('Created By Admin');
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should not allow non-admin to access admin routes', async () => {
      try {
        const res = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${ownerToken}`)
          .expect(403);

        expect(res.body.success).toBe(false);
      } catch (err) {
        logError(err);
        throw err;
      }
    });
  });
});
