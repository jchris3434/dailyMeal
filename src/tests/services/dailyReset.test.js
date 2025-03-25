const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Dish = require('../../models/dish');
const Restaurant = require('../../models/restaurant');
const { resetDailyDishes } = require('../../services/dailyReset');

let mongoServer;

// Configuration de la base de données en mémoire pour les tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

// Nettoyage après tous les tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Nettoyage après chaque test
afterEach(async () => {
  await Dish.deleteMany({});
  await Restaurant.deleteMany({});
});

describe('Service de réinitialisation quotidienne', () => {
  it('devrait marquer les plats de la veille comme non disponibles', async () => {
    // Créer un restaurant pour les tests
    const restaurant = await Restaurant.create({
      name: 'Restaurant Test',
      address: '123 Test Street',
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    });

    // Date d'aujourd'hui à minuit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Date d'hier à minuit
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Créer des plats disponibles hier
    await Dish.create({
      name: 'Plat Test 1 (hier)',
      price: 10.99,
      restaurant: restaurant._id,
      availableDate: yesterday,
      isAvailable: true
    });

    await Dish.create({
      name: 'Plat Test 2 (hier)',
      price: 12.99,
      restaurant: restaurant._id,
      availableDate: yesterday,
      isAvailable: true
    });

    // Créer un plat disponible aujourd'hui
    await Dish.create({
      name: 'Plat Test 3 (aujourd\'hui)',
      price: 14.99,
      restaurant: restaurant._id,
      availableDate: today,
      isAvailable: true
    });

    // Date de demain
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Créer un plat programmé pour demain
    await Dish.create({
      name: 'Plat Test 4 (demain)',
      price: 16.99,
      restaurant: restaurant._id,
      availableDate: tomorrow,
      isAvailable: true
    });

    // Exécuter la réinitialisation quotidienne
    const result = await resetDailyDishes();

    // Vérifier que la réinitialisation a réussi
    expect(result.success).toBe(true);
    expect(result.modifiedCount).toBe(2); // 2 plats d'hier ont été modifiés

    // Vérifier que les plats d'hier sont marqués comme non disponibles
    const yesterdayDishes = await Dish.find({ 
      availableDate: { $gte: yesterday, $lt: today }
    });
    expect(yesterdayDishes.length).toBe(2);
    yesterdayDishes.forEach(dish => {
      expect(dish.isAvailable).toBe(false);
    });

    // Vérifier que les plats d'aujourd'hui sont toujours disponibles
    const todayDishes = await Dish.find({ 
      availableDate: { $gte: today, $lt: tomorrow }
    });
    expect(todayDishes.length).toBe(1);
    expect(todayDishes[0].isAvailable).toBe(true);

    // Vérifier que les plats programmés pour demain sont toujours disponibles
    const tomorrowDishes = await Dish.find({ 
      availableDate: { $gte: tomorrow }
    });
    expect(tomorrowDishes.length).toBe(1);
    expect(tomorrowDishes[0].isAvailable).toBe(true);
  });

  it('ne devrait pas modifier les plats déjà marqués comme non disponibles', async () => {
    // Créer un restaurant pour les tests
    const restaurant = await Restaurant.create({
      name: 'Restaurant Test',
      address: '123 Test Street',
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    });

    // Date d'aujourd'hui à minuit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Date d'hier à minuit
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Créer un plat non disponible d'hier
    await Dish.create({
      name: 'Plat Test Non Disponible',
      price: 10.99,
      restaurant: restaurant._id,
      availableDate: yesterday,
      isAvailable: false
    });

    // Exécuter la réinitialisation quotidienne
    const result = await resetDailyDishes();

    // Vérifier que la réinitialisation a réussi
    expect(result.success).toBe(true);
    expect(result.modifiedCount).toBe(0); // Aucun plat n'a été modifié

    // Vérifier que le plat est toujours marqué comme non disponible
    const dishes = await Dish.find({ name: 'Plat Test Non Disponible' });
    expect(dishes.length).toBe(1);
    expect(dishes[0].isAvailable).toBe(false);
  });

  it('ne devrait pas affecter les plats des jours précédents qui sont déjà non disponibles', async () => {
    // Créer un restaurant pour les tests
    const restaurant = await Restaurant.create({
      name: 'Restaurant Test',
      address: '123 Test Street',
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    });

    // Date d'aujourd'hui à minuit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Date d'il y a 2 jours
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Créer un plat d'il y a 2 jours
    await Dish.create({
      name: 'Plat Test Ancien',
      price: 10.99,
      restaurant: restaurant._id,
      availableDate: twoDaysAgo,
      isAvailable: false
    });

    // Exécuter la réinitialisation quotidienne
    const result = await resetDailyDishes();

    // Vérifier que la réinitialisation a réussi
    expect(result.success).toBe(true);
    expect(result.modifiedCount).toBe(0); // Aucun plat n'a été modifié

    // Vérifier que le plat ancien est toujours marqué comme non disponible
    const dishes = await Dish.find({ name: 'Plat Test Ancien' });
    expect(dishes.length).toBe(1);
    expect(dishes[0].isAvailable).toBe(false);
  });
});
