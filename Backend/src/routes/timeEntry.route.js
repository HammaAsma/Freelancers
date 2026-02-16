import { Router } from "express";
import timeEntryController, {
  timeEntryValidationRules,
} from "../controllers/timeEntry.controller.js";
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
 *     TimeEntry:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         task_id: { type: integer, example: 1 }
 *         start_time: { type: string, format: date-time, example: "2025-12-18T10:00:00Z" }
 *         end_time: { type: string, format: date-time, example: "2025-12-18T12:30:00Z" }
 *         duration_seconds: { type: integer, example: 9000 }
 *         duration_hours: { type: number, example: 2.5 }
 *         is_active: { type: boolean, example: false }
 *     TimeStats:
 *       type: object
 *       properties:
 *         total_hours: { type: number, example: 45.5 }
 *         total_entries: { type: integer, example: 12 }
 *         weekly_hours: { type: number, example: 22.3 }
 */

/**
 * @swagger
 * /tasks/{taskId}/time/start:
 *   post:
 *     summary: Démarrer le timer d'une tâche
 *     tags: [Time Tracking]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Timer démarré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timeEntryId: { type: integer }
 *                 startTime: { type: string, format: date-time }
 *       404: { description: Tâche non trouvée }
 *       409: { description: Timer déjà actif sur cette tâche }
 */
router.post(
  "/tasks/:taskId/time/start",
  timeEntryValidationRules.start,
  timeEntryController.startTimer
);

/**
 * @swagger
 * /tasks/{taskId}/time/stop:
 *   post:
 *     summary: Arrêter le timer d'une tâche
 *     tags: [Time Tracking]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Timer arrêté
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TimeEntry' }
 *       404: { description: Tâche ou timer non trouvé }
 */
router.post(
  "/tasks/:taskId/time/stop",
  timeEntryValidationRules.stop,
  timeEntryController.stopTimer
);

/**
 * @swagger
 * /tasks/{taskId}/time-entries:
 *   get:
 *     summary: Lister toutes les entrées de temps d'une tâche
 *     tags: [Time Tracking]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - name: start_date
 *         in: query
 *         schema: { type: string, format: date }
 *       - name: end_date
 *         in: query
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Liste des entrées de temps
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timeEntries: { type: array, items: { $ref: '#/components/schemas/TimeEntry' } }
 *                 total_hours: { type: number }
 */
router.get(
  "/tasks/:taskId/time-entries",
  timeEntryValidationRules.getTaskTimeEntries,
  timeEntryController.getTaskTimeEntries
);

/**
 * @swagger
 * /time-entries/{timeEntryId}:
 *   delete:
 *     summary: Supprimer une entrée de temps
 *     tags: [Time Tracking]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: timeEntryId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Entrée supprimée }
 *       404: { description: Entrée non trouvée }
 */
router.delete(
  "/time-entries/:timeEntryId",
  timeEntryValidationRules.delete,
  timeEntryController.deleteTimeEntry
);

/**
 * @swagger
 * /tasks/{taskId}/time/total:
 *   get:
 *     summary: Temps total travaillé sur une tâche
 *     tags: [Time Tracking]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Temps total
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_hours: { type: number, example: 12.5 }
 *                 total_seconds: { type: integer, example: 45000 }
 */
router.get(
  "/tasks/:taskId/time/total",
  timeEntryValidationRules.getTotalTime,
  timeEntryController.getTaskTotalTime
);

/**
 * @swagger
 * /time-entries/active:
 *   get:
 *     summary: Récupérer le timer actif (s'il existe)
 *     tags: [Time Tracking]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Timer actif ou null
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/TimeEntry'
 *                 - type: null
 */
router.get("/time-entries/active", timeEntryController.getActiveTimer);

/**
 * @swagger
 * /time-entries/stats:
 *   get:
 *     summary: Statistiques globales de temps
 *     tags: [Time Tracking]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: period
 *         in: query
 *         schema: { type: string, enum: [day, week, month, year], default: week }
 *     responses:
 *       200:
 *         description: Statistiques de temps
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TimeStats' }
 */
router.get("/time-entries/stats", timeEntryController.getTimeStats);

export default router;
