const request = require('supertest');
const mongoose = require('mongoose');
require('dotenv').config();

// Modu00e8les nu00e9cessaires pour les tests
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

// Fonction pour du00e9boguer les erreurs
const logError = (err) => {
  console.log('DEBUG ERROR:', err);
};

describe('Authentication API', () => {
  // Avant chaque test, nettoyer la collection d'utilisateurs
  beforeEach(async () => {
    try {
      await User.deleteMany({});
    } catch (err) {
      logError(err);
      throw err;
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with role user', async () => {
      try {
        const userData = {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        };

        const res = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.user).toBeDefined();
        expect(res.body.user.role).toBe('user');
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should register a new user with role owner', async () => {
      try {
        const userData = {
          name: 'Test Owner',
          email: 'owner@example.com',
          password: 'password123',
          role: 'owner'
        };

        const res = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.user).toBeDefined();
        expect(res.body.user.role).toBe('owner');
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should not register a user with an existing email', async () => {
      try {
        // Cru00e9er un utilisateur
        await User.create({
          name: 'Existing User',
          email: 'existing@example.com',
          password: 'password123'
        });

        // Essayer de cru00e9er un autre utilisateur avec le mu00eame email
        const userData = {
          name: 'Another User',
          email: 'existing@example.com',
          password: 'password123'
        };

        const res = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(res.body.success).toBe(false);
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should not register a user with invalid data', async () => {
      try {
        const userData = {
          name: 'Test User',
          email: 'invalid-email',
          password: 'pass' // Trop court
        };

        const res = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(res.body.success).toBe(false);
      } catch (err) {
        logError(err);
        throw err;
      }
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login an existing user', async () => {
      try {
        // Cru00e9er un utilisateur
        await User.create({
          name: 'Login User',
          email: 'login@example.com',
          password: 'password123'
        });

        // Connecter l'utilisateur
        const loginData = {
          email: 'login@example.com',
          password: 'password123'
        };

        const res = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.user).toBeDefined();
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should not login with incorrect password', async () => {
      try {
        // Cru00e9er un utilisateur
        await User.create({
          name: 'Password User',
          email: 'password@example.com',
          password: 'password123'
        });

        // Essayer de connecter avec un mauvais mot de passe
        const loginData = {
          email: 'password@example.com',
          password: 'wrongpassword'
        };

        const res = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);

        expect(res.body.success).toBe(false);
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should not login with non-existent email', async () => {
      try {
        const loginData = {
          email: 'nonexistent@example.com',
          password: 'password123'
        };

        const res = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);

        expect(res.body.success).toBe(false);
      } catch (err) {
        logError(err);
        throw err;
      }
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get the current user profile', async () => {
      try {
        // Cru00e9er un utilisateur
        const user = await User.create({
          name: 'Profile User',
          email: 'profile@example.com',
          password: 'password123'
        });

        // Gu00e9nu00e9rer un token
        const token = user.getSignedJwtToken();

        // Obtenir le profil
        const res = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
        expect(res.body.data.email).toBe('profile@example.com');
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should not access profile without token', async () => {
      try {
        const res = await request(app)
          .get('/api/auth/me')
          .expect(401);

        expect(res.body.success).toBe(false);
      } catch (err) {
        logError(err);
        throw err;
      }
    });
  });

  describe('PUT /api/auth/updatedetails', () => {
    it('should update user details', async () => {
      try {
        // Cru00e9er un utilisateur
        const user = await User.create({
          name: 'Update User',
          email: 'update@example.com',
          password: 'password123'
        });

        // Gu00e9nu00e9rer un token
        const token = user.getSignedJwtToken();

        // Mettre u00e0 jour les du00e9tails
        const updateData = {
          name: 'Updated Name',
          phone: '+33123456789'
        };

        const res = await request(app)
          .put('/api/auth/updatedetails')
          .set('Authorization', `Bearer ${token}`)
          .send(updateData)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
        expect(res.body.data.name).toBe('Updated Name');
        expect(res.body.data.phone).toBe('+33123456789');
      } catch (err) {
        logError(err);
        throw err;
      }
    });
  });

  describe('PUT /api/auth/updatepassword', () => {
    it('should update user password', async () => {
      try {
        // Cru00e9er un utilisateur
        const user = await User.create({
          name: 'Password Update User',
          email: 'passwordupdate@example.com',
          password: 'password123'
        });

        // Gu00e9nu00e9rer un token
        const token = user.getSignedJwtToken();

        // Mettre u00e0 jour le mot de passe
        const updateData = {
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        };

        const res = await request(app)
          .put('/api/auth/updatepassword')
          .set('Authorization', `Bearer ${token}`)
          .send(updateData)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();

        // Vu00e9rifier que le nouveau mot de passe fonctionne
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'passwordupdate@example.com',
            password: 'newpassword123'
          })
          .expect(200);

        expect(loginRes.body.success).toBe(true);
      } catch (err) {
        logError(err);
        throw err;
      }
    });

    it('should not update password with incorrect current password', async () => {
      try {
        // Cru00e9er un utilisateur
        const user = await User.create({
          name: 'Password Fail User',
          email: 'passwordfail@example.com',
          password: 'password123'
        });

        // Gu00e9nu00e9rer un token
        const token = user.getSignedJwtToken();

        // Essayer de mettre u00e0 jour avec un mauvais mot de passe actuel
        const updateData = {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        };

        const res = await request(app)
          .put('/api/auth/updatepassword')
          .set('Authorization', `Bearer ${token}`)
          .send(updateData)
          .expect(401);

        expect(res.body.success).toBe(false);
      } catch (err) {
        logError(err);
        throw err;
      }
    });
  });
});
