import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import ENV from "./config/index.js";
import iniDb from "../iniDb.js";
import db from "./config/db.js";

import { requestLogger } from "./middlewares/logger.js";
import errorHandler from "./middlewares/errorHandler.js";

import refreshTokenRoutes from "./routes/refreshToken.route.js";
import userRoutes from "./routes/user.route.js";
import clientRoutes from "./routes/client.route.js";
import projectRoutes from "./routes/projet.route.js";
import invoiceRoutes from "./routes/invoice.route.js";
import invoiceItemRoutes from "./routes/invoiceItem.route.js";
import taskRoutes from "./routes/task.route.js";
import noteRoutes from "./routes/note.route.js";
import timeEntryRoutes from "./routes/timeEntry.route.js";
import authRoutes from "./routes/auth.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";

import { swaggerUi, swaggerSpec } from "../swagger.js";

const app = express();

// ============================================
// MIDDLEWARES DE SÉCURITÉ (AVANT TOUT)
// ============================================

// Helmet pour les headers de sécurité
app.use(helmet());

// CORS configuré

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: {
    success: false,
    message: "Trop de requêtes depuis cette IP, veuillez réessayer plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Rate limiting strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par IP
  message: {
    success: false,
    message:
      "Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.",
  },
  skipSuccessfulRequests: true, // Ne pas compter les succès
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ============================================
// MIDDLEWARES GÉNÉRAUX
// ============================================

// Logger (avant les routes pour capturer toutes les requêtes)
app.use(requestLogger);

// Body parser avec limite
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================
// ROUTES
// ============================================

app.use("/api/auth", authRoutes);
app.use("/api", refreshTokenRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api", invoiceItemRoutes);
app.use("/api", taskRoutes);
app.use("/api", projectRoutes);
app.use("/api", noteRoutes);
app.use("/api", timeEntryRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    await db.authenticate();
    res.status(200).json({
      status: "OK",
      database: "connected",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      database: "disconnected",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============================================
// MIDDLEWARE D'ERREUR (APRÈS LES ROUTES)
// ============================================

app.use(errorHandler);

// Export de l'app pour les tests
export default app;

// Serveur (uniquement si exécuté directement, pas dans les tests)
const isTest = process.env.NODE_ENV === "test";
if (!isTest) {
  const startServeur = async () => {
    try {
      console.log("\n🚀 STARTING BACKEND INITIALIZATION...\n");

      // Étape 1: Créer la base de données si elle n'existe pas
      await iniDb.createDatabase();

      // Étape 2: Initialiser la connexion Sequelize
      await iniDb.initializeDatabase();

      // Étape 3: Charger les modèles et configurer les associations
      await iniDb.loadModelsAndAssociations();

      // Étape 4: Synchroniser le schéma de la base de données
      await iniDb.syncDatabase(db);

      //Etap 5 :remplir data
      await iniDb.seedDatabase(db);

      console.log("🔍 MODÈLES DÉTECTÉS:", Object.keys(db.models));

      // Étape 5: Démarrer le serveur
      app.listen(ENV.PORT, () => {
        console.log(`\n✨ serveur running on : http://localhost:${ENV.PORT}\n`);
        console.log("Doc disponible sur http://localhost:8000/api-docs");
      });
    } catch (error) {
      console.error("\n❌ Échec de l'initialisation du BDD :", error);
      process.exit(1);
    }
  };

  startServeur();
}
