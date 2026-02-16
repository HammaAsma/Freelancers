import  RefreshToken  from '../models/refreshToken.model.js';
import User  from '../models/user.js';
import crypto from 'crypto';
import { Op } from 'sequelize';

class RefreshTokenService {
  // Créer un nouveau jeton de rafraîchissement
  /**
   * 
   * @param {*} userId 
   * @returns {Object} refreshToken
   */
  async createToken(userId) {
    // Révoquer tous les jetons existants pour cet utilisateur
    await RefreshToken.update(
      { revoked_at: new Date() },
      { 
        where: { 
          user_id: userId,
          revoked_at: null 
        } 
      }
    );

    // Créer un nouveau jeton
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

    return await RefreshToken.create({
      user_id: userId,
      token,
      expires_at: expiresAt
    });
  }

  // Trouver un jeton par sa valeur
  /**
   * 
   * @param {String} token 
   * @returns {Object} refreshToken
   */
  async findToken(token) {
    return await RefreshToken.findOne({
      where: {
        token,
        revoked_at: null,
        expires_at: { [Op.gt]: new Date() }
      },
      include: [{
        model: User,
        attributes: ['id', 'email']
      }]
    });
  }

  // Révoquer un jeton
  /**
   * 
   * @param {String} token 
   * @returns {Object} refreshToken
   */
  async revokeToken(token) {
    return await RefreshToken.update(
      { revoked_at: new Date() },
      { 
        where: { 
          token,
          revoked_at: null 
        } 
      }
    );
  }

  // Révoquer tous les jetons d'un utilisateur
  /**
   * 
   * @param {Number} userId 
   * @returns {Object} refreshToken
   */
  async revokeAllUserTokens(userId) {
    return await RefreshToken.update(
      { revoked_at: new Date() },
      { 
        where: { 
          user_id: userId,
          revoked_at: null 
        } 
      }
    );
  }

  // Vérifier si un jeton est valide
  /**
   * 
   * @param {String} token 
   * @returns {Object} refreshToken
   */
  async verifyToken(token) {
    const refreshToken = await this.findToken(token);
    
    if (!refreshToken) {
      return { valid: false, user: null };
    }

    return { 
      valid: true, 
      user: refreshToken.User 
    };
  }
}

export default new RefreshTokenService();