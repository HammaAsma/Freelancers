import { Router } from "express";
import { body } from "express-validator";
import authController from "../controllers/auth.controller.js";

const router = Router();

// Règles de validation pour les routes d'authentification
const authValidationRules = {
  register: [
    body("email").isEmail().withMessage("Email invalide"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Le mot de passe doit contenir au moins 8 caractères"),
  ],
  login: [
    body("email").isEmail().withMessage("Email invalide"),
    body("password").exists().withMessage("Le mot de passe est requis"),
  ],
};

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     AuthRegister:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email: { type: string, format: email, example: "user@example.com" }
 *         password: { type: string, minLength: 8, example: "motdepasse123" }
 *         name: { type: string, example: "John Doe" }
 *     AuthLogin:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email: { type: string, format: email, example: "user@example.com" }
 *         password: { type: string, example: "motdepasse123" }
 *     AuthResponse:
 *       type: object
 *       properties:
 *         accessToken: { type: string, example: "eyJhbGciOiJIUzI1NiIs..." }
 *         refreshToken: { type: string, example: "eyJhbGciOiJIUzI1NiIs..." }
 *         user: {
 *           type: object,
 *           properties: { id: { type: integer }, email: { type: string }, name: { type: string } }
 *         }
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AuthRegister' }
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400:
 *         description: Données invalides (email ou mot de passe)
 *       409:
 *         description: Email déjà utilisé
 */
router.post("/register", authValidationRules.register, (req, res, next) =>
  authController.register(req, res, next)
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AuthLogin' }
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       401:
 *         description: Identifiants incorrects
 *       400:
 *         description: Données invalides
 */
router.post("/login", authValidationRules.login, (req, res, next) =>
  authController.login(req, res, next)
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Déconnexion (invalide le refresh token)
 *     tags: [Authentication]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *       401:
 *         description: Token invalide
 */
router.post("/logout", (req, res, next) =>
  authController.logout(req, res, next)
);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Déconnexion de tous les appareils
 *     tags: [Authentication]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Tous les tokens invalidés
 *       401:
 *         description: Token invalide
 */
router.post("/logout-all", (req, res, next) =>
  authController.logoutAllDevices(req, res, next)
);

export default router;
