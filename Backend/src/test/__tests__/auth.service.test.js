import authService from '../../services/auth.service.js';
import { setupDB, clearDB, closeDB } from '../db-test-utils.js';
import User from '../../models/user.js';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  beforeAll(async () => {
    await setupDB();
  });

  afterEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'service@example.com',
        password: 'password123',
        first_name: 'Service',
        last_name: 'Test',
      };

      const result = await authService.register(userData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      
      // Vérifier que l'utilisateur existe en base
      const userInDb = await User.findOne({ where: { email: userData.email } });
      expect(userInDb).toBeDefined();
      expect(userInDb.email).toBe(userData.email);
    });

    it('should hash the password', async () => {
      const userData = {
        email: 'hash@example.com',
        password: 'password123',
      };

      await authService.register(userData);

      const user = await User.findOne({ where: { email: userData.email } });
      expect(user.password_hash).not.toBe(userData.password);
      expect(user.password_hash.length).toBeGreaterThan(50);
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
      };

      await authService.register(userData);

      await expect(authService.register(userData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const email = 'login@example.com';
      const password = 'password123';
      
      // Créer un utilisateur
      await User.create({
        email,
        password_hash: await bcrypt.hash(password, 10),
        first_name: 'Test',
        last_name: 'User',
      });

      const result = await authService.login(email, password);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow();
    });

    it('should throw error for wrong password', async () => {
      const email = 'wrongpass@example.com';
      const password = 'password123';
      
      await User.create({
        email,
        password_hash: await bcrypt.hash(password, 10),
        first_name: 'Test',
        last_name: 'User',
      });

      await expect(
        authService.login(email, 'wrongpassword')
      ).rejects.toThrow();
    });
  });
});

