import request from 'supertest';
import app from '../app.js';
import User from '../models/user.js';
import Client from '../models/client.model.js';
import Project from '../models/project.model.js';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';

/**
 * Crée un utilisateur de test
 */
export const createTestUser = async (userData = {}) => {
  const defaultData = {
    email: `test-${Date.now()}@example.com`,
    password_hash: await bcrypt.hash('password123', 10),
    first_name: 'Test',
    last_name: 'User',
    currency: 'EUR',
    company_name: 'Test Company',
  };

  return User.create({ ...defaultData, ...userData });
};

/**
 * Crée un client de test
 */
export const createTestClient = async (userId, clientData = {}) => {
  const defaultData = {
    name: 'Test Client',
    type: 'company',
    contact_email: `client-${Date.now()}@example.com`,
    contact_phone: '0612345678',
    billing_address: '123 Test Street',
    user_id: userId,
  };

  return Client.create({ ...defaultData, ...clientData });
};

/**
 * Crée un projet de test
 */
export const createTestProject = async (userId, clientId, projectData = {}) => {
  const defaultData = {
    name: 'Test Project',
    description: 'Test Description',
    status: 'active',
    user_id: userId,
    client_id: clientId,
  };

  return Project.create({ ...defaultData, ...projectData });
};

/**
 * Obtient un token d'authentification
 */
export const getAuthToken = async (email, password = 'password123') => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  if (res.status === 200 && res.body.success && res.body.data) {
    return res.body.data.accessToken;
  }
  
  throw new Error('Failed to get auth token');
};

/**
 * Crée un utilisateur et obtient son token
 */
export const createUserAndGetToken = async (userData = {}) => {
  const password = userData.password || 'password123';
  
  // Créer l'utilisateur via l'API register pour obtenir directement le token
  const email = userData.email || `test-${Date.now()}@example.com`;
  
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password,
      first_name: userData.first_name || 'Test',
      last_name: userData.last_name || 'User',
      ...userData
    });
  
  if (registerRes.status === 201 && registerRes.body.success && registerRes.body.data) {
    const accessToken = registerRes.body.data.accessToken;
    const user = registerRes.body.data.user;
    
    if (!accessToken) {
      throw new Error('AccessToken not found in register response');
    }
    
    if (!user) {
      throw new Error('User not found in register response');
    }
    
    return {
      user,
      token: accessToken,
    };
  }
  
  // Fallback: créer directement en base et obtenir le token via login
  const user = await createTestUser({
    ...userData,
    email,
    password_hash: await bcrypt.hash(password, 10),
  });
  
  const token = await getAuthToken(email, password);
  return { user, token };
};

/**
 * Fait une requête authentifiée
 */
export const authenticatedRequest = (method, url) => {
  return {
    withAuth: async (token) => {
      return request(app)[method.toLowerCase()](url)
        .set('Authorization', `Bearer ${token}`);
    }
  };
};
