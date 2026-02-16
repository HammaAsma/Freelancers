import { validationResult, body } from "express-validator";
import invoiceItemService from "../services/invoiceItem.service.js";

class InvoiceItemController {
  async createItem(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { invoiceId } = req.params;
      const item = await invoiceItemService.createItem({
        invoiceId: parseInt(invoiceId),
        taskId: req.body.taskId ? parseInt(req.body.taskId) : null,
        userId: req.user.id,
        unitPrice: parseFloat(req.body.unitPrice),
        description: req.body.description,
        Nb_heure: parseFloat(req.body.Nb_heure),
      });

      res.status(201).json({
        success: true,
        data: item,
        message: "Ligne de facture créée",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const updatedItem = await invoiceItemService.updateItem({
        id: parseInt(id),
        userId: req.user.id,
        data: {
          description: req.body.description,
          Nb_heure: req.body.Nb_heure
            ? parseFloat(req.body.Nb_heure)
            : undefined,
          unit_price: req.body.unitPrice
            ? parseFloat(req.body.unitPrice)
            : undefined,
        },
      });

      res.json({
        success: true,
        data: updatedItem,
        message: "Ligne de facture mise à jour",
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteItem(req, res, next) {
    try {
      const { id } = req.params;
      await invoiceItemService.deleteItem(parseInt(id), req.user.id);

      res.json({
        success: true,
        message: "Élément de facture supprimé avec succès",
      });
    } catch (error) {
      next(error);
    }
  }

  async getItemsByInvoice(req, res, next) {
    try {
      const { invoiceId } = req.params;
      const items = await invoiceItemService.getItemsByInvoice(
        parseInt(invoiceId),
        req.user.id
      );

      res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Validation rules corrigées et cohérentes
export const invoiceItemValidationRules = {
  create: [
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description requise")
      .isLength({ max: 500 })
      .withMessage("Description trop longue"),
    body("Nb_heure")
      .optional({ checkFalsy: true })
      .isFloat({ min: 0 })
      .withMessage("Nombre d'heures invalide"),
    body("unitPrice").isFloat({ min: 0 }).withMessage("Prix unitaire invalide"),
    body("taskId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("ID de tâche invalide"),
  ],
  update: [
    body("description")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 }),
    body("Nb_heure").optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body("unitPrice").optional({ checkFalsy: true }).isFloat({ min: 0 }),
  ],
};

export default new InvoiceItemController();
