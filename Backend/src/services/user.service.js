import User from "../models/user.js";
import RefreshToken from "../models/refreshToken.model.js";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";

class UserService {
  // Récupérer profil avec stats ✅
  async getProfile(id) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("ID utilisateur invalide");
    }

    const user = await User.findByPk(id, {
      attributes: {
        exclude: ["password_hash", "createdAt", "updatedAt"],
      },
    });

    if (!user) throw new Error("Utilisateur introuvable");
    return user;
  }

  // Mise à jour profil avec validation ✅
  async updateProfile(id, data) {
    const user = await User.findByPk(id);
    if (!user) throw new Error("Utilisateur introuvable");

    // Nettoyage et validation
    const updateData = {};

    if (data.email !== undefined) {
      const emailExists = await User.findOne({
        where: { email: data.email.toLowerCase().trim(), id: { [Op.ne]: id } },
      });
      if (emailExists) throw new Error("Email déjà utilisé");
      updateData.email = data.email.toLowerCase().trim();
    }

    if (data.first_name !== undefined) {
      updateData.first_name = data.first_name.trim();
    }

    if (data.last_name !== undefined) {
      updateData.last_name = data.last_name.trim();
    }

    if (data.currency !== undefined) {
      updateData.currency = data.currency;
    }

    if (data.company_name !== undefined) {
      updateData.company_name = data.company_name.trim();
    }

    if (data.address !== undefined) {
      updateData.address = data.address.trim();
    }

    if (data.tax_id !== undefined) {
      updateData.tax_id = data.tax_id.trim();
    }

    // Gestion mot de passe séparée
    if (data.password) {
      updateData.password_hash = await bcrypt.hash(data.password, 12);
    }

    const updatedUser = await user.update(updateData);
    return this.getProfile(id); // Retourner profil complet
  }

  // Changement mot de passe sécurisé ✅
  async changePassword(id, currentPassword, newPassword) {
    const user = await User.findByPk(id);
    if (!user) throw new Error("Utilisateur introuvable");

    // Vérification ancien mot de passe
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );
    if (!isPasswordValid) {
      throw new Error("Mot de passe actuel incorrect");
    }

    // Vérifier que nouveau ≠ ancien
    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password_hash
    );
    if (isSamePassword) {
      throw new Error(
        "Le nouveau mot de passe doit être différent de l'actuel"
      );
    }

    // Validation complexité mot de passe
    if (newPassword.length < 8) {
      throw new Error("Le mot de passe doit contenir au moins 8 caractères");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await user.update({ password_hash: hashedPassword });

    return { success: true, message: "Mot de passe mis à jour avec succès" };
  }

  // Suppression compte avec vérification mot de passe ✅
  async deleteAccount(id, password) {
    const user = await User.findByPk(id);
    if (!user) throw new Error("Utilisateur introuvable");

    // Vérification mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error("Mot de passe incorrect");
    }

    // Supprimer refresh tokens
    await RefreshToken.destroy({ where: { user_id: id } });

    // Soft delete au lieu de hard delete
    await user.update({
      is_active: false,
      first_name: "[SUPPRIMÉ]",
      last_name: "[SUPPRIMÉ]",
      email: `deleted_${id}_${Date.now()}@example.com`,
    });

    return true;
  }

  // Méthode utilitaire pour contrôleur
  async getUserById(id) {
    return await this.getProfile(id);
  }

  async deleteUser(id, password) {
    return await this.deleteAccount(id, password);
  }
}

export default new UserService();
