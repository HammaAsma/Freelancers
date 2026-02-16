import { validationResult, param, body, query } from "express-validator";
import noteService from "../services/note.service.js";

class NoteController {
  async createNote(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { clientId, projectId } = req.params;
      const { title, content, is_pinned = false } = req.body;

      const note = await noteService.createNote({
        userId: req.user.id,
        clientId: parseInt(clientId),
        projectId: parseInt(projectId),
        title,
        content,
        is_pinned: Boolean(is_pinned),
      });

      res.status(201).json({
        success: true,
        data: note,
        message: "Note créée",
      });
    } catch (error) {
      next(error);
    }
  }

  async getNote(req, res, next) {
    try {
      const noteId = parseInt(req.params.noteId);
      if (isNaN(noteId)) {
        return res.status(400).json({
          success: false,
          message: "ID de note invalide",
        });
      }

      const note = await noteService.getNoteById(noteId, req.user.id);
      res.json({
        success: true,
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateNote(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const noteId = parseInt(req.params.noteId);
      if (isNaN(noteId)) {
        return res.status(400).json({
          success: false,
          message: "ID de note invalide",
        });
      }

      const note = await noteService.updateNote(noteId, req.user.id, req.body);
      res.json({
        success: true,
        data: note,
        message: "Note mise à jour",
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteNote(req, res, next) {
    try {
      const noteId = parseInt(req.params.noteId);
      if (isNaN(noteId)) {
        return res.status(400).json({
          success: false,
          message: "ID de note invalide",
        });
      }

      await noteService.deleteNote(noteId, req.user.id);
      res.json({
        success: true,
        message: "Note supprimée avec succès",
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectNotes(req, res, next) {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          message: "ID de projet invalide",
        });
      }

      const {
        page = 1,
        limit = 10,
        pinned,
        search,
        dateFrom,
        dateTo,
      } = req.query;

      const result = await noteService.getNotesByProject(
        projectId,
        req.user.id,
        {
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 10,
          pinned: pinned === "true" ? true : pinned === "false" ? false : null,
          search: search || null,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
        }
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPinnedNotes(req, res, next) {
    try {
      const { clientId, projectId } = req.params;
      const notes = await noteService.getPinnedNotes(
        req.user.id,
        parseInt(clientId),
        projectId ? parseInt(projectId) : null
      );

      res.json({
        success: true,
        data: notes,
      });
    } catch (error) {
      next(error);
    }
  }

  async searchNotes(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const query = req.params.query?.trim();

      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Requête de recherche trop courte (min 2 caractères)",
        });
      }

      const result = await noteService.searchNotes(req.user.id, query, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Validation rules complètes
export const noteValidationRules = {
  create: [
    param("clientId").isInt({ min: 1 }).withMessage("ID client invalide"),
    param("projectId").isInt({ min: 1 }).withMessage("ID projet invalide"),
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Titre requis")
      .isLength({ max: 255 })
      .withMessage("Titre trop long"),
    body("content").optional().trim().isLength({ max: 10000 }),
    body("is_pinned").optional().isBoolean(),
  ],
  update: [
    param("noteId").isInt({ min: 1 }).withMessage("ID note invalide"),
    body("title")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Titre ne peut pas être vide")
      .isLength({ max: 255 }),
    body("content").optional().trim().isLength({ max: 10000 }),
    body("is_pinned").optional().isBoolean(),
  ],
  getProjectNotes: [
    param("projectId").isInt({ min: 1 }).withMessage("ID projet invalide"),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("pinned").optional().isBoolean(),
    query("search").optional().isLength({ min: 2 }),
    query("dateFrom").optional().isISO8601(),
    query("dateTo").optional().isISO8601(),
  ],
};

export default new NoteController();
