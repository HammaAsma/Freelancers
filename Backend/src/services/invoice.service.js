import Invoice from "../models/invoice.model.js";
import InvoiceItem from "../models/invoiceItem.model.js";
import Client from "../models/client.model.js";
import Project from "../models/project.model.js";
import User from "../models/user.js";
import Task from "../models/task.model.js";
import { Op } from "sequelize";
import db from "../config/db.js";

class InvoiceService {
  // Toutes les factures avec filtres avancés ✅
  async getAll({
    page = 1,
    limit = 10,
    userId,
    status = null,
    clientId = null,
    dateFrom = null,
    dateTo = null,
  }) {
    const offset = (page - 1) * limit;
    const where = { user_id: userId };

    if (status && status !== "all") where.status = status;
    if (clientId) where.client_id = clientId;
    if (dateFrom || dateTo) {
      where.issue_date = {};
      if (dateFrom) where.issue_date[Op.gte] = new Date(dateFrom);
      if (dateTo) where.issue_date[Op.lte] = new Date(dateTo);
    }

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      limit: +limit,
      offset,
      order: [["issue_date", "DESC"]],
      include: [
        {
          model: Client,
          attributes: ["id", "name", "contact_email", "billing_address"],
          required: true,
        },
        {
          model: InvoiceItem,
          attributes: ["id", "description", "total"],
          required: false,
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

  // Une facture complète ✅
  async getOne(userId, invoiceId) {
    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
      throw new Error("ID de facture invalide");
    }

    const invoice = await Invoice.findOne({
      where: { id: invoiceId, user_id: userId },
      include: [
        {
          model: Client,
          attributes: [
            "id",
            "name",
            "type",
            "contact_email",
            "contact_phone",
            "billing_address",
          ],
        },
        {
          model: InvoiceItem,
          include: [
            {
              model: Task,
              include: [Project],
            },
          ],
        },
        Project,
      ],
    });

    if (!invoice) throw new Error("Facture non trouvée");
    return invoice;
  }

  // Tâches facturables ✅
  async getBillableTasksForProject(projectId) {
    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: Task,
          where: {
            status: "completed",
            is_billed: false,
          },
          required: false,
        },
      ],
    });

    if (!project) throw new Error("Projet non trouvé");
    if (project.status !== "completed") {
      throw new Error(
        "Le projet doit être marqué comme terminé pour être facturé"
      );
    }
    if (!project.Tasks || project.Tasks.length === 0) {
      throw new Error("Aucune tâche terminée à facturer pour ce projet");
    }

    return project.Tasks;
  }

  // Création facture projet ✅
  async createProjectInvoice(projectId, userId) {
    const transaction = await db.transaction();

    try {
      const tasks = await this.getBillableTasksForProject(projectId);
      const project = await Project.findByPk(projectId, { transaction });
      const user = await User.findByPk(userId, { transaction });

      if (!project || project.user_id !== userId) {
        throw new Error("Projet non autorisé");
      }

      const invoiceNumber = await this.generateInvoiceNumber(userId);
      const invoice = await Invoice.create(
        {
          number: invoiceNumber,
          project_id: projectId,
          user_id: userId,
          client_id: project.client_id,
          issue_date: new Date(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "draft",
          type: "project",
          currency: user.currency || "EUR",
          notes: `Facture pour le projet: ${project.name}`,
          total_ht: 0,
          total_tva: 0,
          total_ttc: 0,
        },
        { transaction }
      );

      // Créer lignes pour chaque tâche
      for (const task of tasks) {
        let unitPrice, totalHt, nbHeures;

        if (project.billing_type === "fixed") {
          unitPrice = parseFloat(
            (project.fixed_amount / tasks.length).toFixed(2)
          );
          totalHt = unitPrice;
          nbHeures = 1;
        } else {
          unitPrice = parseFloat(
            task.hourly_rate || project.hourly_rate || user.hourly_rate || 0
          );
          totalHt = parseFloat((task.hours_worked * unitPrice).toFixed(2));
          nbHeures = parseFloat(task.hours_worked);
        }

        await InvoiceItem.create(
          {
            invoice_id: invoice.id,
            task_id: task.id,
            project_id: projectId,
            description: `Tâche: ${task.title}`,
            Nb_heure: nbHeures,
            unit_price: unitPrice,
            total: totalHt,
          },
          { transaction }
        );

        await task.update({ is_billed: true }, { transaction });
      }

      const totals = await this.calculateInvoiceTotals(invoice.id, transaction);
      await invoice.update(totals, { transaction });

      await transaction.commit();
      return await this.getOne(userId, invoice.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Calcul totaux précis ✅
  async calculateInvoiceTotals(invoiceId, transaction = null) {
    const options = {
      where: { invoice_id: invoiceId },
      attributes: [[db.fn("SUM", db.col("total")), "total_ht"]],
      raw: true,
      transaction,
    };

    const result = await InvoiceItem.findOne(options);
    const total_ht = parseFloat(result?.total_ht || 0);
    const total_tva = 0; // À implémenter
    const total_ttc = total_ht;

    return {
      total_ht: parseFloat(total_ht.toFixed(2)),
      total_tva: parseFloat(total_tva.toFixed(2)),
      total_ttc: parseFloat(total_ttc.toFixed(2)),
    };
  }

  // Numéro unique ✅
  async generateInvoiceNumber(userId) {
    const year = new Date().getFullYear();
    const count = await Invoice.count({
      where: {
        user_id: userId,
        createdAt: {
          [Op.gte]: new Date(`${year}-01-01`),
          [Op.lt]: new Date(`${year + 1}-01-01`),
        },
      },
    });

    const paddedCount = (count + 1).toString().padStart(3, "0");
    return `FAC-${year}-${paddedCount}`;
  }

  // Mise à jour statut ✅
  async updateStatus(userId, invoiceId, status) {
    const invoice = await this.getOne(userId, invoiceId);

    if (!["draft", "sent", "paid", "overdue"].includes(status)) {
      throw new Error("Statut invalide");
    }

    await invoice.update({ status });
    return invoice;
  }

  // Suppression sécurisée ✅
  async delete(userId, invoiceId) {
    const invoice = await this.getOne(userId, invoiceId);

    // Supprimer lignes associées
    await InvoiceItem.destroy({ where: { invoice_id: invoiceId } });
    await invoice.destroy();
    return true;
  }
}

export default new InvoiceService();
