const request = require('supertest');
const mongoose = require('mongoose');
require('dotenv').config();

// Modèles nécessaires pour les tests
const Restaurant = require('../../models/restaurant');
const User = require('../../models/user');

// Importer l'application Express (à créer)
let app;

beforeAll(async () => {
  // Connexion à la base de données de test
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyMeal_test');
  
  // Importer l'application après la connexion à la base de données
  // Ceci est important car l'application doit être importée après la connexion
  app = require('../../app');
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Restaurant API Routes', () => {
  let token;
  let ownerId;
  let restaurantId;

  // Avant tous les tests, créer un utilisateur propriétaire et obtenir un token
  beforeAll(async () => {
    // Nettoyer les collections
    await User.deleteMany({});
    await Restaurant.deleteMany({});

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
  });

  // Avant chaque test, nettoyer la collection de restaurants
  beforeEach(async () => {
    await Restaurant.deleteMany({});
  });

  describe('GET /api/restaurants', () => {
    it('should return all restaurants', async () => {
      // Créer quelques restaurants pour le test
      await Restaurant.create([
        {
          name: 'Restaurant 1',
          address: '123 Test Street',
          location: {
            type: 'Point',
            coordinates: [48.8566, 2.3522]
          },
          owner: ownerId
        },
        {
          name: 'Restaurant 2',
          address: '456 Test Avenue',
          location: {
            type: 'Point',
            coordinates: [45.7640, 4.8357]
          },
          owner: ownerId
        }
      ]);

      const res = await request(app)
        .get('/api/restaurants')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter restaurants by name', async () => {
      // Créer quelques restaurants pour le test
      await Restaurant.create([
        {
          name: 'Italian Restaurant',
          address: '123 Test Street',
          location: {
            type: 'Point',
            coordinates: [48.8566, 2.3522]
          },
          cuisine: ['Italian'],
          owner: ownerId
        },
        {
          name: 'French Bistro',
          address: '456 Test Avenue',
          location: {
            type: 'Point',
            coordinates: [45.7640, 4.8357]
          },
          cuisine: ['French'],
          owner: ownerId
        }
      ]);

      const res = await request(app)
        .get('/api/restaurants?name=Italian')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].name).toBe('Italian Restaurant');
    });
  });

  describe('GET /api/restaurants/:id', () => {
    it('should return a single restaurant by ID', async () => {
      // Créer un restaurant pour le test
      const restaurant = await Restaurant.create({
        name: 'Test Restaurant',
        address: '123 Test Street',
        location: {
          type: 'Point',
          coordinates: [48.8566, 2.3522]
        },
        owner: ownerId
      });

      const res = await request(app)
        .get(`/api/restaurants/${restaurant._id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(restaurant._id.toString());
      expect(res.body.data.name).toBe('Test Restaurant');
    });

    it('should return 404 if restaurant not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .get(`/api/restaurants/${fakeId}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Restaurant non trouvé');
    });
  });

  describe('POST /api/restaurants', () => {
    it('should create a new restaurant if user is authenticated and is an owner', async () => {
      const restaurantData = {
        name: 'New Restaurant',
        address: '789 New Street',
        location: {
          type: 'Point',
          coordinates: [48.8566, 2.3522]
        },
        cuisine: ['Italian', 'French']
      };

      const res = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${token}`)
        .send(restaurantData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Restaurant');
      expect(res.body.data.owner.toString()).toBe(ownerId.toString());

      // Sauvegarder l'ID pour les tests suivants
      restaurantId = res.body.data._id;
    });

    it('should return 401 if user is not authenticated', async () => {
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
        .send(restaurantData)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Non autorisé à accéder à cette route');
    });

    it('should return 400 if required fields are missing', async () => {
      const invalidData = {
        name: 'Invalid Restaurant'
        // Manque address et location
      };

      const res = await request(app)
        .post('/api/restaurants')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('PUT /api/restaurants/:id', () => {
    it('should update a restaurant if user is the owner', async () => {
      // Créer un restaurant pour le test
      const restaurant = await Restaurant.create({
        name: 'Restaurant to Update',
        address: '123 Update Street',
        location: {
          type: 'Point',
          coordinates: [48.8566, 2.3522]
        },
        owner: ownerId
      });

      const updateData = {
        name: 'Updated Restaurant Name',
        cuisine: ['Updated Cuisine']
      };

      const res = await request(app)
        .put(`/api/restaurants/${restaurant._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Restaurant Name');
      expect(res.body.data.cuisine).toEqual(['Updated Cuisine']);
    });

    it('should return 404 if restaurant not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .put(`/api/restaurants/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Not Found Restaurant' })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Restaurant non trouvé');
    });

    it('should return 401 if user is not authenticated', async () => {
      const restaurant = await Restaurant.create({
        name: 'Unauthorized Update',
        address: '123 Unauthorized Street',
        location: {
          type: 'Point',
          coordinates: [48.8566, 2.3522]
        },
        owner: ownerId
      });

      const res = await request(app)
        .put(`/api/restaurants/${restaurant._id}`)
        .send({ name: 'Unauthorized Update Attempt' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Non autorisé à accéder à cette route');
    });
  });

  describe('DELETE /api/restaurants/:id', () => {
    it('should delete a restaurant if user is the owner', async () => {
      // Créer un restaurant pour le test
      const restaurant = await Restaurant.create({
        name: 'Restaurant to Delete',
        address: '123 Delete Street',
        location: {
          type: 'Point',
          coordinates: [48.8566, 2.3522]
        },
        owner: ownerId
      });

      const res = await request(app)
        .delete(`/api/restaurants/${restaurant._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBe(null);

      // Vérifier que le restaurant a bien été supprimé
      const deletedRestaurant = await Restaurant.findById(restaurant._id);
      expect(deletedRestaurant).toBeNull();
    });

    it('should return 404 if restaurant not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .delete(`/api/restaurants/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Restaurant non trouvé');
    });

    it('should return 401 if user is not authenticated', async () => {
      const restaurant = await Restaurant.create({
        name: 'Unauthorized Delete',
        address: '123 Unauthorized Street',
        location: {
          type: 'Point',
          coordinates: [48.8566, 2.3522]
        },
        owner: ownerId
      });

      const res = await request(app)
        .delete(`/api/restaurants/${restaurant._id}`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Non autorisé à accéder à cette route');
    });
  });

  describe('GET /api/restaurants/radius/:zipcode/:distance', () => {
    it('should find restaurants within a given radius', async () => {
      try {
        // Créer des restaurants à différentes distances
        await Restaurant.create([
          {
            name: 'Paris Restaurant',
            address: 'Paris, France',
            location: {
              type: 'Point',
              coordinates: [2.3522, 48.8566] // Paris (longitude, latitude)
            },
            owner: ownerId
          },
          {
            name: 'Lyon Restaurant',
            address: 'Lyon, France',
            location: {
              type: 'Point',
              coordinates: [4.8357, 45.7640] // Lyon (longitude, latitude)
            },
            owner: ownerId
          }
        ]);
        console.log('Test restaurants created for radius search');

        // Rechercher les restaurants à moins de 100km de Paris (48.8566,2.3522)
        const res = await request(app)
          .get('/api/restaurants/radius/48.8566,2.3522/100')
          .expect(200);

        console.log('GET /api/restaurants/radius response:', res.body);

        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(1);
        expect(res.body.data[0].name).toBe('Paris Restaurant');
      } catch (error) {
        console.error('Radius test error:', error);
        throw error;
      }
    });
  });
});
