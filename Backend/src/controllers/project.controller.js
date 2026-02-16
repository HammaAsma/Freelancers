import { validationResult, body } from "express-validator";
import projectService from "../services/project.service.js";

class ProjectController {
  async createProject(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const project = await projectService.create(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: project,
        message: "Projet créé avec succès",
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllProjects(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        billing_type,
        clientId,
        search,
      } = req.query;
      const result = await projectService.getAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        userId: req.user.id,
        status: status || null,
        billing_type: billing_type || null,
        clientId: clientId ? parseInt(clientId) : null,
        search: search || "",
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

  async getProject(req, res, next) {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          message: "ID de projet invalide",
        });
      }

      const project = await projectService.getOne(req.user.id, projectId);
      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          message: "ID de projet invalide",
        });
      }

      const project = await projectService.update(
        req.user.id,
        projectId,
        req.body
      );
      res.json({
        success: true,
        data: project,
        message: "Projet mis à jour",
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req, res, next) {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          message: "ID de projet invalide",
        });
      }

      await projectService.delete(req.user.id, projectId);
      res.json({
        success: true,
        message: "Projet archivé avec succès",
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectStats(req, res, next) {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          message: "ID de projet invalide",
        });
      }

      const stats = await projectService.getProjectStats(
        req.user.id,
        projectId
      );
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Validation rules corrigées
export const projectValidationRules = {
  create: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Le nom du projet est requis")
      .isLength({ min: 2, max: 255 })
      .withMessage("Nom entre 2 et 255 caractères"),
    body("client_id").isInt({ min: 1 }).withMessage("ID client invalide"),
    body("billing_type")
      .notEmpty()
      .withMessage("Type de facturation requis")
      .isIn(["hourly", "fixed"])
      .withMessage('Type doit être "hourly" ou "fixed"'),
    body("hourly_rate")
      .if(body("billing_type").equals("hourly"))
      .isFloat({ min: 0 })
      .withMessage("Taux horaire requis et positif"),
    body("fixed_amount")
      .if(body("billing_type").equals("fixed"))
      .isFloat({ min: 0 })
      .withMessage("Montant fixe requis et positif"),
    body("status")
      .optional()
      .isIn(["planning", "in_progress", "completed", "on_hold"]),
    body("description").optional().trim(),
  ],
  update: [
    body("name")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 2, max: 255 }),
    body("billing_type")
      .optional({ checkFalsy: true })
      .isIn(["hourly", "fixed"]),
    body("hourly_rate").optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body("fixed_amount").optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body("status")
      .optional({ checkFalsy: true })
      .isIn(["planning", "in_progress", "completed", "on_hold"]),
  ],
};

export default new ProjectController();
