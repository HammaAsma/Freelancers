import { Op } from "sequelize";
import TimeEntry from "../models/timeEntry.model.js";
import Task from "../models/task.model.js";
import Project from "../models/project.model.js";
import db from "../config/db.js";


class TimeEntryService {
  // Démarrer chrono avec validation ✅
  async startTimer({
    userId,
    taskId,
    startTime = new Date(),
    description = null,
  }) {
    // Validation ID
    if (
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !Number.isInteger(taskId) ||
      taskId <= 0
    ) {
      throw new Error("ID utilisateur ou tâche invalide");
    }

    // Vérifier tâche + autorisation
    const task = await Task.findOne({
      include: [
        {
          model: Project,
          where: { user_id: userId },
          required: true,
        },
      ],
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("Tâche non trouvée ou accès non autorisé");
    }

    // Vérifier pas de chrono actif
    const activeTimer = await this.getActiveTimer(userId);
    if (activeTimer) {
      throw new Error("Un chrono est déjà en cours. Arrêtez-le d'abord.");
    }

    const timeEntry = await TimeEntry.create({
      user_id: userId,
      task_id: taskId,
      start_time: startTime,
      is_running: true,
      description: description?.trim() || null,
    });

    return timeEntry;
  }

  // Arrêter chrono avec transaction ✅
  async stopTimer(userId, timeEntryId) {
    const transaction = await db.transaction();
    try {
      const timeEntry = await TimeEntry.findOne({
        where: { id: timeEntryId, user_id: userId, is_running: true },
        include: [{ model: Task }],
        transaction,
      });

      if (!timeEntry) {
        throw new Error("Chrono non trouvé ou déjà arrêté");
      }

      const endTime = new Date();
      const durationSeconds = Math.floor(
        (endTime - timeEntry.start_time) / 1000
      );

      // Mise à jour tâche ET timeEntry en transaction
      await Promise.all([
        timeEntry.Task.increment("hours_worked", {
          by: durationSeconds / 3600,
          transaction,
        }),
        timeEntry.update(
          {
            end_time: endTime,
            duration: durationSeconds,
            is_running: false,
          },
          { transaction }
        ),
      ]);

      await transaction.commit();
      return await TimeEntry.findByPk(timeEntryId, {
        include: [{ model: Task }],
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Chrono actif (optionnel: filtrer par project_id)
  async getActiveTimer(userId, projectId = null) {
    const include = [
      {
        model: Task,
        include: [{ model: Project }],
        ...(projectId
          ? { where: { project_id: projectId }, required: true }
          : {}),
      },
    ];
    return await TimeEntry.findOne({
      where: { user_id: userId, is_running: true },
      include,
      order: [["start_time", "DESC"]],
    });
  }

  // Entrées par tâche avec filtres ✅
  async getTimeEntriesByTask(
    taskId,
    userId,
    { page = 1, limit = 10, dateFrom = null, dateTo = null } = {}
  ) {
    const offset = (page - 1) * limit;
    const where = { task_id: taskId, user_id: userId };

    if (dateFrom || dateTo) {
      where.start_time = {};
      if (dateFrom) where.start_time[Op.gte] = new Date(dateFrom);
      if (dateTo) where.start_time[Op.lte] = new Date(dateTo);
    }

    const { count, rows } = await TimeEntry.findAndCountAll({
      where,
      include: [
        {
          model: Task,
          include: [{ model: Project }],
        },
      ],
      order: [["start_time", "DESC"]],
      limit: +limit,
      offset,
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: +page,
        limit: +limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // Suppression sécurisée ✅
  async deleteTimeEntry(timeEntryId, userId) {
    const timeEntry = await TimeEntry.findOne({
      where: { id: timeEntryId, user_id: userId },
    });

    if (!timeEntry) {
      throw new Error("Entrée de temps non trouvée");
    }

    if (timeEntry.is_running) {
      throw new Error("Impossible de supprimer un chrono en cours");
    }

    // Retirer du total heures tâche
    if (timeEntry.duration) {
      await Task.decrement("hours_worked", {
        by: timeEntry.duration / 3600,
        where: { id: timeEntry.task_id },
      });
    }

    await timeEntry.destroy();
    return true;
  }

  // Temps total des sessions terminées uniquement (pour afficher la base au démarrage)
  async getTotalCompletedSeconds(taskId, userId) {
    const result = await TimeEntry.findOne({
      where: {
        task_id: taskId,
        user_id: userId,
        is_running: false,
      },
      attributes: [[db.fn("SUM", db.col("duration")), "totalSeconds"]],
      raw: true,
    });
    return parseInt(result?.totalSeconds || 0, 10);
  }

  // Temps total avec chrono courant ✅
  async getTotalTime(taskId, userId) {
    const [runningTime, finishedTime] = await Promise.all([
      // Temps chrono courant
      TimeEntry.findOne({
        where: { task_id: taskId, user_id: userId, is_running: true },
        attributes: ["start_time"],
      }),
      // Temps sessions terminées
      TimeEntry.findOne({
        where: {
          task_id: taskId,
          user_id: userId,
          is_running: false,
        },
        attributes: [
          [db.fn("SUM", db.col("duration")), "totalSeconds"],
        ],
        raw: true,
      }),
    ]);

    let totalSeconds = parseInt(finishedTime?.totalSeconds || 0);

    // Ajouter temps chrono courant
    if (runningTime) {
      const now = new Date();
      const elapsed = Math.floor((now - runningTime.start_time) / 1000);
      totalSeconds += elapsed;
    }

    return totalSeconds;
  }

  // Statistiques temps par période ✅
  async getTimeStats(userId, { period = "week" }) {
    const now = new Date();
    let startDate;

    switch (period) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "week":
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    const stats = await TimeEntry.findAll({
      where: {
        user_id: userId,
        start_time: { [Op.gte]: startDate },
      },
      attributes: [
        [db.fn("DATE", db.col("start_time")), "date"],
        [db.fn("SUM", db.col("duration")), "totalSeconds"],
      ],
      group: ["date"],
      raw: true,
      order: [["start_time", "ASC"]],
    });

    return stats.map((stat) => ({
      date: stat.date,
      totalSeconds: parseInt(stat.totalSeconds),
      formatted: this.formatDuration(parseInt(stat.totalSeconds)),
    }));
  }

  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  // Arrêter le chrono actif d'une tâche (pour task.controller et timeEntry.controller)
  async stopTimerByTask(userId, taskId) {
    const timeEntry = await TimeEntry.findOne({
      where: { user_id: userId, task_id: taskId, is_running: true },
      include: [{ model: Task }],
    });
    if (!timeEntry) {
      throw new Error("Chrono non trouvé ou déjà arrêté");
    }
    return this.stopTimer(userId, timeEntry.id);
  }
}

export default new TimeEntryService();
