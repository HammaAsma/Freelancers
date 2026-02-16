import Task from "../models/task.model.js";
import Project from "../models/project.model.js";
import Invoice from "../models/invoice.model.js";
import User from "../models/user.js";
import invoiceItemService from "./invoiceItem.service.js";
import db from "../config/db.js";
import { Op } from "sequelize";

class TaskService {
  // Création de tâche avec validation ✅
  async createTask({ projectId, userId, ...data }) {
    // Vérifier projet
    const project = await Project.findByPk(projectId, {
      include: [{ model: User, where: { id: userId }, required: true }]
    });
    if (!project) {
      throw new Error("Projet introuvable ou non autorisé");
    }

    const task = await Task.create({
      ...data,
      project_id: projectId,
      status: data.status || 'todo',
      priority: data.priority || 'medium'
    });

    return task;
  }

  // Récupération tâche avec includes ✅
  async getTaskById(taskId, userId) {
    const task = await Task.findByPk(taskId, {
      include: [
        {
          model: Project,
          where: { user_id: userId },
          required: true,
          include: [{ model: User, attributes: ['id', 'first_name', 'last_name'] }]
        }
      ],
    });

    if (!task) {
      throw new Error("Tâche non trouvée");
    }

    return task;
  }

  // Mise à jour tâche ✅
  async updateTask(taskId, userId, data) {
    const task = await this.getTaskById(taskId, userId);
    
    // Nettoyage données
    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.estimated_hours !== undefined) updateData.estimated_hours = parseFloat(data.estimated_hours);
    if (data.due_date !== undefined) updateData.due_date = data.due_date || null;

    await task.update(updateData);
    return await this.getTaskById(taskId, userId);
  }

  // Soft delete ✅
  async deleteTask(taskId, userId) {
    const task = await this.getTaskById(taskId, userId);
    await task.update({ status: 'on_hold' }); // Soft delete
    return true;
  }

  // Tâches par projet avec filtres avancés ✅
  async getTasksByProject(projectId, userId, { status, priority, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const where = { 
      project_id: projectId,
      status: { [Op.ne]: 'on_hold' } // Exclure supprimées
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const { count, rows } = await Task.findAndCountAll({
      where,
      include: [
        {
          model: Project,
          where: { user_id: userId },
          required: true,
        },
      ],
      limit: +limit,
      offset,
      order: [["due_date", "ASC"], ["priority", "DESC"]],
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: +page,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // Stats tâche améliorées ✅
  async getTaskStats(taskId, userId) {
    const task = await this.getTaskById(taskId, userId);
    return {
      id: task.id,
      status: task.status,
      priority: task.priority,
      estimated_hours: task.estimated_hours,
      hours_worked: task.hours_worked,
      progress: task.estimated_hours ? 
        ((task.hours_worked / task.estimated_hours) * 100).toFixed(1) : 0,
      overdue: task.due_date && new Date(task.due_date) < new Date() && 
        task.status !== 'completed'
    };
  }

  // Recherche améliorée ✅
  async searchTasks(userId, query, { page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Task.findAndCountAll({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } }
        ],
      },
      include: [
        {
          model: Project,
          where: { user_id: userId },
          required: true,
        },
      ],
      limit: +limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: +page,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // Update status avec facturation auto ✅
  async updateTaskStatus(taskId, userId, status) {
    const transaction = await db.transaction();

    try {
      const task = await Task.findByPk(taskId, { transaction });
      if (!task) throw new Error("Tâche non trouvée");

      const previousStatus = task.status;
      const project = await Project.findByPk(task.project_id, { transaction });
      if (!project || project.user_id !== userId) {
        throw new Error("Accès non autorisé à cette tâche");
      }

      await task.update({ status }, { transaction });

      // ✅ Facturation automatique seulement si passage à "completed"
      if (previousStatus !== "completed" && status === "completed" && !task.is_billed) {
        const user = await User.findByPk(userId, { transaction });

        let invoice = await Invoice.findOne({
          where: {
            user_id: userId,
            project_id: project.id,
            status: "draft",
          },
          transaction,
        });

        if (!invoice) {
          const year = new Date().getFullYear();
          const count = await Invoice.count({
            where: {
              user_id: userId,
              createdAt: {
                [Op.gte]: new Date(`${year}-01-01`),
                [Op.lt]: new Date(`${year + 1}-01-01`),
              },
            },
            transaction,
          });

          const paddedCount = (count + 1).toString().padStart(3, "0");
          const number = `FAC-${year}-${paddedCount}`;

          invoice = await Invoice.create({
            number,
            project_id: project.id,
            user_id: userId,
            client_id: project.client_id,
            issue_date: new Date(),
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: "draft",
            type: "project",
            currency: user?.currency || "EUR",
            notes: `Facture automatique pour le projet: ${project.name}`,
            total_ht: 0,
            total_tva: 0,
            total_ttc: 0,
          }, { transaction });
        }

        const unitPrice = task.hourly_rate || project.hourly_rate || user?.hourly_rate || 0;
        await invoiceItemService.createItem({
          invoiceId: invoice.id,
          taskId: task.id,
          userId,
          unitPrice,
          description: task.title,
          Nb_heure: task.hours_worked || 0,
        });

        await task.update({ is_billed: true }, { transaction });
      }

      await transaction.commit();
      return await Task.findByPk(taskId, { 
        include: [{ model: Project, include: [User] }] 
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export default new TaskService();
