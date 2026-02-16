import clientService from "../services/client.service.js";
import { validationResult, body } from "express-validator";

// Règles de validation corrigées
export const clientValidationRules = {
  // Règles pour la création - champs optionnels respectent le modèle
  create: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Le nom est requis")
      .isLength({ min: 2, max: 255 })
      .withMessage("Le nom doit contenir entre 2 et 255 caractères"),

    body("type")
      .optional({ checkFalsy: true })
      .isIn(["company", "individual"])
      .withMessage('Le type doit être "company" ou "individual"'),

    body("contact_name")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 2 })
      .withMessage("Le nom de contact doit contenir au moins 2 caractères"),

    body("contact_email")
      .optional({ checkFalsy: true })
      .trim()
      .isEmail()
      .withMessage("Email invalide")
      .normalizeEmail(),

    body("contact_phone")
      .optional({ checkFalsy: true })
      .trim()
      .matches(/^[0-9\s\-\+\(\)]+$/)
      .withMessage("Format de téléphone invalide"),

    body("billing_address")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage("L'adresse ne peut pas dépasser 500 caractères"),
  ],

  // Règles pour la mise à jour (tous les champs optionnels)
  update: [
    body("name")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage("Le nom doit contenir entre 2 et 255 caractères"),

    body("type")
      .optional({ checkFalsy: true })
      .isIn(["company", "individual"])
      .withMessage('Le type doit être "company" ou "individual"'),

    body("contact_name")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 2 })
      .withMessage("Le nom de contact doit contenir au moins 2 caractères"),

    body("contact_email")
      .optional({ checkFalsy: true })
      .trim()
      .isEmail()
      .withMessage("Email invalide")
      .normalizeEmail(),

    body("contact_phone")
      .optional({ checkFalsy: true })
      .trim()
      .matches(/^[0-9\s\-\+\(\)]+$/)
      .withMessage("Format de téléphone invalide"),

    body("billing_address")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage("L'adresse ne peut pas dépasser 500 caractères"),
  ],
};

class ClientController {
  // Récupérer tous les clients avec pagination ✅
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await clientService.getAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        userId: req.user.id,
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

  // Récupérer un client par ID ✅
  async getOne(req, res, next) {
    try {
      const clientId = parseInt(req.params.id); // ✅ Conversion en nombre
      if (isNaN(clientId)) {
        return res.status(400).json({
          success: false,
          message: "ID de client invalide",
        });
      }

      const client = await clientService.getOne(clientId, req.user.id);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client non trouvé",
        });
      }

      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  // Créer un client ✅
  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const clientData = {
        ...req.body,
        user_id: req.user.id,
      };

      const client = await clientService.create(clientData);

      res.status(201).json({
        success: true,
        data: client,
        message: "Client créé avec succès",
      });
    } catch (error) {
      next(error);
    }
  }

  // Mettre à jour un client ✅
  async update(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const clientId = parseInt(req.params.id); // ✅ Conversion en nombre
      if (isNaN(clientId)) {
        return res.status(400).json({
          success: false,
          message: "ID de client invalide",
        });
      }

      const client = await clientService.update(
        clientId,
        req.body,
        req.user.id
      );

      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client non trouvé",
        });
      }

      res.json({
        success: true,
        data: client,
        message: "Client mis à jour avec succès",
      });
    } catch (error) {
      next(error);
    }
  }

  // Supprimer un client ✅
  async remove(req, res, next) {
    try {
      const clientId = parseInt(req.params.id); // ✅ Conversion en nombre
      if (isNaN(clientId)) {
        return res.status(400).json({
          success: false,
          message: "ID de client invalide",
        });
      }

      const deleted = await clientService.remove(clientId, req.user.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Client non trouvé",
        });
      }

      res.json({
        success: true,
        message: "Client supprimé avec succès",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ClientController();
