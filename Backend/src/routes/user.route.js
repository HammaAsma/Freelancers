import express from "express";
import userController from "../controllers/user.controller.js";
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
  deleteAccountValidator,
} from "../validators/user.validators.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Routes publiques
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     UserRegister:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email: { type: string, format: email }
 *         password: { type: string, minLength: 6 }
 *     UserLogin:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email: { type: string, format: email }
 *         password: { type: string }
 *     UserProfile:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         email: { type: string, format: email }
 *         name: { type: string }
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Inscription utilisateur
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/UserRegister' } } }
 *     responses:
 *       201: { description: Utilisateur créé avec succès }
 *       400: { description: Données invalides }
 */
router.post("/register", registerValidator, userController.register);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/UserLogin' } } }
 *     responses:
 *       200: { description: Tokens JWT, content: { application/json: { schema: { type: object, properties: { accessToken: { type: string }, refreshToken: { type: string } } } } } }
 *       401: { description: Identifiants invalides }
 */
router.post("/login", loginValidator, userController.login);
/**
 * @swagger
 * /users/refresh-token:
 *   post:
 *     summary: Rafraîchir le token
 *     tags: [Users]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, properties: { refreshToken: { type: string } } } } } }
 *     responses: { 200: { description: Nouveaux tokens } }
 */
router.post("/refresh-token", userController.refreshToken);

// Routes protégées
router.use(authenticate);
/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Récupérer profil utilisateur
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Profil utilisateur, content: { application/json: { schema: { $ref: '#/components/schemas/UserProfile' } } } } }
 */
router.get("/profile", userController.getProfile);
/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Modifier profil
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { content: { application/json: { schema: { $ref: '#/components/schemas/UserProfile' } } } }
 *     responses: { 200: { description: Profil mis à jour } }
 */
router.put("/profile", userController.updateProfile);
/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: Changer mot de passe
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, properties: { currentPassword: { type: string }, newPassword: { type: string, minLength: 6 } } } } } }
 *     responses: { 200: { description: Mot de passe changé } }
 */
router.put("/change-password", userController.changePassword);
/**
 * @swagger
 * /users/account:
 *   delete:
 *     summary: Supprimer compte
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 204: { description: Compte supprimé } }
 */
router.delete("/account", deleteAccountValidator, userController.deleteAccount);

export default router;
