import { Router } from "express";
import invoiceItemController, {
  invoiceItemValidationRules,
} from "../controllers/invoiceItem.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Authentification
router.use(authenticate);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     InvoiceItem:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         invoice_id: { type: integer, example: 1 }
 *         task_id: { type: integer, example: 1 }
 *         description: { type: string, example: "Développement page login" }
 *         quantity: { type: number, example: 4.2 }
 *         unit_price: { type: number, example: 50.00 }
 *         total_ht: { type: number, example: 210.00 }
 *         task_name: { type: string, example: "Implémenter auth JWT" }
 */

/**
 * @swagger
 * /invoices/{invoiceId}/items:
 *   post:
 *     summary: Ajouter un élément à une facture
 *     tags: [Invoice Items]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: invoiceId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceItem'
 *     responses:
 *       201:
 *         description: Élément ajouté
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/InvoiceItem' }
 *       400: { description: Données invalides }
 *       404: { description: Facture non trouvée }
 */
router.post(
  "/invoices/:invoiceId/items",
  invoiceItemValidationRules.create,
  invoiceItemController.createItem
);

/**
 * @swagger
 * /invoices/{invoiceId}/items:
 *   get:
 *     summary: Lister éléments d'une facture
 *     tags: [Invoice Items]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: invoiceId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liste des éléments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/InvoiceItem' }
 *                 total_ht: { type: number, example: 2275.00 }
 */
router.get(
  "/invoices/:invoiceId/items",
  invoiceItemController.getItemsByInvoice
);

/**
 * @swagger
 * /invoices/{invoiceId}/items/{id}:
 *   put:
 *     summary: Modifier un élément de facture
 *     tags: [Invoice Items]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: invoiceId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceItem'
 *     responses:
 *       200:
 *         description: Élément mis à jour
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/InvoiceItem' }
 *       404: { description: Élément ou facture non trouvée }
 */
router.put(
  "/invoices/:invoiceId/items/:id",
  invoiceItemValidationRules.update,
  invoiceItemController.updateItem
);

/**
 * @swagger
 * /invoices/{invoiceId}/items/{id}:
 *   delete:
 *     summary: Supprimer un élément de facture
 *     tags: [Invoice Items]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: invoiceId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Élément supprimé }
 *       404: { description: Élément ou facture non trouvée }
 */
router.delete(
  "/invoices/:invoiceId/items/:id",
  invoiceItemController.deleteItem
);

export default router;
