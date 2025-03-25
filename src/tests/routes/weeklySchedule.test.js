const request = require('supertest');
const mongoose = require('mongoose');
require('dotenv').config();

// Modèles nécessaires pour les tests
const Dish = require('../../models/dish');
const Restaurant = require('../../models/restaurant');
const User = require('../../models/user');

// Importer l'application Express
let app;

beforeAll(async () => {
  // Connexion à la base de données de test
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyMeal_test');
  
  // Importer l'application après la connexion à la base de données
  app = require('../../app');
});

afterAll(async () => {
  await mongoose.disconnect();
});

// Fonction pour déboguer les erreurs
const logError = (err) => {
  console.log('DEBUG ERROR:', err);
};

describe('Weekly Dish Schedule API', () => {
  let token;
  let ownerId;
  let restaurantId;
  let dishId;

  // Avant tous les tests, créer un utilisateur propriétaire, un restaurant et obtenir un token
  beforeAll(async () => {
    try {
      // Nettoyer les collections
      await User.deleteMany({});
      await Restaurant.deleteMany({});
      await Dish.deleteMany({});

      // Créer un utilisateur propriétaire
      const ownerData = {
        name: 'Restaurant Owner',
        email: 'owner@test.com',
        password: 'password123',
        role: 'owner'
      };

      const owner = await User.create(ownerData);
      ownerId = owner._id;

      // Obtenir un token JWT pour l'authentification
      token = owner.getSignedJwtToken();

      // Créer un restaurant pour les tests
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

      // Créer un plat pour les tests
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

  describe('POST /api/dishes/:id/schedule', () => {
    it('should schedule a dish for specific days of the week', async () => {
      try {
        const scheduleData = {
          schedule: [
            { dayOfWeek: 1, isAvailable: true },  // Lundi
            { dayOfWeek: 3, isAvailable: true },  // Mercredi
            { dayOfWeek: 5, isAvailable: true }   // Vendredi
          ]
        };

        const res = await request(app)
          .post(`/api/dishes/${dishId}/schedule`)
          .set('Authorization', `Bearer ${token}`)
          .send(scheduleData)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('weeklySchedule');
        expect(res.body.data.weeklySchedule).toHaveLength(3);
        expect(res.body.data.weeklySchedule[0].dayOfWeek).toBe(1);
        expect(res.body.data.weeklySchedule[1].dayOfWeek).toBe(3);
        expect(res.body.data.weeklySchedule[2].dayOfWeek).toBe(5);
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should return 400 if schedule data is invalid', async () => {
      try {
        const invalidScheduleData = {
          schedule: [
            { dayOfWeek: 8, isAvailable: true }  // Jour invalide (> 7)
          ]
        };

        const res = await request(app)
          .post(`/api/dishes/${dishId}/schedule`)
          .set('Authorization', `Bearer ${token}`)
          .send(invalidScheduleData)
          .expect(400);

        expect(res.body.success).toBe(false);
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should return 403 if user is not the restaurant owner', async () => {
      try {
        // Créer un autre utilisateur qui n'est pas le propriétaire
        const otherUser = await User.create({
          name: 'Other User',
          email: 'other@test.com',
          password: 'password123',
          role: 'user'
        });

        const otherToken = otherUser.getSignedJwtToken();

        const scheduleData = {
          schedule: [
            { dayOfWeek: 1, isAvailable: true }
          ]
        };

        const res = await request(app)
          .post(`/api/dishes/${dishId}/schedule`)
          .set('Authorization', `Bearer ${otherToken}`)
          .send(scheduleData)
          .expect(403);

        expect(res.body.success).toBe(false);
      } catch (err) {
        logError(err);
        throw err;
      }
    });
  });

  describe('GET /api/dishes/:id/schedule', () => {
    it('should get the weekly schedule for a dish', async () => {
      try {
        // D'abord, créer un planning hebdomadaire
        const scheduleData = {
          schedule: [
            { dayOfWeek: 1, isAvailable: true },
            { dayOfWeek: 3, isAvailable: true },
            { dayOfWeek: 5, isAvailable: true }
          ]
        };

        await request(app)
          .post(`/api/dishes/${dishId}/schedule`)
          .set('Authorization', `Bearer ${token}`)
          .send(scheduleData);

        // Ensuite, récupérer le planning
        const res = await request(app)
          .get(`/api/dishes/${dishId}/schedule`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('weeklySchedule');
        expect(res.body.data.weeklySchedule).toHaveLength(3);
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should return 404 if dish not found', async () => {
      try {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .get(`/api/dishes/${fakeId}/schedule`)
          .expect(404);

        expect(res.body.success).toBe(false);
      } catch (err) {
        logError(err);
        throw err;
      }
    });
  });

  describe('GET /api/dishes/available/day/:dayOfWeek', () => {
    it('should get all dishes available on a specific day of the week', async () => {
      try {
        // Créer un autre plat avec un planning différent
        const dish2 = await Dish.create({
          name: 'Another Dish',
          description: 'Another test dish',
          price: 15.99,
          restaurant: restaurantId,
          dietaryOptions: ['vegan']
        });

        // Programmer le premier plat pour lundi, mercredi, vendredi
        await request(app)
          .post(`/api/dishes/${dishId}/schedule`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            schedule: [
              { dayOfWeek: 1, isAvailable: true },
              { dayOfWeek: 3, isAvailable: true },
              { dayOfWeek: 5, isAvailable: true }
            ]
          });

        // Programmer le deuxième plat pour lundi, mardi, jeudi
        await request(app)
          .post(`/api/dishes/${dish2._id}/schedule`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            schedule: [
              { dayOfWeek: 1, isAvailable: true },
              { dayOfWeek: 2, isAvailable: true },
              { dayOfWeek: 4, isAvailable: true }
            ]
          });

        // Récupérer les plats disponibles le lundi (jour 1)
        const res = await request(app)
          .get('/api/dishes/available/day/1')
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(2);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(2);

        // Récupérer les plats disponibles le mardi (jour 2)
        const res2 = await request(app)
          .get('/api/dishes/available/day/2')
          .expect(200);

        expect(res2.body.success).toBe(true);
        expect(res2.body.count).toBe(1);
        expect(res2.body.data[0].name).toBe('Another Dish');
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should return 400 if day of week is invalid', async () => {
      try {
        const res = await request(app)
          .get('/api/dishes/available/day/8')
          .expect(400);

        expect(res.body.success).toBe(false);
      } catch (err) {
        logError(err);
        throw err;
      }
    });
  });
});
