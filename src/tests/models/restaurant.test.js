const mongoose = require('mongoose');
const Restaurant = require('../../models/restaurant');
require('dotenv').config();

// Utiliser la base de données MongoDB Docker pour les tests
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyMeal_test');
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Restaurant Model Test', () => {
  beforeEach(async () => {
    // Nettoyer la collection avant chaque test
    await Restaurant.deleteMany({});
  });

  it('should create a new restaurant with valid data', async () => {
    const restaurantData = {
      name: 'Restaurant Test',
      address: '123 Test Street',
      location: {
        type: 'Point',
        coordinates: [48.8566, 2.3522] // Paris coordinates
      },
      phone: '+33123456789',
      email: 'test@restaurant.com',
      cuisine: ['French', 'Italian']
      // Nous ne définissons pas les heures d'ouverture car elles sont optionnelles
    };

    const restaurant = new Restaurant(restaurantData);
    const savedRestaurant = await restaurant.save();

    expect(savedRestaurant._id).toBeDefined();
    expect(savedRestaurant.name).toBe(restaurantData.name);
    expect(savedRestaurant.address).toBe(restaurantData.address);
    expect(savedRestaurant.location.coordinates).toEqual(restaurantData.location.coordinates);
    expect(savedRestaurant.cuisine).toEqual(expect.arrayContaining(restaurantData.cuisine));
  });

  it('should fail to create a restaurant without required fields', async () => {
    const invalidRestaurant = new Restaurant({ name: 'Invalid Restaurant' });
    
    let error;
    try {
      await invalidRestaurant.save();
    } catch (e) {
      error = e;
    }
    
    expect(error).toBeDefined();
    expect(error.errors.address).toBeDefined();
    expect(error.errors['location.coordinates']).toBeDefined();
  });

  it('should validate email format', async () => {
    const restaurantWithInvalidEmail = new Restaurant({
      name: 'Email Test Restaurant',
      address: '123 Test Street',
      location: {
        type: 'Point',
        coordinates: [48.8566, 2.3522]
      },
      phone: '+33123456789',
      email: 'invalid-email',
      owner: new mongoose.Types.ObjectId()
    });

    let error;
    try {
      await restaurantWithInvalidEmail.save();
    } catch (e) {
      error = e;
    }
    
    expect(error).toBeDefined();
    expect(error.errors.email).toBeDefined();
  });

  it('should validate opening hours', async () => {
    const restaurantWithInvalidOpeningHours = new Restaurant({
      name: 'Opening Hours Test Restaurant',
      address: '123 Test Street',
      location: {
        type: 'Point',
        coordinates: [48.8566, 2.3522]
      },
      phone: '+33123456789',
      email: 'test@restaurant.com',
      cuisine: ['French', 'Italian'],
      openingHours: {
        monday: { open: '25:00', close: '22:00' }
      },
      owner: new mongoose.Types.ObjectId()
    });

    let error;
    try {
      await restaurantWithInvalidOpeningHours.save();
    } catch (e) {
      error = e;
    }
    
    expect(error).toBeDefined();
    expect(error.errors['openingHours.monday.open']).toBeDefined();
  });

  it('should find restaurants nearby', async () => {
    // Créer quelques restaurants à différentes distances
    const parisRestaurant = new Restaurant({
      name: 'Paris Restaurant',
      address: 'Paris, France',
      location: {
        type: 'Point',
        coordinates: [48.8566, 2.3522] // Paris
      }
    });

    const lyonRestaurant = new Restaurant({
      name: 'Lyon Restaurant',
      address: 'Lyon, France',
      location: {
        type: 'Point',
        coordinates: [45.7640, 4.8357] // Lyon (environ 400km de Paris)
      }
    });

    await parisRestaurant.save();
    await lyonRestaurant.save();

    // Chercher les restaurants à moins de 100km de Paris
    const nearbyRestaurants = await Restaurant.findNearby([48.8566, 2.3522], 100000); // 100km en mètres
    
    expect(nearbyRestaurants.length).toBe(1);
    expect(nearbyRestaurants[0].name).toBe('Paris Restaurant');

    // Chercher les restaurants à moins de 500km de Paris (devrait inclure Lyon)
    const farRestaurants = await Restaurant.findNearby([48.8566, 2.3522], 500000); // 500km en mètres
    
    expect(farRestaurants.length).toBe(2);
  });
});
