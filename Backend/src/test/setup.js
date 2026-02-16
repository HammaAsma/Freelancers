import { setupDB, closeDB } from './db-test-utils.js';

// Avant tous les tests
beforeAll(async () => {
  await setupDB();
}, 30000);

// Après tous les tests
afterAll(async () => {
  await closeDB();
}, 10000);