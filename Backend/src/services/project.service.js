import Project from "../models/project.model.js";
import Client from "../models/client.model.js";
import Task from "../models/task.model.js";

class ProjectService {
  /**
   * Récupère tous les projets avec filtres et pagination
   * @param {Object} params
   * @param {number} params.page
   * @param {number} params.limit
   * @param {number} params.userId
   * @param {string|null} params.status
   * @param {string|null} params.billing_type
   * @param {number|null} params.clientId
   * @param {string} params.search
   */
  async getAll({
    page = 1,
    limit = 10,
    userId,
    status = null,
    billing_type = null,
    clientId = null,
    search = "",
  }) {
    const offset = (page - 1) * limit;

    const where = { user_id: userId };

    // Filtres
    if (status && status !== "all") where.status = status;
    if (billing_type && billing_type !== "all")
      where.billing_type = billing_type;
    if (clientId) where.client_id = clientId;

    // Recherche (Postgres iLike ; adapte pour MySQL si besoin)
    if (search) {
      const { Op } = Project.sequelize;
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Project.findAndCountAll({
      where,
      limit: +limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Client,
          attributes: ["id", "name", "type", "contact_email"],
          required: true,
        },
      ],
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

  /**
   * Récupère un projet appartenant à un user (optionnellement lié à un client)
   * @param {number} userId
   * @param {number} projectId
   * @param {number|null} clientId
   */
  async getOne(userId, projectId, clientId = null) {
    const where = {
      id: projectId,
      user_id: userId,
    };
    if (clientId) {
      where.client_id = clientId;
    }

    const project = await Project.findOne({
      where,
      include: [
        {
          model: Client,
          attributes: ["id", "name", "type", "contact_email"],
        },
        {
          model: Task,
          attributes: ["id", "title", "status", "hours_worked"],
        },
      ],
    });

    if (!project) throw new Error("Project not Found");
    return project;
  }

  /**
   * Création d'un projet pour un user donné
   * @param {number} userId
   * @param {Object} data
   */
  async create(userId, data) {
    // Vérifier que le client appartient bien à ce user
    const client = await Client.findOne({
      where: { id: data.client_id, user_id: userId },
    });
    if (!client) throw new Error("Client not found");

    // Validation billing_type
    const billingType = data.billing_type;
    if (billingType === "hourly" && !data.hourly_rate) {
      throw new Error("Hourly rate required for hourly billing");
    }
    if (billingType === "fixed" && !data.fixed_amount) {
      throw new Error("Fixed amount required for fixed billing");
    }

    return await Project.create({
      ...data,
      user_id: userId,
      status: data.status || "planning",
    });
  }

  /**
   * Mise à jour d'un projet appartenant à un user
   * @param {number} userId
   * @param {number} projectId
   * @param {Object} data
   */
  async update(userId, projectId, data) {
    const project = await this.getOne(userId, projectId);

    // Validation billing_type lors de la mise à jour
    if (data.billing_type) {
      if (data.billing_type === "hourly" && !data.hourly_rate) {
        throw new Error("Hourly rate required for hourly billing");
      }
      if (data.billing_type === "fixed" && !data.fixed_amount) {
        throw new Error("Fixed amount required for fixed billing");
      }
    }

    return await project.update(data);
  }

  /**
   * Soft delete (passe le projet en on_hold) pour un user
   * @param {number} userId
   * @param {number} projectId
   */
  async delete(userId, projectId) {
    const project = await this.getOne(userId, projectId);
    await project.update({ status: "on_hold" });
    return true;
  }

  /**
   * Statistiques d'un projet (tâches + temps + coût) pour un user
   * @param {number} userId
   * @param {number} projectId
   */
  async getProjectStats(userId, projectId) {
    const project = await this.getOne(userId, projectId);

    const taskCounts = await Task.findAll({
      where: { project_id: projectId },
      attributes: [
        "status",
        [Task.sequelize.fn("COUNT", Task.sequelize.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    const timeStats = await Task.findOne({
      where: { project_id: projectId },
      attributes: [
        [
          Task.sequelize.fn("SUM", Task.sequelize.col("hours_worked")),
          "totalHours",
        ],
      ],
      raw: true,
    });

    let totalCost = 0;
    if (project.billing_type === "fixed") {
      totalCost = parseFloat(project.fixed_amount || 0);
    } else if (project.billing_type === "hourly") {
      totalCost =
        parseFloat(timeStats?.totalHours || 0) *
        parseFloat(project.hourly_rate || 0);
    }

    return {
      taskCounts: taskCounts || [],
      totalHours: parseFloat(timeStats?.totalHours || 0).toFixed(2),
      totalCost: totalCost.toFixed(2),
      billingType: project.billing_type,
      hourlyRate: project.hourly_rate,
      fixedAmount: project.fixed_amount,
      status: project.status,
    };
  }
}

export default new ProjectService();
