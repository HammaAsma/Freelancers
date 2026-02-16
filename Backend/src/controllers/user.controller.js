import { validationResult, body } from "express-validator";
import userService from "../services/user.service.js";
import authService from "../services/auth.service.js";
import {
  setAuthCookies,
  clearAuthCookies,
} from "../middlewares/auth.middleware.js";

class UserController {
  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { user, accessToken, refreshToken } = await authService.register(
        req.body
      );
      setAuthCookies(res, { accessToken, refreshToken });

      const safeUser = user.get({ plain: true });
      delete safeUser.password_hash;

      res.status(201).json({
        success: true,
        data: safeUser,
        message: "Inscription réussie",
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.login(
        email,
        password
      );
      setAuthCookies(res, { accessToken, refreshToken });

      const safeUser = user.get({ plain: true });
      delete safeUser.password_hash;

      res.json({
        success: true,
        data: safeUser,
        message: "Connexion réussie",
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken: token } = req.cookies;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Refresh token manquant",
        });
      }

      const tokens = await authService.refreshToken(token);
      setAuthCookies(res, tokens);

      res.json({
        success: true,
        message: "Token rafraîchi avec succès",
      });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken: token } = req.cookies;
      if (token) {
        await authService.logout(token);
      }

      clearAuthCookies(res);
      res.json({
        success: true,
        message: "Déconnexion réussie",
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const userId = parseInt(req.user.id);
      if (isNaN(userId)) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const user = await userService.getUserById(userId);
      const safeUser = user.get({ plain: true });
      delete safeUser.password_hash;

      res.json({
        success: true,
        data: safeUser,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const userId = parseInt(req.user.id);
      const updatedUser = await userService.updateProfile(userId, req.body);

      const safeUser = updatedUser.get({ plain: true });
      delete safeUser.password_hash;

      res.json({
        success: true,
        data: safeUser,
        message: "Profil mis à jour avec succès",
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const userId = parseInt(req.user.id);
      const { currentPassword, newPassword } = req.body;

      await userService.changePassword(userId, currentPassword, newPassword);
      res.json({
        success: true,
        message: "Mot de passe mis à jour avec succès",
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const userId = parseInt(req.user.id);
      const { password } = req.body;

      await userService.deleteUser(userId, password);
      clearAuthCookies(res);

      res.json({
        success: true,
        message: "Compte supprimé avec succès",
      });
    } catch (error) {
      next(error);
    }
  }
}

// Validation rules (à utiliser dans les routes)
export const userValidationRules = {
  register: [
    body("email").isEmail().withMessage("Email invalide").normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Mot de passe ≥ 8 caractères")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Mot de passe faible"),
    body("first_name").optional().trim().isLength({ min: 2 }),
    body("last_name").optional().trim().isLength({ min: 2 }),
  ],
  login: [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  updateProfile: [
    body("email").optional().isEmail().normalizeEmail(),
    body("first_name").optional().trim().isLength({ min: 2, max: 100 }),
    body("last_name").optional().trim().isLength({ min: 2, max: 100 }),
    body("password").optional().isLength({ min: 8 }),
  ],
  changePassword: [
    body("currentPassword").notEmpty(),
    body("newPassword")
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  ],
  deleteAccount: [body("password").notEmpty()],
};

export default new UserController();
