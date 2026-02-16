import jwt from 'jsonwebtoken';
import refreshTokenService from '../services/refreshToken.service.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables');
}

export const createTokens = async (user) => {
  // Créer un jeton d'accès
  const accessToken = jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Créer et sauvegarder un jeton de rafraîchissement
  const refreshToken = await refreshTokenService.createToken(user.id);

  return {
    accessToken,
    refreshToken: refreshToken.token
  };
};