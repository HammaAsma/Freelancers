import express from "express";
import invoiceController from "../controllers/invoice.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { invoiceValidationRules } from "../controllers/invoice.controller.js";

const router = express.Router();

// Middleware d'authentification
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
 *     Invoice:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         project_id: { type: integer, example: 1 }
 *         client_id: { type: integer, example: 1 }
 *         invoice_number: { type: string, example: "INV-2025-001" }
 *         status: {
 *           type: string,
 *           enum: [draft, sent, paid, overdue],
 *           example: "draft"
 *         }
 *         total_ht: { type: number, example: 2275.00 }
 *         total_ttc: { type: number, example: 2730.00 }
 *         due_date: { type: string, format: date, example: "2025-12-31" }
 *     InvoiceStatusUpdate:
 *       type: object
 *       properties:
 *         status: {
 *           type: string,
 *           enum: [draft, sent, paid, overdue],
 *           example: "sent"
 *         }
 */

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Lister toutes les factures
 *     tags: [Invoices]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [draft, sent, paid, overdue] }
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1 }
 *       - name: limit
 *         in: query
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Liste des factures
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoices:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Invoice' }
 *                 total: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get("/", invoiceController.getAllInvoices);

/**
 * @swagger
 * /invoices/{id}/download:
 *   get:
 *     summary: Télécharger facture PDF
 *     tags: [Invoices]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: PDF de la facture
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404: { description: Facture non trouvée }
 */
router.get("/:id/download", invoiceController.downloadInvoicePdf);

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Récupérer une facture
 *     tags: [Invoices]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Facture trouvée
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Invoice' }
 *       404: { description: Facture non trouvée }
 */
router.get("/:id", invoiceController.getInvoiceById);

/**
 * @swagger
 * /invoices/project/{projectId}:
 *   post:
 *     summary: Créer facture pour un projet
 *     tags: [Invoices]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               due_date: { type: string, format: date }
 *               hourly_rate: { type: number, example: 50.00 }
 *     responses:
 *       201:
 *         description: Facture créée
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Invoice' }
 *       404: { description: Projet non trouvé }
 */
router.post("/project/:projectId", invoiceController.createProjectInvoice);

/**
 * @swagger
 * /invoices/{id}/status:
 *   patch:
 *     summary: Changer statut facture
 *     tags: [Invoices]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/InvoiceStatusUpdate' }
 *     responses:
 *       200:
 *         description: Statut mis à jour
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Invoice' }
 *       400: { description: Statut invalide }
 *       404: { description: Facture non trouvée }
 */
router.patch(
  "/:id/status",
  invoiceValidationRules.updateStatus,
  invoiceController.updateStatus
);

/**
 * @swagger
 * /invoices/{id}:
 *   delete:
 *     summary: Supprimer une facture
 *     tags: [Invoices]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Facture supprimée }
 *       404: { description: Facture non trouvée }
 */
router.delete("/:id", invoiceController.deleteInvoice);

export default router;
