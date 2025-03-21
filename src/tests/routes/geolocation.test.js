const request = require('supertest');
const mongoose = require('mongoose');
require('dotenv').config();

// Modu00e8les nu00e9cessaires pour les tests
const Restaurant = require('../../models/restaurant');
const User = require('../../models/user');

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

describe('Geolocation API Routes', () => {
  let token;
  let ownerId;

  // Avant tous les tests, cru00e9er un utilisateur propriu00e9taire et obtenir un token
  beforeAll(async () => {
    // Nettoyer les collections
    await User.deleteMany({});
    await Restaurant.deleteMany({});

    // Cru00e9er un utilisateur propriu00e9taire
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
  });

  // Avant chaque test, nettoyer la collection de restaurants
  beforeEach(async () => {
    await Restaurant.deleteMany({});
  });

  describe('GET /api/restaurants/radius/:coordinates/:distance', () => {
    it('should return restaurants within a specified radius', async () => {
      // Cru00e9er des restaurants avec des coordonnu00e9es diffu00e9rentes
      // Paris (48.8566, 2.3522)
      const parisRestaurant = await Restaurant.create({
        name: 'Restaurant Paris',
        address: '123 Paris Street',
        location: {
          type: 'Point',
          coordinates: [2.3522, 48.8566] // [longitude, latitude]
        },
        owner: ownerId
      });

      // Lyon (45.7640, 4.8357) - environ 400km de Paris
      const lyonRestaurant = await Restaurant.create({
        name: 'Restaurant Lyon',
        address: '456 Lyon Avenue',
        location: {
          type: 'Point',
          coordinates: [4.8357, 45.7640] // [longitude, latitude]
        },
        owner: ownerId
      });

      // Versailles (48.8044, 2.1232) - environ 20km de Paris
      const versaillesRestaurant = await Restaurant.create({
        name: 'Restaurant Versailles',
        address: '789 Versailles Boulevard',
        location: {
          type: 'Point',
          coordinates: [2.1232, 48.8044] // [longitude, latitude]
        },
        owner: ownerId
      });

      // Test 1: Recherche avec un rayon de 30km autour de Paris (devrait inclure Paris et Versailles)
      const res1 = await request(app)
        .get('/api/restaurants/radius/48.8566,2.3522/30')
        .expect(200);

      expect(res1.body.success).toBe(true);
      expect(res1.body.count).toBe(2);
      expect(res1.body.data.some(r => r.name === 'Restaurant Paris')).toBe(true);
      expect(res1.body.data.some(r => r.name === 'Restaurant Versailles')).toBe(true);
      expect(res1.body.data.some(r => r.name === 'Restaurant Lyon')).toBe(false);

      // Test 2: Recherche avec un rayon de 500km autour de Paris (devrait inclure tous les restaurants)
      const res2 = await request(app)
        .get('/api/restaurants/radius/48.8566,2.3522/500')
        .expect(200);

      expect(res2.body.success).toBe(true);
      expect(res2.body.count).toBe(3);
      expect(res2.body.data.some(r => r.name === 'Restaurant Paris')).toBe(true);
      expect(res2.body.data.some(r => r.name === 'Restaurant Versailles')).toBe(true);
      expect(res2.body.data.some(r => r.name === 'Restaurant Lyon')).toBe(true);

      // Test 3: Recherche avec un rayon de 5km autour de Lyon (devrait inclure uniquement Lyon)
      const res3 = await request(app)
        .get('/api/restaurants/radius/45.7640,4.8357/5')
        .expect(200);

      expect(res3.body.success).toBe(true);
      expect(res3.body.count).toBe(1);
      expect(res3.body.data.some(r => r.name === 'Restaurant Lyon')).toBe(true);
      expect(res3.body.data.some(r => r.name === 'Restaurant Paris')).toBe(false);
      expect(res3.body.data.some(r => r.name === 'Restaurant Versailles')).toBe(false);
    });

    it('should handle invalid coordinates format', async () => {
      const res = await request(app)
        .get('/api/restaurants/radius/invalid-coordinates/30')
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('should handle invalid distance parameter', async () => {
      const res = await request(app)
        .get('/api/restaurants/radius/48.8566,2.3522/invalid-distance')
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /api/restaurants with location query parameters', () => {
    it('should filter restaurants by proximity when lat, lng and maxDistance are provided', async () => {
      // Cru00e9er des restaurants avec des coordonnu00e9es diffu00e9rentes
      // Paris (48.8566, 2.3522)
      const parisRestaurant = await Restaurant.create({
        name: 'Restaurant Paris',
        address: '123 Paris Street',
        location: {
          type: 'Point',
          coordinates: [2.3522, 48.8566] // [longitude, latitude]
        },
        owner: ownerId
      });

      // Lyon (45.7640, 4.8357) - environ 400km de Paris
      const lyonRestaurant = await Restaurant.create({
        name: 'Restaurant Lyon',
        address: '456 Lyon Avenue',
        location: {
          type: 'Point',
          coordinates: [4.8357, 45.7640] // [longitude, latitude]
        },
        owner: ownerId
      });

      // Versailles (48.8044, 2.1232) - environ 20km de Paris
      const versaillesRestaurant = await Restaurant.create({
        name: 'Restaurant Versailles',
        address: '789 Versailles Boulevard',
        location: {
          type: 'Point',
          coordinates: [2.1232, 48.8044] // [longitude, latitude]
        },
        owner: ownerId
      });

      // Test: Recherche avec un rayon de 30km autour de Paris (devrait inclure Paris et Versailles)
      const res = await request(app)
        .get('/api/restaurants?lat=48.8566&lng=2.3522&maxDistance=30')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data.some(r => r.name === 'Restaurant Paris')).toBe(true);
      expect(res.body.data.some(r => r.name === 'Restaurant Versailles')).toBe(true);
      expect(res.body.data.some(r => r.name === 'Restaurant Lyon')).toBe(false);
    });

    it('should ignore location filtering if lat, lng or maxDistance is missing', async () => {
      // Cru00e9er des restaurants avec des coordonnu00e9es diffu00e9rentes
      await Restaurant.create([
        {
          name: 'Restaurant Paris',
          address: '123 Paris Street',
          location: {
            type: 'Point',
            coordinates: [2.3522, 48.8566] // [longitude, latitude]
          },
          owner: ownerId
        },
        {
          name: 'Restaurant Lyon',
          address: '456 Lyon Avenue',
          location: {
            type: 'Point',
            coordinates: [4.8357, 45.7640] // [longitude, latitude]
          },
          owner: ownerId
        }
      ]);

      // Test: Recherche avec seulement lat (devrait ignorer le filtrage par localisation)
      const res = await request(app)
        .get('/api/restaurants?lat=48.8566')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2); // Tous les restaurants devraient u00eatre retournu00e9s
    });
  });
});
