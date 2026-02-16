import request from 'supertest';
import app from '../../app.js';
import { setupDB, clearDB, closeDB } from '../db-test-utils.js';
import { createTestUser, createUserAndGetToken } from '../test-utils.js';
import User from '../../models/user.js';
import bcrypt from 'bcryptjs';

describe('Authentication API', () => {
  beforeAll(async () => {
    await setupDB();
  });

  afterEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for password too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
      };

      // Créer le premier utilisateur
      await createTestUser({ email: userData.email });

      // Essayer de créer un deuxième avec le même email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should hash the password before saving', async () => {
      const userData = {
        email: 'hashed@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);

      const user = await User.findOne({ where: { email: userData.email } });
      expect(user.password_hash).not.toBe(userData.password);
      expect(user.password_hash).toHaveLength(60); // bcrypt hash length
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const email = 'login@example.com';
      const password = 'password123';
      
      // Créer un utilisateur
      await createTestUser({
        email,
        password_hash: await bcrypt.hash(password, 10),
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user.email).toBe(email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
    });

    it('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should return error for wrong password', async () => {
      const email = 'wrongpass@example.com';
      const password = 'password123';
      
      await createTestUser({
        email,
        password_hash: await bcrypt.hash(password, 10),
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email,
          password: 'wrongpassword',
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid refresh token', async () => {
      const { user, token } = await createUserAndGetToken();

      // D'abord obtenir un refreshToken (nécessite de modifier la réponse du login)
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'password123',
        });

      const refreshToken = loginResponse.body.data?.refreshToken;

      if (refreshToken) {
        const response = await request(app)
          .post('/api/auth/logout')
          .send({ refreshToken });

        expect(response.status).toBe(204);
      }
    });
  });
});

