import { validationResult, param, body, query } from "express-validator";
import timeEntryService from "../services/timeEntry.service.js";

class TimeEntryController {
  // POST /tasks/:taskId/time/start
  async startTimer(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const taskId = parseInt(req.params.taskId);
      const timeEntry = await timeEntryService.startTimer({
        userId: req.user.id,
        taskId,
        startTime: req.body.startTime
          ? new Date(req.body.startTime)
          : new Date(),
        description: req.body.description,
      });

      res.status(201).json({
        success: true,
        data: timeEntry,
        message: "Chrono démarré",
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /tasks/:taskId/time/stop  (on arrête le timer actif de cette tâche)
  async stopTimer(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({
          success: false,
          message: "ID de tâche invalide",
        });
      }

      const timeEntry = await timeEntryService.stopTimerByTask(
        req.user.id,
        taskId
      );

      res.json({
        success: true,
        data: timeEntry,
        message: "Chrono arrêté",
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /time-entries/active?project_id=...
  async getActiveTimer(req, res, next) {
    try {
      const { project_id } = req.query;
      const active = await timeEntryService.getActiveTimer(
        req.user.id,
        project_id ? parseInt(project_id) : null
      );

      if (!active) {
        return res.json({ success: true, data: null });
      }

      const elapsedSeconds = Math.floor(
        (Date.now() - new Date(active.start_time).getTime()) / 1000
      );
      const totalSecondsBefore =
        await timeEntryService.getTotalCompletedSeconds(
          active.task_id,
          req.user.id
        );

      res.json({
        success: true,
        data: {
          ...active.toJSON(),
          elapsedSeconds,
          totalSecondsBefore,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /tasks/:taskId/time-entries
  async getTaskTimeEntries(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({
          success: false,
          message: "ID de tâche invalide",
        });
      }

      const { page = 1, limit = 10, dateFrom, dateTo } = req.query;
      const result = await timeEntryService.getTimeEntriesByTask(
        taskId,
        req.user.id,
        {
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 10,
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

  // DELETE /time-entries/:timeEntryId
  async deleteTimeEntry(req, res, next) {
    try {
      const timeEntryId = parseInt(req.params.timeEntryId);
      if (isNaN(timeEntryId)) {
        return res.status(400).json({
          success: false,
          message: "ID d'entrée invalide",
        });
      }

      await timeEntryService.deleteTimeEntry(timeEntryId, req.user.id);
      res.json({
        success: true,
        message: "Entrée de temps supprimée avec succès",
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /tasks/:taskId/time/total
  async getTaskTotalTime(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({
          success: false,
          message: "ID de tâche invalide",
        });
      }

      const totalSeconds = await timeEntryService.getTotalTime(
        taskId,
        req.user.id
      );

      res.json({
        success: true,
        data: {
          totalSeconds: parseInt(totalSeconds),
          totalHours: (totalSeconds / 3600).toFixed(2),
          formatted: timeEntryService.formatDuration(parseInt(totalSeconds)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /time-entries/stats?period=week|month...
  async getTimeStats(req, res, next) {
    try {
      const { period = "week" } = req.query;
      const stats = await timeEntryService.getTimeStats(req.user.id, {
        period,
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Validation rules
export const timeEntryValidationRules = {
  start: [
    param("taskId").isInt({ min: 1 }).withMessage("ID de tâche invalide"),
    body("startTime")
      .optional()
      .isISO8601()
      .withMessage("Format de date invalide"),
    body("description").optional().isLength({ max: 500 }).trim(),
  ],
  stop: [param("taskId").isInt({ min: 1 }).withMessage("ID de tâche invalide")],
  getTaskTimeEntries: [
    param("taskId").isInt({ min: 1 }).withMessage("ID de tâche invalide"),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("dateFrom").optional().isISO8601(),
    query("dateTo").optional().isISO8601(),
  ],
  delete: [
    param("timeEntryId").isInt({ min: 1 }).withMessage("ID d'entrée invalide"),
  ],
  getTotalTime: [
    param("taskId").isInt({ min: 1 }).withMessage("ID de tâche invalide"),
  ],
};

export default new TimeEntryController();
