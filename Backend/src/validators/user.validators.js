import { body } from 'express-validator';
import User from '../models/user.js';

// Options communes de validation
const nameValidation = body('firstName', 'Le prénom est requis')
  .trim()
  .notEmpty()
  .isLength({ max: 50 })
  .withMessage('Le prénom ne doit pas dépasser 50 caractères');

const emailValidation = body('email')
  .trim()
  .notEmpty()
  .withMessage('L\'email est requis')
  .isEmail()
  .withMessage('Veuillez fournir un email valide')
  .normalizeEmail()
  .custom(async (email) => {
    const user = await User.findOne({ where: { email } });
    if (user) {
      throw new Error('Cet email est déjà utilisé');
    }
    return true;
  });

const passwordValidation = body('password')
  .isLength({ min: 8 })
  .withMessage('Le mot de passe doit contenir au moins 8 caractères')
  .matches(/\d/)
  .withMessage('Le mot de passe doit contenir au moins un chiffre')
  .matches(/[a-z]/)
  .withMessage('Le mot de passe doit contenir au moins une lettre minuscule')
  .matches(/[A-Z]/)
  .withMessage('Le mot de passe doit contenir au moins une lettre majuscule');

// Validateurs pour les routes spécifiques
export const registerValidator = [
  nameValidation,
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ max: 50 })
    .withMessage('Le nom ne doit pas dépasser 50 caractères'),
  emailValidation,
  passwordValidation,
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    })
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('L\'email est requis')
    .isEmail()
    .withMessage('Veuillez fournir un email valide')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
];

export const updateProfileValidator = [
  nameValidation.optional(),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ max: 50 })
    .withMessage('Le nom ne doit pas dépasser 50 caractères'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Veuillez fournir un email valide')
    .normalizeEmail()
    .custom(async (email, { req }) => {
      if (email) {
        const user = await User.findOne({ where: { email } });
        if (user && user.id !== req.user.id) {
          throw new Error('Cet email est déjà utilisé');
        }
      }
      return true;
    })
];

export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Le mot de passe actuel est requis'),
  body('newPassword')
    .notEmpty()
    .withMessage('Le nouveau mot de passe est requis')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/\d/)
    .withMessage('Le mot de passe doit contenir au moins un chiffre')
    .matches(/[a-z]/)
    .withMessage('Le mot de passe doit contenir au moins une lettre minuscule')
    .matches(/[A-Z]/)
    .withMessage('Le mot de passe doit contenir au moins une lettre majuscule')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('Le nouveau mot de passe doit être différent de l\'ancien');
      }
      return true;
    }),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    })
];

export const deleteAccountValidator = [
  body('password')
    .notEmpty()
    .withMessage('La confirmation du mot de passe est requise')
];