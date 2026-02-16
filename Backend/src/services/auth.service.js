import User from "../models/user.js";
import RefreshToken from "../models/refreshToken.model.js";
import bcrypt from "bcryptjs";
import { createTokens } from '../utils/jwt.js';
import refreshTokenService from './refreshToken.service.js';

class AuthService {
  /**
   * @param {Object} data - Données de l'utilisateur
   * @returns {Promise<Object>} Utilisateur créé et tokens
   */
  async register(data) {
    const { email, password, ...rest } = data;

    const exist = await User.findOne({ where: { email } });
    if (exist) throw new Error("Email déjà utilisé");

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash, ...rest });

    // Génération des tokens avec le nouveau système
    const { accessToken, refreshToken } = await createTokens(user);

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  /**
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe en clair
   * @returns {Promise<Object>} Utilisateur et tokens
   */
  async login(email, password) {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error("Utilisateur introuvable");

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error("Mot de passe incorrect");

    // Génération des tokens avec le nouveau système
    const { accessToken, refreshToken } = await createTokens(user);

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  /**
   * @param {string} refreshToken - Token de rafraîchissement
   * @returns {Object} Nouveaux tokens
   */
  async refreshToken(refreshToken) {
    const { valid, user } = await refreshTokenService.verifyToken(refreshToken);
    
    if (!valid || !user) {
      throw new Error('Jeton de rafraîchissement invalide ou expiré');
    }

    // Révocation de l'ancien jeton
    await refreshTokenService.revokeToken(refreshToken);

    // Création de nouveaux jetons
    const { accessToken, refreshToken: newRefreshToken } = await createTokens(user);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email
      }
    };
  }

  /**
   * @param {string} refreshToken - Token de rafraîchissement 
   * @returns {Promise<boolean>} Succès de la déconnexion
   */
  async logout(refreshToken) {
    if (!refreshToken) {
      throw new Error('Le jeton de rafraîchissement est requis');
    }
    
    await refreshTokenService.revokeToken(refreshToken);
    return true;
  }

  /**
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<boolean>} Succès de la déconnexion de tous les appareils
   */
  async logoutAllDevices(userId) {
    await refreshTokenService.revokeAllUserTokens(userId);
    return true;
  }
}

export default new AuthService();