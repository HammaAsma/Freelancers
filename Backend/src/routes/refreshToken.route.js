import { Router } from 'express';
import { refreshTokenValidationRules } from '../controllers/refreshToken.controller.js';
import { authenticate as authMiddleware } from '../middlewares/auth.middleware.js';
import RefreshTokenController from '../controllers/refreshToken.controller.js';

const router = Router();

// Rafraîchir un jeton d'accès
router.post(
  '/refresh-token',
  refreshTokenValidationRules.refresh,
  RefreshTokenController.refreshToken
);

// Révoquer un jeton (déconnexion)
router.post(
  '/revoke-token',
  authMiddleware,
  refreshTokenValidationRules.revoke,
  RefreshTokenController.revokeToken
);

// Révoquer tous les jetons de l'utilisateur (déconnexion de tous les appareils)
router.post(
  '/revoke-all-tokens',
  authMiddleware,
  RefreshTokenController.revokeAllTokens
);

export default router;