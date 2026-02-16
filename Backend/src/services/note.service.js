import Note from "../models/note.model.js";
import Project from "../models/project.model.js";
import { Op } from "sequelize";
import db from "../config/db.js";

class NoteService {
  // Créer note avec validation complète ✅
  async createNote({ userId, clientId, projectId, title, content }) {
    // Validation ID
    if (
      !Number.isInteger(userId) ||
      !Number.isInteger(clientId) ||
      !Number.isInteger(projectId)
    ) {
      throw new Error("ID invalides");
    }

    // Vérifier projet + autorisation
    const project = await Project.findOne({
      where: {
        id: projectId,
        user_id: userId,
        client_id: clientId,
      },
    });

    if (!project) {
      throw new Error("Projet non trouvé ou accès non autorisé");
    }

    return await Note.create({
      user_id: userId,
      client_id: clientId,
      project_id: projectId,
      title: title?.trim(),
      content: content?.trim() || null,
    });
  }

  // Note par ID avec includes ✅
  async getNoteById(noteId, userId) {
    if (!Number.isInteger(noteId) || noteId <= 0) {
      throw new Error("ID de note invalide");
    }

    const note = await Note.findOne({
      where: { id: noteId, user_id: userId },
      include: [
        {
          model: Project,
          include: [{ model: Client, attributes: ["name", "contact_email"] }],
        },
      ],
    });

    if (!note) {
      throw new Error("Note non trouvée");
    }

    return note;
  }

  // Mise à jour note ✅
  async updateNote(noteId, userId, updateData) {
    const note = await this.getNoteById(noteId, userId);

    const updateFields = {};
    if (updateData.title !== undefined)
      updateFields.title = updateData.title?.trim();
    if (updateData.content !== undefined)
      updateFields.content = updateData.content?.trim() || null;
    if (updateData.is_pinned !== undefined)
      updateFields.is_pinned = Boolean(updateData.is_pinned);

    return await note.update(updateFields);
  }

  // Suppression ✅
  async deleteNote(noteId, userId) {
    const note = await this.getNoteById(noteId, userId);
    await note.destroy();
    return true;
  }

  // Notes par projet avec filtres avancés ✅
  async getNotesByProject(
    projectId,
    userId,
    {
      page = 1,
      limit = 10,
      pinned = null,
      search = null,
      dateFrom = null,
      dateTo = null,
    } = {}
  ) {
    const offset = (page - 1) * limit;
    const where = { project_id: projectId, user_id: userId };

    if (pinned !== null) where.is_pinned = pinned;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
    }

    const { count, rows } = await Note.findAndCountAll({
      where,
      order: [
        ["is_pinned", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit: +limit,
      offset,
      include: [
        {
          model: Project,
          attributes: ["name", "status"],
        },
      ],
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: +page,
        limit: +limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  // Notes épinglées par client/projet ✅
  async getPinnedNotes(userId, clientId, projectId = null) {
    const where = {
      user_id: userId,
      is_pinned: true,
      client_id: clientId,
    };

    if (projectId) where.project_id = projectId;

    return await Note.findAll({
      where,
      order: [["updatedAt", "DESC"]],
      limit: 10,
      include: [{ model: Project }],
    });
  }

  // Recherche notes globales ✅
  async searchNotes(userId, query, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Note.findAndCountAll({
      where: {
        user_id: userId,
        [Op.or]: [
          { title: { [Op.iLike]: `%${query}%` } },
          { content: { [Op.iLike]: `%${query}%` } },
        ],
      },
      order: [["updatedAt", "DESC"]],
      limit,
      offset,
      include: [{ model: Project }],
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: +page,
        limit: +limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }
}

export default new NoteService();
