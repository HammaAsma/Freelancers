import { validationResult, body } from "express-validator";
import invoiceService from "../services/invoice.service.js";
import PDFDocument from "pdfkit";

class InvoiceController {
  async getAllInvoices(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        clientId,
        dateFrom,
        dateTo,
      } = req.query;

      const result = await invoiceService.getAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        userId: req.user.id,
        status: status || null,
        clientId: clientId ? parseInt(clientId) : null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceById(req, res, next) {
    try {
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) {
        return res.status(400).json({
          success: false,
          message: "ID de facture invalide",
        });
      }

      const invoice = await invoiceService.getOne(req.user.id, invoiceId);
      res.json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  async createProjectInvoice(req, res, next) {
    try {
      const { projectId } = req.params;
      const invoice = await invoiceService.createProjectInvoice(
        parseInt(projectId),
        req.user.id
      );

      res.status(201).json({
        success: true,
        data: invoice,
        message: "Facture projet créée",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const invoiceId = parseInt(req.params.id);
      const { status } = req.body;

      const invoice = await invoiceService.updateStatus(
        req.user.id,
        invoiceId,
        status
      );

      res.json({
        success: true,
        data: invoice,
        message: "Statut facture mis à jour",
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteInvoice(req, res, next) {
    try {
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) {
        return res.status(400).json({
          success: false,
          message: "ID de facture invalide",
        });
      }

      await invoiceService.delete(req.user.id, invoiceId);
      res.json({
        success: true,
        message: "Facture supprimée avec succès",
      });
    } catch (error) {
      next(error);
    }
  }

  async downloadInvoicePdf(req, res, next) {
    try {
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) {
        return res.status(400).json({
          success: false,
          message: "ID de facture invalide",
        });
      }

      const invoice = await invoiceService.getOne(req.user.id, invoiceId);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=facture-${invoice.number}.pdf`
      );

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      doc.pipe(res);

      // Header
      doc.fontSize(24).font("Helvetica-Bold").text("FACTURE", 50, 50);
      doc.fontSize(12).font("Helvetica").text(`N° ${invoice.number}`, 400, 50);
      doc.text(
        `Date: ${new Date(invoice.issue_date).toLocaleDateString("fr-FR")}`,
        400,
        75
      );
      doc.text(
        `Échéance: ${new Date(invoice.due_date).toLocaleDateString("fr-FR")}`,
        400,
        95
      );

      // Client
      doc
        .moveDown(2)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("FACTURÉ À:", 50);
      if (invoice.Client) {
        doc
          .font("Helvetica")
          .text(invoice.Client.name, 50, doc.y)
          .text(invoice.Client.billing_address || "", 50, doc.y + 15)
          .text(invoice.Client.contact_email || "", 50, doc.y + 30);
      }

      // Tableau items
      let y = doc.y + 40;
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Description", 50, y)
        .text("Qte", 350, y)
        .text("PU HT", 410, y)
        .text("Total HT", 500, y, { align: "right" });

      y += 25;
      let totalHT = 0;

      if (invoice.InvoiceItems?.length > 0) {
        invoice.InvoiceItems.forEach((item) => {
          const total = parseFloat(item.total || 0);
          totalHT += total;

          doc
            .font("Helvetica")
            .text(item.description.substring(0, 40), 50, y, { width: 290 })
            .text(item.Nb_heure?.toFixed(2) || "0", 350, y)
            .text(
              `${(item.unit_price || 0).toFixed(2)} ${invoice.currency}`,
              410,
              y
            )
            .text(`${total.toFixed(2)} ${invoice.currency}`, 500, y, {
              align: "right",
            });

          y += 25;
        });
      }

      // Totaux
      doc
        .moveTo(350, y + 20)
        .lineTo(550, y + 20)
        .lineWidth(2)
        .stroke();
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("TOTAL HT", 350, y + 25)
        .text(`${totalHT.toFixed(2)} ${invoice.currency}`, 500, y + 25, {
          align: "right",
        });

      doc.end();
    } catch (error) {
      next(error);
    }
  }
}

// Validation rules
export const invoiceValidationRules = {
  updateStatus: [
    body("status")
      .isIn(["draft", "sent", "paid", "overdue"])
      .withMessage("Statut invalide"),
  ],
};

export default new InvoiceController();
