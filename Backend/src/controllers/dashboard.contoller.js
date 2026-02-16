import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import Note from "../models/note.model.js";
import Invoice from "../models/invoice.model.js";
import TimeEntry from "../models/timeEntry.model.js";
import { Op } from "sequelize";

class DashboardController {
  async getDashboard(req, res, next) {
    try {
      const userId = req.user.id;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // 1) Stats simples (Task n'a pas user_id, on filtre via Project)
      const [tasksInProgress, activeProjects, notesCount, invoicesThisMonth] =
        await Promise.all([
          Task.count({
            include: [
              {
                model: Project,
                as: "Project",
                attributes: [],
                where: { user_id: userId },
              },
            ],
            where: { status: "in_progress" },
          }),
          Project.count({ where: { user_id: userId, status: "active" } }),
          Note.count({ where: { user_id: userId } }),
          Invoice.count({
            where: {
              user_id: userId,
              issue_date: { [Op.gte]: startOfMonth },
            },
          }),
        ]);

      // 2) Heures ce mois (total sur tous les time entries terminés)
      const totalTimeResult = await TimeEntry.findOne({
        where: {
          user_id: userId,
          is_running: false,
          start_time: { [Op.gte]: startOfMonth },
        },
        attributes: [
          [
            TimeEntry.sequelize.fn("SUM", TimeEntry.sequelize.col("duration")),
            "totalSeconds",
          ],
        ],
        raw: true,
      });
      const totalSecondsMonth = parseInt(
        totalTimeResult?.totalSeconds || 0,
        10
      );
      const hoursThisMonth = (totalSecondsMonth / 3600).toFixed(1);

      // 3) Lists récentes pour les overviews (Task via Project)
      const [recentTasks, recentProjects, recentNotes, recentInvoices] =
        await Promise.all([
          Task.findAll({
            include: [
              {
                model: Project,
                as: "Project",
                attributes: ["id", "name"],
                where: { user_id: userId },
              },
            ],
            order: [["updatedAt", "DESC"]],
            limit: 5,
          }),
          Project.findAll({
            where: { user_id: userId },
            order: [["updatedAt", "DESC"]],
            limit: 5,
          }),
          Note.findAll({
            where: { user_id: userId },
            order: [["updatedAt", "DESC"]],
            limit: 5,
          }),
          Invoice.findAll({
            where: { user_id: userId },
            order: [["issue_date", "DESC"]],
            limit: 5,
          }),
        ]);

      res.json({
        success: true,
        data: {
          stats: {
            tasksInProgress,
            activeProjects,
            notesCount,
            hoursThisMonth,
            invoicesThisMonth,
          },
          lists: {
            recentTasks,
            recentProjects,
            recentNotes,
            recentInvoices,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();
