import { validationResult, body } from "express-validator";
import taskService from "../services/task.service.js";
import timeEntryService from "../services/timeEntry.service.js";

class TaskController {
  async createTask(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { projectId } = req.params;
      const task = await taskService.createTask({
        projectId: parseInt(projectId),
        userId: req.user.id,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        data: task,
        message: "Tâche créée avec succès",
      });
    } catch (error) {
      next(error);
    }
  }

  async getTask(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({
          success: false,
          message: "ID de tâche invalide",
        });
      }

      const task = await taskService.getTaskById(taskId, req.user.id);
      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({
          success: false,
          message: "ID de tâche invalide",
        });
      }

      const task = await taskService.updateTask(taskId, req.user.id, req.body);
      res.json({
        success: true,
        data: task,
        message: "Tâche mise à jour",
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({
          success: false,
          message: "ID de tâche invalide",
        });
      }

      await taskService.deleteTask(taskId, req.user.id);
      res.json({
        success: true,
        message: "Tâche archivée avec succès",
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectTasks(req, res, next) {
    try {
      const { projectId } = req.params;
      const { status, priority, page = 1, limit = 10 } = req.query;

      const result = await taskService.getTasksByProject(
        parseInt(projectId),
        req.user.id,
        {
          status: status || null,
          priority: priority || null,
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 10,
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

  async getTaskStats(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({
          success: false,
          message: "ID de tâche invalide",
        });
      }

      const stats = await taskService.getTaskStats(taskId, req.user.id);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({
          success: false,
          message: "ID de tâche invalide",
        });
      }

      const { status } = req.body;
      const task = await taskService.updateTaskStatus(
        taskId,
        req.user.id,
        status
      );
      res.json({
        success: true,
        data: task,
        message: "Statut mis à jour",
      });
    } catch (error) {
      next(error);
    }
  }

  async searchTasks(req, res, next) {
    try {
      const { q: query, page = 1, limit = 10 } = req.query;

      if (!query || query.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Le terme de recherche est requis",
        });
      }

      const result = await taskService.searchTasks(req.user.id, query.trim(), {
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
  async startTimer(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({
          success: false,
          message: "ID de tâche invalide",
        });
      }

      const totalSecondsBefore =
        await timeEntryService.getTotalCompletedSeconds(taskId, req.user.id);

      const entry = await timeEntryService.startTimer({
        userId: req.user.id,
        taskId,
      });
      const elapsedSeconds = entry.start_time
        ? Math.floor((new Date() - new Date(entry.start_time)) / 1000)
        : 0;
      res.status(201).json({
        success: true,
        data: {
          ...entry.toJSON(),
          elapsedSeconds,
          totalSecondsBefore,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  async stopTimer(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({
          success: false,
          message: "ID de tâche invalide",
        });
      }

      const entry = await timeEntryService.stopTimerByTask(req.user.id, taskId);
      const duration = entry.duration != null ? parseInt(entry.duration, 10) : 0;
      res.json({
        success: true,
        data: { ...entry.toJSON(), duration },
        message: "Temps enregistré",
      });
    } catch (error) {
      next(error);
    }
  }
}

// Validation rules corrigées
export const taskValidationRules = {
  create: [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Le titre est requis")
      .isLength({ min: 2, max: 255 })
      .withMessage("Titre entre 2 et 255 caractères"),
    body("description").optional().trim(),
    body("status")
      .optional()
      .isIn(["todo", "in_progress", "in_review", "completed", "on_hold"]),
    body("priority").optional().isIn(["low", "medium", "high"]),
    body("estimated_hours").optional().isFloat({ min: 0 }),
    body("hourly_rate").optional().isFloat({ min: 0 }),
    body("due_date").optional().isISO8601().toDate(),
  ],
  update: [
    body("title")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 2, max: 255 }),
    body("description").optional({ checkFalsy: true }).trim(),
    body("priority")
      .optional({ checkFalsy: true })
      .isIn(["low", "medium", "high"]),
    body("estimated_hours").optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body("hourly_rate").optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body("due_date").optional({ checkFalsy: true }).isISO8601().toDate(),
  ],
  updateStatus: [
    body("status")
      .notEmpty()
      .isIn(["todo", "in_progress", "in_review", "completed", "on_hold"])
      .withMessage("Statut non valide"),
  ],
};

export default new TaskController();
