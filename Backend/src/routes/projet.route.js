import { Router } from "express";
import projectController, {
  projectValidationRules,
} from "../controllers/project.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         name: { type: string, example: "Site e-commerce" }
 *         description: { type: string, example: "Développement site web" }
 *         client_id: { type: integer, example: 1 }
 *         status: {
 *           type: string,
 *           enum: [todo, in_progress, completed, on_hold],
 *           example: "in_progress"
 *         }
 *         start_date: { type: string, format: date, example: "2025-12-01" }
 *         end_date: { type: string, format: date, example: "2025-12-31" }
 *         budget: { type: number, example: 5000.00 }
 *         hourly_rate: { type: number, example: 50.00 }
 *     ProjectStats:
 *       type: object
 *       properties:
 *         total_tasks: { type: integer, example: 15 }
 *         completed_tasks: { type: integer, example: 8 }
 *         total_hours: { type: number, example: 45.5 }
 *         total_billed: { type: number, example: 2275.00 }
 */

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Liste tous les projets de l'utilisateur
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1 }
 *       - name: limit
 *         in: query
 *         schema: { type: integer, default: 10 }
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [todo, in_progress, completed, on_hold] }
 *     responses:
 *       200:
 *         description: Liste des projets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Project' }
 *                 total: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get("/projects", projectController.getAllProjects);

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Créer un nouveau projet
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       201:
 *         description: Projet créé avec succès
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Project' }
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Projet existant
 */
router.post(
  "/projects",
  projectValidationRules.create,
  projectController.createProject
);

/**
 * @swagger
 * /projects/{projectId}:
 *   get:
 *     summary: Récupérer un projet par ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Projet trouvé
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Project' }
 *       404:
 *         description: Projet non trouvé
 */
router.get("/projects/:projectId", projectController.getProject);

/**
 * @swagger
 * /projects/{projectId}:
 *   put:
 *     summary: Modifier un projet
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       200:
 *         description: Projet mis à jour
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Project' }
 *       404:
 *         description: Projet non trouvé
 */
router.put(
  "/projects/:projectId",
  projectValidationRules.update,
  projectController.updateProject
);

/**
 * @swagger
 * /projects/{projectId}:
 *   delete:
 *     summary: Supprimer un projet
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Projet supprimé
 *       404:
 *         description: Projet non trouvé
 */
router.delete("/projects/:projectId", projectController.deleteProject);

/**
 * @swagger
 * /projects/{projectId}/stats:
 *   get:
 *     summary: Statistiques d'un projet
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Statistiques du projet
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ProjectStats' }
 *       404:
 *         description: Projet non trouvé
 */
router.get("/projects/:projectId/stats", projectController.getProjectStats);

export default router;
