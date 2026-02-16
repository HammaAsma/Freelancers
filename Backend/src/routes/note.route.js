import { Router } from "express";
import NoteController, {
  noteValidationRules,
} from "../controllers/note.controller.js";
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
 *     Note:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         client_id: { type: integer, example: 1 }
 *         project_id: { type: integer, example: 1 }
 *         title: { type: string, example: "Réunion client" }
 *         content: { type: string, example: "Client satisfait du prototype" }
 *         is_pinned: { type: boolean, example: true }
 *         created_at: { type: string, format: date-time, example: "2025-12-18T10:00:00Z" }
 */

/**
 * @swagger
 * /clients/{clientId}/projects/{projectId}/notes:
 *   post:
 *     summary: Créer une note pour un projet/client
 *     tags: [Notes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: clientId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Note'
 *     responses:
 *       201:
 *         description: Note créée
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Note' }
 *       404: { description: Client ou projet non trouvé }
 */
router.post(
  "/clients/:clientId/projects/:projectId/notes",
  noteValidationRules.create,
  NoteController.createNote
);

/**
 * @swagger
 * /projects/{projectId}/notes:
 *   get:
 *     summary: Lister notes d'un projet
 *     tags: [Notes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - name: pinned
 *         in: query
 *         schema: { type: boolean }
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Liste des notes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notes: { type: array, items: { $ref: '#/components/schemas/Note' } }
 *                 total: { type: integer }
 */
router.get(
  "/projects/:projectId/notes",
  noteValidationRules.getProjectNotes,
  NoteController.getProjectNotes
);

/**
 * @swagger
 * /notes/{noteId}:
 *   get:
 *     summary: Récupérer une note
 *     tags: [Notes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: noteId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Note trouvée, content: { application/json: { schema: { $ref: '#/components/schemas/Note' } } } }
 *       404: { description: Note non trouvée }
 */
router.get("/notes/:noteId", NoteController.getNote);

/**
 * @swagger
 * /notes/{noteId}:
 *   put:
 *     summary: Modifier une note
 *     tags: [Notes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: noteId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Note' }
 *     responses:
 *       200: { description: Note mise à jour }
 *       404: { description: Note non trouvée }
 */
router.put(
  "/notes/:noteId",
  noteValidationRules.update,
  NoteController.updateNote
);

/**
 * @swagger
 * /notes/{noteId}:
 *   delete:
 *     summary: Supprimer une note
 *     tags: [Notes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: noteId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Note supprimée }
 *       404: { description: Note non trouvée }
 */
router.delete("/notes/:noteId", NoteController.deleteNote);

/**
 * @swagger
 * /clients/{clientId}/notes/pinned:
 *   get:
 *     summary: Notes épinglées d'un client
 *     tags: [Notes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: clientId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notes épinglées
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Note' }
 *       404: { description: Client non trouvé }
 */
router.get("/clients/:clientId/notes/pinned", NoteController.getPinnedNotes);

/**
 * @swagger
 * /notes/search/{query}:
 *   get:
 *     summary: Rechercher des notes
 *     tags: [Notes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: query
 *         in: path
 *         required: true
 *         schema: { type: string, example: "réunion" }
 *     responses:
 *       200:
 *         description: Résultats de recherche
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Note' }
 */
router.get("/notes/search/:query", NoteController.searchNotes);

export default router;
