import request from 'supertest';
import app from '../../app.js';
import { setupDB, clearDB, closeDB } from '../db-test-utils.js';
import { createTestUser, createTestClient, createUserAndGetToken } from '../test-utils.js';

describe('Client API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    await setupDB();
  });

  beforeEach(async () => {
    // Nettoyer la base avant chaque test
    await clearDB();
    // Recréer l'utilisateur avant chaque test pour avoir un token valide
    const { user, token } = await createUserAndGetToken();
    
    if (!token) {
      throw new Error('Token is undefined or null');
    }
    
    if (!user || !user.id) {
      throw new Error('User is undefined or has no id');
    }
    
    authToken = token;
    userId = user.id;
  });

  afterAll(async () => {
    await clearDB();
    await closeDB();
  });

  describe('POST /api/clients', () => {
    it('should create a client successfully', async () => {
      const clientData = {
        name: 'New Client',
        type: 'company',
        contact_email: 'client@example.com',
        contact_phone: '0612345678',
        billing_address: '123 Main St',
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clientData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(clientData.name);
      expect(response.body.data.user_id).toBe(userId);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/clients')
        .send({ name: 'Test Client' });

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Client',
          contact_email: 'invalid-email',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'company',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/clients', () => {
    it('should get all clients for authenticated user', async () => {
      // Créer quelques clients
      await createTestClient(userId, { name: 'Client 1' });
      await createTestClient(userId, { name: 'Client 2' });

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/clients');

      expect(response.status).toBe(401);
    });

    it('should support pagination', async () => {
      await createTestClient(userId, { name: 'Client 1' });
      await createTestClient(userId, { name: 'Client 2' });

      const response = await request(app)
        .get('/api/clients?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should get a specific client', async () => {
      const client = await createTestClient(userId, { name: 'Specific Client' });

      const response = await request(app)
        .get(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(client.id);
      expect(response.body.data.name).toBe('Specific Client');
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .get('/api/clients/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/clients/1');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/clients/:id', () => {
    it('should update a client successfully', async () => {
      const client = await createTestClient(userId, { name: 'Original Name' });

      const response = await request(app)
        .put(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          contact_email: 'updated@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.contact_email).toBe('updated@example.com');
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .put('/api/clients/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('should delete a client successfully', async () => {
      const client = await createTestClient(userId, { name: 'To Delete' });

      const response = await request(app)
        .delete(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .delete('/api/clients/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});

