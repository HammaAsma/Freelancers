import { validationResult , body } from 'express-validator';
import authService from '../services/auth.service.js';

export class AuthController {
  static validationRules = {
    register: [
      body('email').isEmail().withMessage('Email invalide'),
      body('password')
        .isLength({ min: 8 })
        .withMessage('Le mot de passe doit contenir au moins 8 caractères'),
    ],
    login: [
      body('email').isEmail().withMessage('Email invalide'),
      body('password').exists().withMessage('Le mot de passe est requis'),
    ],
  };

  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          message: 'Erreur de validation',
          errors: errors.array() 
        });
      }

      const { user, accessToken, refreshToken } = await authService.register(req.body);
      
      res.status(201).json({
        success: true,
        data: {
          user,
          accessToken,
          refreshToken,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          message: 'Erreur de validation',
          errors: errors.array() 
        });
      }

      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.login(email, password);
      
      res.json({
        success: true,
        data: {
          user,
          accessToken,
          refreshToken,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  async logoutAllDevices(req, res, next) {
    try {
      await authService.logoutAllDevices(req.user.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
