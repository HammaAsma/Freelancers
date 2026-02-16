import { Router } from "express";
import ClientController, {
  clientValidationRules,
} from "../controllers/client.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticate);

// Créer un client
/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         email: { type: string, format: email }
 *         phone: { type: string }
 *         address: { type: string }
 */

/**
 * @swagger
 * /clients:
 *   post:
 *     summary: Créer client
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/Client' } } } }
 *     responses: { 201: { description: Client créé } }
 */
router.post(
  "/",
  clientValidationRules.create, // Middleware de validation
  ClientController.create // Contrôleur
);

// Récupérer tous les clients
/**
 * @swagger
 * /clients:
 *   get:
 *     summary: Liste clients
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: page, in: query, schema: { type: integer }, description: Page } ]
 *     responses: { 200: { description: Liste clients } }
 */
router.get("/", ClientController.getAll);

// Récupérer un client par ID
/**
 * @swagger
 * /clients/{id}:
 *   get:
 *     summary: Client par ID
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: Client trouvé } }
 */
router.get("/:id", ClientController.getOne);

// Mettre à jour un client

/**
 * @swagger
 * /clients/{id}:
 *   put:
 *     summary: Modifier client
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     requestBody: { content: { application/json: { schema: { $ref: '#/components/schemas/Client' } } } }
 *     responses: { 200: { description: Client mis à jour } }
 */
router.put(
  "/:id",
  clientValidationRules.update, // Middleware de validation
  ClientController.update // Contrôleur
);

// Supprimer un client
/**
 * @swagger
 * /clients/{id}:
 *   delete:
 *     summary: Supprimer client
 *     tags: [Clients]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
 *     responses: { 204: { description: Client supprimé } }
 */
router.delete("/:id", ClientController.remove);

export default router;
