const mongoose = require('mongoose');
require('dotenv').config();

// Importer le modu00e8le Restaurant pour les ru00e9fu00e9rences
const Restaurant = require('../../models/restaurant');
const Dish = require('../../models/dish');

// Utiliser la base de donnu00e9es MongoDB Docker pour les tests
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyMeal_test');
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Dish Model Test', () => {
  beforeEach(async () => {
    // Nettoyer les collections avant chaque test
    await Dish.deleteMany({});
    await Restaurant.deleteMany({});
  });

  it('should create a new dish with valid data', async () => {
    // Cru00e9er d'abord un restaurant pour la ru00e9fu00e9rence
    const restaurant = new Restaurant({
      name: 'Test Restaurant',
      address: '123 Test Street',
      location: {
        type: 'Point',
        coordinates: [48.8566, 2.3522]
      }
    });
    await restaurant.save();

    const dishData = {
      name: 'Test Dish',
      description: 'A delicious test dish',
      price: 12.99,
      restaurant: restaurant._id,
      availableDate: new Date(),
      dietaryOptions: ['vegetarian', 'gluten-free'],
      image: 'dish.jpg',
      ingredients: ['Tomato', 'Basil', 'Mozzarella']
    };

    const dish = new Dish(dishData);
    const savedDish = await dish.save();

    expect(savedDish._id).toBeDefined();
    expect(savedDish.name).toBe(dishData.name);
    expect(savedDish.price).toBe(dishData.price);
    expect(savedDish.restaurant.toString()).toBe(restaurant._id.toString());
    expect(savedDish.dietaryOptions).toEqual(expect.arrayContaining(dishData.dietaryOptions));
  });

  it('should fail to create a dish without required fields', async () => {
    const invalidDish = new Dish({ name: 'Invalid Dish' });
    
    let error;
    try {
      await invalidDish.save();
    } catch (e) {
      error = e;
    }
    
    expect(error).toBeDefined();
    expect(error.errors.price).toBeDefined();
    expect(error.errors.restaurant).toBeDefined();
  });

  it('should validate price is positive', async () => {
    // Cru00e9er d'abord un restaurant pour la ru00e9fu00e9rence
    const restaurant = new Restaurant({
      name: 'Price Test Restaurant',
      address: '123 Test Street',
      location: {
        type: 'Point',
        coordinates: [48.8566, 2.3522]
      }
    });
    await restaurant.save();

    const dishWithNegativePrice = new Dish({
      name: 'Negative Price Dish',
      description: 'A dish with negative price',
      price: -5.99,
      restaurant: restaurant._id,
      availableDate: new Date()
    });

    let error;
    try {
      await dishWithNegativePrice.save();
    } catch (e) {
      error = e;
    }
    
    expect(error).toBeDefined();
    expect(error.errors.price).toBeDefined();
  });

  it('should find dishes by restaurant', async () => {
    // Cru00e9er deux restaurants
    const restaurant1 = new Restaurant({
      name: 'Restaurant 1',
      address: '123 Test Street',
      location: {
        type: 'Point',
        coordinates: [48.8566, 2.3522]
      }
    });

    const restaurant2 = new Restaurant({
      name: 'Restaurant 2',
      address: '456 Test Avenue',
      location: {
        type: 'Point',
        coordinates: [45.7640, 4.8357]
      }
    });

    await restaurant1.save();
    await restaurant2.save();

    // Cru00e9er des plats pour chaque restaurant
    const dish1 = new Dish({
      name: 'Dish 1',
      description: 'A dish from restaurant 1',
      price: 10.99,
      restaurant: restaurant1._id,
      availableDate: new Date()
    });

    const dish2 = new Dish({
      name: 'Dish 2',
      description: 'Another dish from restaurant 1',
      price: 12.99,
      restaurant: restaurant1._id,
      availableDate: new Date()
    });

    const dish3 = new Dish({
      name: 'Dish 3',
      description: 'A dish from restaurant 2',
      price: 9.99,
      restaurant: restaurant2._id,
      availableDate: new Date()
    });

    await dish1.save();
    await dish2.save();
    await dish3.save();

    // Trouver les plats du restaurant 1
    const restaurant1Dishes = await Dish.find({ restaurant: restaurant1._id });
    expect(restaurant1Dishes.length).toBe(2);

    // Trouver les plats du restaurant 2
    const restaurant2Dishes = await Dish.find({ restaurant: restaurant2._id });
    expect(restaurant2Dishes.length).toBe(1);
  });

  it('should find dishes by dietary options', async () => {
    // Cru00e9er un restaurant pour la ru00e9fu00e9rence
    const restaurant = new Restaurant({
      name: 'Dietary Options Test Restaurant',
      address: '123 Test Street',
      location: {
        type: 'Point',
        coordinates: [48.8566, 2.3522]
      }
    });
    await restaurant.save();

    // Cru00e9er des plats avec diffu00e9rentes options diu00e9tu00e9tiques
    const veganDish = new Dish({
      name: 'Vegan Dish',
      description: 'A vegan dish',
      price: 11.99,
      restaurant: restaurant._id,
      availableDate: new Date(),
      dietaryOptions: ['vegan', 'vegetarian']
    });

    const glutenFreeDish = new Dish({
      name: 'Gluten-Free Dish',
      description: 'A gluten-free dish',
      price: 13.99,
      restaurant: restaurant._id,
      availableDate: new Date(),
      dietaryOptions: ['gluten-free']
    });

    const regularDish = new Dish({
      name: 'Regular Dish',
      description: 'A regular dish',
      price: 9.99,
      restaurant: restaurant._id,
      availableDate: new Date()
    });

    await veganDish.save();
    await glutenFreeDish.save();
    await regularDish.save();

    // Trouver les plats vu00e9gu00e9tariens
    const vegetarianDishes = await Dish.find({ dietaryOptions: 'vegetarian' });
    expect(vegetarianDishes.length).toBe(1);
    expect(vegetarianDishes[0].name).toBe('Vegan Dish');

    // Trouver les plats sans gluten
    const glutenFreeDishes = await Dish.find({ dietaryOptions: 'gluten-free' });
    expect(glutenFreeDishes.length).toBe(1);
    expect(glutenFreeDishes[0].name).toBe('Gluten-Free Dish');
  });
});
