const request = require('supertest');
const mongoose = require('mongoose');
require('dotenv').config();

// Modèles nécessaires pour les tests
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

describe('User API Routes', () => {
  let token;
  let adminToken;
  let userId;
  let adminId;

  // Avant tous les tests, créer un utilisateur normal et un admin et obtenir leurs tokens
  beforeAll(async () => {
    // Nettoyer la collection
    await User.deleteMany({});

    // Créer un utilisateur normal
    const userData = {
      name: 'Test User',
      email: 'user@test.com',
      password: 'password123',
      role: 'user'
    };

    const user = await User.create(userData);
    userId = user._id;

    // Créer un admin
    const adminData = {
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    };

    const admin = await User.create(adminData);
    adminId = admin._id;

    // Obtenir les tokens JWT pour l'authentification
    token = user.getSignedJwtToken();
    adminToken = admin.getSignedJwtToken();
  });

  // Avant chaque test, nettoyer la collection d'utilisateurs sauf les deux créés dans beforeAll
  beforeEach(async () => {
    await User.deleteMany({ _id: { $nin: [userId, adminId] } });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@test.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.data.name).toBe('New User');
      expect(res.body.data.email).toBe('newuser@test.com');
      expect(res.body.data.password).toBeUndefined(); // Le mot de passe ne doit pas être retourné
    });

    it('should return 400 if required fields are missing', async () => {
      const userData = {
        name: 'Invalid User',
        email: 'invalid@test.com'
        // Mot de passe manquant
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 if email is already in use', async () => {
      const userData = {
        name: 'Duplicate User',
        email: 'user@test.com', // Email déjà utilisé
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login a user with valid credentials', async () => {
      const loginData = {
        email: 'user@test.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.data.name).toBe('Test User');
      expect(res.body.data.email).toBe('user@test.com');
    });

    it('should return 401 with invalid credentials', async () => {
      const loginData = {
        email: 'user@test.com',
        password: 'wrongpassword'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Identifiants invalides');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test User');
      expect(res.body.data.email).toBe('user@test.com');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Non autorisé à accéder à cette route');
    });
  });

  describe('PUT /api/auth/updatedetails', () => {
    it('should update user details when authenticated', async () => {
      const updateData = {
        name: 'Updated User',
        email: 'updated@test.com'
      };

      const res = await request(app)
        .put('/api/auth/updatedetails')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated User');
      expect(res.body.data.email).toBe('updated@test.com');
    });

    it('should return 401 if not authenticated', async () => {
      const updateData = {
        name: 'Unauthorized Update',
        email: 'unauthorized@test.com'
      };

      const res = await request(app)
        .put('/api/auth/updatedetails')
        .send(updateData)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Non autorisé à accéder à cette route');
    });
  });

  describe('PUT /api/auth/updatepassword', () => {
    it('should update user password when authenticated', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      };

      const res = await request(app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should return 401 if current password is incorrect', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const res = await request(app)
        .put('/api/auth/updatepassword')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Mot de passe incorrect');
    });
  });

  describe('GET /api/users', () => {
    it('should get all users if user is admin', async () => {
      // Créer quelques utilisateurs supplémentaires pour le test
      await User.create([
        {
          name: 'User 1',
          email: 'user1@test.com',
          password: 'password123'
        },
        {
          name: 'User 2',
          email: 'user2@test.com',
          password: 'password123'
        }
      ]);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4); // 2 utilisateurs créés dans beforeAll + 2 créés ici
    });

    it('should return 403 if user is not admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('n\'est pas autorisé');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get a single user by ID if user is admin', async () => {
      const res = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(userId.toString());
    });

    it('should return 403 if user is not admin', async () => {
      const res = await request(app)
        .get(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('n\'est pas autorisé');
    });

    it('should return 404 if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Utilisateur non trouvé');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update a user if user is admin', async () => {
      const updateData = {
        name: 'Admin Updated User',
        role: 'owner'
      };

      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Admin Updated User');
      expect(res.body.data.role).toBe('owner');
    });

    it('should return 403 if user is not admin', async () => {
      const updateData = {
        name: 'Unauthorized Update',
        role: 'admin'
      };

      const res = await request(app)
        .put(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('n\'est pas autorisé');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user if user is admin', async () => {
      // Créer un utilisateur à supprimer
      const deleteUser = await User.create({
        name: 'User to Delete',
        email: 'delete@test.com',
        password: 'password123'
      });

      const res = await request(app)
        .delete(`/api/users/${deleteUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBe(null);

      // Vérifier que l'utilisateur a été supprimé
      const deletedUser = await User.findById(deleteUser._id);
      expect(deletedUser).toBeNull();
    });

    it('should return 403 if user is not admin', async () => {
      const res = await request(app)
        .delete(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('n\'est pas autorisé');
    });
  });
});
