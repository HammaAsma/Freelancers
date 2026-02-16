import { Router } from "express";
import taskController, {
  taskValidationRules,
} from "../controllers/task.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Authentification
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
 *     Task:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         name: { type: string, example: "Développer page login" }
 *         description: { type: string, example: "Implémenter auth JWT" }
 *         project_id: { type: integer, example: 1 }
 *         status: {
 *           type: string,
 *           enum: [todo, in_progress, in_review, completed, on_hold],
 *           example: "in_progress"
 *         }
 *         priority: {
 *           type: string,
 *           enum: [low, medium, high],
 *           example: "high"
 *         }
 *         due_date: { type: string, format: date, example: "2025-12-25" }
 *         estimated_hours: { type: number, example: 8.5 }
 *         hourly_rate: { type: number, example: 50.00 }
 *         hours_worked: { type: number, example: 4.2 }
 *     TaskStats:
 *       type: object
 *       properties:
 *         total_time: { type: number, example: 4.2 }
 *         billed_amount: { type: number, example: 210.00 }
 *         is_billed: { type: boolean, example: false }
 */

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   post:
 *     summary: Créer une tâche dans un projet
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
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
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       201:
 *         description: Tâche créée
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 *       400: { description: Données invalides }
 *       404: { description: Projet non trouvé }
 */
router.post(
  "/projects/:projectId/tasks",
  taskValidationRules.create,
  taskController.createTask
);

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   get:
 *     summary: Lister tâches d'un projet
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [todo, in_progress, in_review, completed, on_hold] }
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Liste des tâches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks: { type: array, items: { $ref: '#/components/schemas/Task' } }
 *                 total: { type: integer }
 */
router.get("/projects/:projectId/tasks", taskController.getProjectTasks);

/**
 * @swagger
 * /tasks/{taskId}:
 *   get:
 *     summary: Récupérer une tâche
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Tâche trouvée, content: { application/json: { schema: { $ref: '#/components/schemas/Task' } } } }
 *       404: { description: Tâche non trouvée }
 */
router.get("/tasks/:taskId", taskController.getTask);

/**
 * @swagger
 * /tasks/{taskId}:
 *   put:
 *     summary: Modifier une tâche
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Task' }
 *     responses:
 *       200: { description: Tâche mise à jour }
 *       404: { description: Tâche non trouvée }
 */
router.put(
  "/tasks/:taskId",
  taskValidationRules.update,
  taskController.updateTask
);

/**
 * @swagger
 * /tasks/{taskId}:
 *   delete:
 *     summary: Supprimer une tâche
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Tâche supprimée }
 *       404: { description: Tâche non trouvée }
 */
router.delete("/tasks/:taskId", taskController.deleteTask);

/**
 * @swagger
 * /tasks/{taskId}/stats:
 *   get:
 *     summary: Statistiques d'une tâche
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Stats tâche, content: { application/json: { schema: { $ref: '#/components/schemas/TaskStats' } } } }
 *       404: { description: Tâche non trouvée }
 */
router.get("/tasks/:taskId/stats", taskController.getTaskStats);

/**
 * @swagger
 * /tasks/{taskId}/status:
 *   patch:
 *     summary: Changer statut d'une tâche
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, in_review, completed, on_hold]
 *                 example: "completed"
 *     responses:
 *       200: { description: Statut mis à jour }
 *       400: { description: Statut invalide }
 *       404: { description: Tâche non trouvée }
 */
router.patch(
  "/tasks/:taskId/status",
  taskValidationRules.updateStatus,
  taskController.updateStatus
);

/**
 * @swagger
 * /tasks/search:
 *   get:
 *     summary: Rechercher des tâches
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: q
 *         in: query
 *         schema: { type: string }
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [todo, in_progress, in_review, completed, on_hold] }
 *     responses:
 *       200: { description: Résultats de recherche }
 */
router.get("/tasks/search", taskController.searchTasks);

/**
 * @swagger
 * /tasks/{taskId}/time/start:
 *   post:
 *     summary: Démarrer timer tâche
 *     tags: [Tasks - Time Tracking]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Timer démarré }
 *       404: { description: Tâche non trouvée }
 *       409: { description: Timer déjà actif }
 */
router.post("/tasks/:taskId/time/start", taskController.startTimer);

/**
 * @swagger
 * /tasks/{taskId}/time/stop:
 *   post:
 *     summary: Arrêter timer tâche
 *     tags: [Tasks - Time Tracking]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Timer arrêté }
 *       404: { description: Tâche ou timer non trouvé }
 */
router.post("/tasks/:taskId/time/stop", taskController.stopTimer);

export default router;
