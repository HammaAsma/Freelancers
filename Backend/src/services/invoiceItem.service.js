import Invoice from "../models/invoice.model.js";
import InvoiceItem from "../models/invoiceItem.model.js";
import Task from "../models/task.model.js";
import Project from "../models/project.model.js";
import TimeEntryService from "./timeEntry.service.js";
import db from "../config/db.js";

class InvoiceItemService {
  constructor() {
    this.timeEntryService = TimeEntryService;
  }

  // Vérification autorisation ✅ (typo corrigé)
  async checkUserTask(userId, taskId) {
    if (!Number.isInteger(taskId) || taskId <= 0) {
      throw new Error("ID de tâche invalide");
    }

    const task = await Task.findOne({
      where: { id: taskId },
      include: [
        {
          model: Project,
          where: { user_id: userId },
          required: true,
        },
      ],
    });

    if (!task) {
      throw new Error("Tâche non trouvée ou accès non autorisé");
    }

    return task;
  }

  // Recalcul totaux avec transaction ✅
  async recalculateInvoice(invoiceId) {
    const transaction = await db.transaction();
    try {
      const items = await InvoiceItem.findAll({
        where: { invoice_id: invoiceId },
        transaction,
      });

      const total_ht = items.reduce((acc, item) => {
        return acc + parseFloat(item.total || 0);
      }, 0);

      await Invoice.update(
        {
          total_ht: parseFloat(total_ht).toFixed(2),
          total_tva: 0, // À implémenter si TVA
          total_ttc: parseFloat(total_ht).toFixed(2),
        },
        {
          where: { id: invoiceId },
          transaction,
        }
      );

      await transaction.commit();
      return { total_ht: parseFloat(total_ht).toFixed(2) };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Création élément avec cohérence ✅
  async createItem({
    invoiceId,
    taskId,
    userId,
    unitPrice = 0,
    description,
    Nb_heure,
  }) {
    // Validation
    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
      throw new Error("ID de facture invalide");
    }

    let task = null;
    let finalNb_heure = Nb_heure;

    // Si taskId fourni, vérifier autorisation et récupérer temps
    if (taskId) {
      task = await this.checkUserTask(userId, taskId);

      if (!finalNb_heure) {
        const seconds = await this.timeEntryService.getTotalTime(
          taskId,
          userId
        );
        finalNb_heure = parseFloat((seconds / 3600).toFixed(2));
      }
    }

    const qty = parseFloat(finalNb_heure || 0);
    const price = parseFloat(unitPrice);
    const total = qty * price;

    const item = await InvoiceItem.create({
      invoice_id: invoiceId,
      task_id: taskId || null,
      project_id: task ? task.project_id : null,
      description: description?.trim() || task?.title || "Prestation",
      Nb_heure: qty,
      unit_price: price,
      total: parseFloat(total.toFixed(2)),
    });

    await this.recalculateInvoice(invoiceId);
    return item;
  }

  // Mise à jour élément ✅
  async updateItem({ id, userId, data }) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("ID d'élément invalide");
    }

    const item = await InvoiceItem.findByPk(id, {
      include: [
        {
          model: Task,
          include: [
            {
              model: Project,
              where: { user_id: userId },
              required: false, // Permet items sans task
            },
          ],
          required: false,
        },
      ],
    });

    if (!item) {
      throw new Error("Élément de facture non trouvé");
    }

    const newNbHeure =
      data.Nb_heure !== undefined ? parseFloat(data.Nb_heure) : item.Nb_heure;
    const newUnitPrice =
      data.unit_price !== undefined
        ? parseFloat(data.unit_price)
        : item.unit_price;
    const total = parseFloat((newNbHeure * newUnitPrice).toFixed(2));

    const updateData = {
      ...data,
      Nb_heure: newNbHeure,
      unit_price: newUnitPrice,
      total,
    };

    await item.update(updateData);
    await this.recalculateInvoice(item.invoice_id);
    return await InvoiceItem.findByPk(id);
  }

  // Suppression élément ✅
  async deleteItem(id, userId) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("ID d'élément invalide");
    }

    const item = await InvoiceItem.findByPk(id, {
      include: [
        {
          model: Task,
          include: [
            {
              model: Project,
              where: { user_id: userId },
              required: false,
            },
          ],
          required: false,
        },
      ],
    });

    if (!item) {
      throw new Error("Élément de facture non trouvé");
    }

    const invoiceId = item.invoice_id;
    await item.destroy();
    await this.recalculateInvoice(invoiceId);
    return true;
  }

  // Récupération éléments ✅
  async getItemsByInvoice(invoiceId, userId) {
    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
      throw new Error("ID de facture invalide");
    }

    return await InvoiceItem.findAll({
      where: { invoice_id: invoiceId },
      include: [
        {
          model: Task,
          include: [
            {
              model: Project,
              where: { user_id: userId },
              required: false,
            },
          ],
          required: false,
        },
      ],
      order: [["createdAt", "ASC"]],
    });
  }
}

export default new InvoiceItemService();
