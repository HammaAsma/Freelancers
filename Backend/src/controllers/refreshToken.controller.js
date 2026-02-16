import { validationResult, body } from 'express-validator';
import refreshTokenService from '../services/refreshToken.service.js';
import { createTokens } from '../utils/jwt.js'; // Assurez-vous d'avoir cette fonction

class RefreshTokenController {
  // Rafraîchir un jeton d'accès
  async refreshToken(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 400;
        error.data = errors.array();
        throw error;
      }

      const { refreshToken } = req.body;

      // Vérifier le jeton de rafraîchissement
      const { valid, user } = await refreshTokenService.verifyToken(refreshToken);
      
      if (!valid || !user) {
        const error = new Error('Jeton de rafraîchissement invalide ou expiré');
        error.statusCode = 401;
        throw error;
      }

      // Créer de nouveaux jetons
      const { accessToken, refreshToken: newRefreshToken } = await createTokens(user);

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
          user: {
            id: user.id,
            email: user.email
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Révoquer un jeton de rafraîchissement (déconnexion)
  async revokeToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        const error = new Error('Le jeton de rafraîchissement est requis');
        error.statusCode = 400;
        throw error;
      }

      await refreshTokenService.revokeToken(refreshToken);

      res.json({
        success: true,
        message: 'Déconnexion réussie'
      });
    } catch (error) {
      next(error);
    }
  }

  // Révoquer tous les jetons de l'utilisateur (déconnexion de tous les appareils)
  async revokeAllTokens(req, res, next) {
    try {
      await refreshTokenService.revokeAllUserTokens(req.user.id);

      res.json({
        success: true,
        message: 'Déconnexion de tous les appareils réussie'
      });
    } catch (error) {
      next(error);
    }
  }
}

// Règles de validation
export const refreshTokenValidationRules = {
  refresh: [
    body('refreshToken')
      .notEmpty()
      .withMessage('Le jeton de rafraîchissement est requis')
  ],
  revoke: [
    body('refreshToken')
      .notEmpty()
      .withMessage('Le jeton de rafraîchissement est requis')
  ]
};

export default new RefreshTokenController();