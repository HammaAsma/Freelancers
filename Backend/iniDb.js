import { Sequelize } from "sequelize";
import bcrypt from "bcryptjs";
import ENV from "./src/config/index.js";
import db from "./src/config/db.js";

const SEED_PASSWORD = "Password123!"; // Mot de passe de test pour tous les utilisateurs seed
// ********************************************************************
// 1. CREATE DATABASE
async function createDatabase() {
  console.log(`🔍 Checking if database '${ENV.DATABASE}' exists...`);

  const adminDb = new Sequelize({
    host: ENV.HOST,
    dialect: ENV.DIALECT,
    port: ENV.PORT_DATABASE,
    username: ENV.USER,
    password: ENV.PASSWORD,
    logging: false,
  });

  try {
    const query = `CREATE DATABASE IF NOT EXISTS \`${ENV.DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;
    await adminDb.query(query);
    console.log(`✅ Database '${ENV.DATABASE}' ready`);
  } finally {
    await adminDb.close();
  }
}

// *********************************************************************
// 2. INITIALIZE SEQUELIZE & MODELS
async function initializeDatabase() {
  const db = new Sequelize(ENV.DATABASE, ENV.USER, ENV.PASSWORD, {
    host: ENV.HOST,
    dialect: ENV.DIALECT,
    port: ENV.PORT_DATABASE,
    logging: false,
  });

  try {
    await db.authenticate();
    console.log("✅ Connected to database");
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    throw error;
  }

  return db;
}

// *********************************************************************
// 3. IMPORT MODELS & SETUP ASSOCIATIONS
async function loadModelsAndAssociations() {
  // Importer les modèles
  const models = {
    User: (await import("./src/models/user.js")).default,
    Client: (await import("./src/models/client.model.js")).default,
    Project: (await import("./src/models/project.model.js")).default,
    Invoice: (await import("./src/models/invoice.model.js")).default,
    InvoiceItem: (await import("./src/models/invoiceItem.model.js")).default,
    Note: (await import("./src/models/note.model.js")).default,
    RefreshToken: (await import("./src/models/refreshToken.model.js")).default,
    Task: (await import("./src/models/task.model.js")).default,
    TimeEntry: (await import("./src/models/timeEntry.model.js")).default,
  };

  // Enregistrer les modèles dans l'instance Sequelize
  Object.entries(models).forEach(([name, model]) => {
    db.models[name] = model;
  });

  console.log("📊 MODÈLES ENREGISTRÉS:", Object.keys(db.models));
  console.log("✅", Object.keys(models).length, "modèles chargés");

  // Récupérer les modèles depuis l'instance de base de données
  const {
    User,
    Client,
    Project,
    Invoice,
    InvoiceItem,
    Note,
    RefreshToken,
    Task,
    TimeEntry,
  } = db.models;

  // ****************************************************************
  // ASSOCIATIONS (Relations)
  console.log("🔗 Setting up model associations...");

  // Users <-> Clients
  User.hasMany(Client, { foreignKey: "user_id", onDelete: "CASCADE" });
  Client.belongsTo(User, { foreignKey: "user_id" });

  // Users <-> Projects
  User.hasMany(Project, { foreignKey: "user_id" });
  Project.belongsTo(User, { foreignKey: "user_id" });

  // Clients <-> Projects
  Client.hasMany(Project, { foreignKey: "client_id" });
  Project.belongsTo(Client, { foreignKey: "client_id" });

  // Users / Clients <-> Invoices
  User.hasMany(Invoice, { foreignKey: "user_id" });
  Invoice.belongsTo(User, { foreignKey: "user_id" });

  Client.hasMany(Invoice, { foreignKey: "client_id" });
  Invoice.belongsTo(Client, { foreignKey: "client_id" });

  // Invoice -> InvoiceItems
  Invoice.hasMany(InvoiceItem, { foreignKey: "invoice_id" });
  InvoiceItem.belongsTo(Invoice, { foreignKey: "invoice_id" });

  // Project -> InvoiceItems
  Project.hasMany(InvoiceItem, { foreignKey: "project_id" });
  InvoiceItem.belongsTo(Project, { foreignKey: "project_id" });

  // Projects -> Tasks
  Project.hasMany(Task, { foreignKey: "project_id" });
  Task.belongsTo(Project, { foreignKey: "project_id" });

  // Tasks / Projects / Users -> TimeEntries
  Task.hasMany(TimeEntry, { foreignKey: "task_id" });
  TimeEntry.belongsTo(Task, { foreignKey: "task_id" });

  Project.hasMany(TimeEntry, { foreignKey: "project_id" });
  TimeEntry.belongsTo(Project, { foreignKey: "project_id" });

  User.hasMany(TimeEntry, { foreignKey: "user_id" });
  TimeEntry.belongsTo(User, { foreignKey: "user_id" });

  // TimeEntry -> Invoice (optional)
  Invoice.hasMany(TimeEntry, { foreignKey: "invoice_id" });
  TimeEntry.belongsTo(Invoice, { foreignKey: "invoice_id" });

  // Refresh tokens
  User.hasMany(RefreshToken, { foreignKey: "user_id" });
  RefreshToken.belongsTo(User, { foreignKey: "user_id" });

  // Notes
  User.hasMany(Note, { foreignKey: "user_id" });
  Note.belongsTo(User, { foreignKey: "user_id" });

  Client.hasMany(Note, { foreignKey: "client_id" });
  Note.belongsTo(Client, { foreignKey: "client_id" });

  Project.hasMany(Note, { foreignKey: "project_id" });
  Note.belongsTo(Project, { foreignKey: "project_id" });

  console.log("✅ Associations configured");

  return db;
}

// ****************************************************************
// 4. SYNC DATABASE SCHEMA
async function syncDatabase(db) {
  try {
    console.log("📋 Synchronizing database schema...");
    // Utiliser alter: false pour éviter les problèmes d'index multiples
    // En développement, on peut utiliser force: false pour préserver les données
    await db.sync({ alter: false, force: false });
    console.log("✅ All tables synchronized successfully!");
    console.log(
      "⚠️ Note: Si vous modifiez les modèles, utilisez des migrations Sequelize CLI"
    );
  } catch (error) {
    console.error("❌ Error syncing database:", error.message);
    // Si l'erreur est liée aux index, proposer une solution
    if (error.original && error.original.errno === 1069) {
      console.error("\n⚠️ Trop d'index sur une table. Solutions:");
      console.error(
        "1. Supprimer manuellement les index en double dans la base"
      );
      console.error(
        "2. Utiliser 'force: true' pour recréer les tables (⚠️ PERD LES DONNÉES)"
      );
      console.error(
        "3. Utiliser Sequelize migrations pour gérer les changements de schéma"
      );
    }
    throw error;
  }
}

// *************************************************************
// 5. SEED DATA
// *************************************************************
// 5. SEED DATA
async function seedDatabase(db) {
  if (process.env.NODE_ENV === "production") {
    console.log("⏭️  Skipping seed in production environment");
    return;
  }

  const {
    User,
    Client,
    Project,
    Task,
    TimeEntry,
    Invoice,
    InvoiceItem,
    Note,
    RefreshToken,
  } = db.models;

  console.log("🌱 Seeding test data...");

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  try {
    // 1. USERS (mot de passe de test : Password123!)
    await User.bulkCreate(
      [
        {
          id: 1,
          email: "admin@test.com",
          password_hash: passwordHash,
          first_name: "Admin",
          last_name: "User",
          currency: "EUR",
          company_name: "Ma Société",
          address: "Paris, France",
        },
        {
          id: 2,
          email: "dev@test.com",
          password_hash: passwordHash,
          first_name: "Développeur",
          last_name: "Test",
          currency: "MAD",
          company_name: "Dev Morocco",
          address: "Casablanca",
        },
      ],
      { ignoreDuplicates: true }
    );
    console.log("✅ 2 utilisateurs créés (mot de passe test : " + SEED_PASSWORD + ")");

    // 2. CLIENTS
    await Client.bulkCreate(
      [
        {
          id: 1,
          name: "Client Premium SARL",
          type: "company",
          contact_email: "contact@premium.ma",
          contact_phone: "+212600123456",
          billing_address: "Casablanca, Maroc",
          user_id: 1,
        },
        {
          id: 2,
          name: "Startup Tech",
          type: "individual",
          contact_email: "info@startup.ma",
          contact_phone: "+212661234567",
          billing_address: "Rabat, Maroc",
          user_id: 1,
        },
        {
          id: 3,
          name: "Agence Marketing",
          type: "company",
          contact_email: "hello@agence.ma",
          contact_phone: "+212612345678",
          billing_address: "Marrakech, Maroc",
          user_id: 2,
        },
        {
          id: 4,
          name: "Entreprise Delta",
          type: "company",
          contact_email: "contact@delta.fr",
          contact_phone: "+33612345678",
          billing_address: "Lyon, France",
          user_id: 1,
        },
        {
          id: 5,
          name: "Jean Dupont",
          type: "individual",
          contact_email: "jean.dupont@email.com",
          contact_phone: "+33698765432",
          billing_address: "Paris, France",
          user_id: 1,
        },
      ],
      { ignoreDuplicates: true }
    );
    console.log("✅ 5 clients créés");

    // 3. PROJETS
    await Project.bulkCreate(
      [
        {
          id: 1,
          name: "Site E-commerce",
          description: "Développement boutique en ligne React/Node",
          status: "active",
          user_id: 1,
          client_id: 1,
        },
        {
          id: 2,
          name: "API Facturation",
          description: "Système de gestion factures",
          status: "completed",
          user_id: 2,
          client_id: 3,
        },
        {
          id: 3,
          name: "App Mobile",
          description: "Application de gestion de projets",
          status: "on_hold",
          user_id: 1,
          client_id: 2,
        },
        {
          id: 4,
          name: "Refonte site vitrine",
          description: "Nouveau design et SEO",
          status: "active",
          user_id: 1,
          client_id: 4,
        },
        {
          id: 5,
          name: "Audit technique",
          description: "Audit de l'infrastructure et recommandations",
          status: "completed",
          user_id: 1,
          client_id: 5,
        },
      ],
      { ignoreDuplicates: true }
    );
    console.log("✅ 5 projets créés");

    // 4. TÂCHES
    await Task.bulkCreate(
      [
        { id: 1, project_id: 1, title: "Développer catalogue produits", description: "Interface React avec pagination et filtre", status: "in_progress", priority: "high", estimated_hours: 20 },
        { id: 2, project_id: 1, title: "Implémenter panier et checkout", description: "Gestion panier + Stripe/Node.js", status: "todo", priority: "high", estimated_hours: 25 },
        { id: 3, project_id: 2, title: "CRUD factures API", description: "Endpoints Express + validation", status: "completed", priority: "medium", estimated_hours: 15 },
        { id: 4, project_id: 2, title: "Génération PDF factures", description: "Puppeteer + templates HTML", status: "completed", priority: "low", estimated_hours: 8 },
        { id: 5, project_id: 3, title: "Design UI/UX React Native", description: "Wireframes + prototypes Figma", status: "todo", priority: "medium", estimated_hours: 12 },
        { id: 6, project_id: 3, title: "Backend Firebase sync", description: "Authentification + realtime DB", status: "on_hold", priority: "high", estimated_hours: 18 },
        { id: 7, project_id: 4, title: "Maquettes homepage", description: "Figma desktop et mobile", status: "in_progress", priority: "high", estimated_hours: 10 },
        { id: 8, project_id: 4, title: "Intégration et responsive", description: "HTML/CSS/JS", status: "todo", priority: "medium", estimated_hours: 16 },
        { id: 9, project_id: 5, title: "Rapport d'audit", description: "Rédaction et livrable PDF", status: "completed", priority: "high", estimated_hours: 8 },
      ],
      { ignoreDuplicates: true }
    );
    console.log("✅ 9 tâches créées");

    // 5. TIME ENTRIES (pour tester ton timer + stats)
    // On simule quelques entrées de temps déjà terminées, plus une active
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const oneHour = 60 * 60;

    await TimeEntry.bulkCreate(
      [
        {
          id: 1,
          user_id: 1,
          task_id: 1,
          start_time: new Date(now.getTime() - 3 * 3600000),
          end_time: new Date(now.getTime() - 2 * 3600000),
          duration: oneHour,
          is_running: false,
        },
        {
          id: 2,
          user_id: 1,
          task_id: 1,
          start_time: new Date(now.getTime() - 2 * 3600000),
          end_time: new Date(now.getTime() - 3600000),
          duration: oneHour,
          is_running: false,
        },
        {
          id: 3,
          user_id: 2,
          task_id: 3,
          start_time: new Date(now.getTime() - 5 * 3600000),
          end_time: new Date(now.getTime() - 4 * 3600000),
          duration: oneHour,
          is_running: false,
        },
        {
          id: 5,
          user_id: 1,
          task_id: 7,
          start_time: new Date(startOfMonth.getTime() + 2 * 24 * 3600000),
          end_time: new Date(startOfMonth.getTime() + 2 * 24 * 3600000 + 4 * 3600000),
          duration: 4 * oneHour,
          is_running: false,
        },
        // Exemple d’entry ACTIVE (end_time null)
        {
          id: 6,
          user_id: 1,
          task_id: 2,
          start_time: new Date(now.getTime() - 20 * 60000),
          end_time: null,
          duration: null,
          is_running: true,
        },
      ],
      { ignoreDuplicates: true }
    );
    console.log("✅ Time entries créées");

    // 6. INVOICES (champ number + currency EUR/MAD/USD)
    const now2 = new Date();
    await Invoice.bulkCreate(
      [
        {
          id: 1,
          user_id: 2,
          client_id: 3,
          project_id: 2,
          number: "FAC-2025-0001",
          type: "project",
          issue_date: new Date(now2.getFullYear(), now2.getMonth(), 1),
          due_date: new Date(now2.getFullYear(), now2.getMonth(), 15),
          status: "paid",
          currency: "EUR",
          total_ht: 1200,
          total_tva: 240,
          total_ttc: 1440,
        },
        {
          id: 2,
          user_id: 1,
          client_id: 1,
          project_id: 1,
          number: "FAC-2025-0002",
          type: "project",
          issue_date: new Date(now2.getFullYear(), now2.getMonth(), 5),
          due_date: new Date(now2.getFullYear(), now2.getMonth(), 20),
          status: "sent",
          currency: "EUR",
          total_ht: 800,
          total_tva: 160,
          total_ttc: 960,
        },
        {
          id: 3,
          user_id: 1,
          client_id: 4,
          project_id: 5,
          number: "FAC-2025-0003",
          type: "project",
          issue_date: new Date(now2.getFullYear(), now2.getMonth(), 10),
          due_date: new Date(now2.getFullYear(), now2.getMonth(), 25),
          status: "paid",
          currency: "EUR",
          total_ht: 600,
          total_tva: 120,
          total_ttc: 720,
        },
      ],
      { ignoreDuplicates: true }
    );
    console.log("✅ 3 factures créées");

    // 7. INVOICE ITEMS (champ total)
    await InvoiceItem.bulkCreate(
      [
        { id: 1, invoice_id: 1, project_id: 2, description: "Développement CRUD factures API", Nb_heure: 20, unit_price: 50, total: 1000 },
        { id: 2, invoice_id: 1, project_id: 2, description: "Génération PDF et intégration", Nb_heure: 4, unit_price: 50, total: 240 },
        { id: 3, invoice_id: 2, project_id: 1, description: "Intégration front catalogue produits", Nb_heure: 16, unit_price: 50, total: 960 },
        { id: 4, invoice_id: 3, project_id: 5, description: "Audit technique et rapport", Nb_heure: 12, unit_price: 50, total: 720 },
      ],
      { ignoreDuplicates: true }
    );
    console.log("✅ Lignes de facture créées");

    // 8. NOTES
    await Note.bulkCreate(
      [
        { id: 1, user_id: 1, client_id: 1, project_id: 1, title: "Kickoff projet e-commerce", content: "Appel avec le client, validation du scope et des deadlines." },
        { id: 2, user_id: 1, client_id: 1, project_id: 1, title: "Retour sur maquette", content: "Le client préfère une home plus minimaliste, à mettre à jour dans Figma." },
        { id: 3, user_id: 2, client_id: 3, project_id: 2, title: "Test de génération PDF", content: "PDF validé avec logo et tableau de lignes." },
        { id: 4, user_id: 1, client_id: 4, project_id: 4, title: "Brief refonte", content: "Objectifs : moderniser le design et améliorer le SEO." },
        { id: 5, user_id: 1, client_id: 5, project_id: 5, title: "Livrable audit", content: "Rapport remis, client satisfait des recommandations." },
      ],
      { ignoreDuplicates: true }
    );
    console.log("✅ 5 notes créées");

    console.log("🌱 Seed terminé avec succès !");
  } catch (error) {
    console.log("⚠️ Données de test déjà présentes ou erreur:", error.message);
  }
}

// FONCTION PRINCIPALE

export default {
  syncDatabase,
  loadModelsAndAssociations,
  createDatabase,
  initializeDatabase,
  seedDatabase,
};

// Auto-exécuter
if (import.meta.url === `file://${process.argv[1]}`) {
  initDb();
}
