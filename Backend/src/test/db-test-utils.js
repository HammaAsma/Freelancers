import db from '../config/db.js';
import iniDb from '../../iniDb.js';

let dbInitialized = false;

export const setupDB = async () => {
  if (dbInitialized) return;
  
  try {
    // Créer la base de données de test si elle n'existe pas
    await iniDb.createDatabase();
    
    // Synchroniser les modèles
    await iniDb.loadModelsAndAssociations();
    
    // Synchroniser le schéma (force: true pour réinitialiser en test)
    await db.sync({ force: true });
    
    dbInitialized = true;
    console.log('✅ Test database setup completed');
  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    throw error;
  }
};

export const closeDB = async () => {
  try {
    await db.close();
    console.log('✅ Test database connection closed');
  } catch (error) {
    console.error('❌ Error closing database:', error);
  }
};

export const clearDB = async () => {
  try {
    // Supprimer toutes les données des tables dans l'ordre correct (en respectant les clés étrangères)
    const { RefreshToken, TimeEntry, InvoiceItem, Note, Task, Invoice, Project, Client, User } = db.models;
    
    // Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
    await RefreshToken.destroy({ where: {}, force: true });
    await TimeEntry.destroy({ where: {}, force: true });
    await InvoiceItem.destroy({ where: {}, force: true });
    await Note.destroy({ where: {}, force: true });
    await Task.destroy({ where: {}, force: true });
    await Invoice.destroy({ where: {}, force: true });
    await Project.destroy({ where: {}, force: true });
    await Client.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
};
