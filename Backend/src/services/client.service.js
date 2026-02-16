import Client from "../models/client.model.js";

class ClientService {
  //get all clients avec filtres et recherche ✅
  /**
   * Récupère tous les clients avec pagination et filtres
   * @param {Object} { page = 1, limit = 10, userId, search, type, isArchived }
   * @returns {Object} clients avec pagination
   */
  async getAll({
    page = 1,
    limit = 10,
    userId,
    search = "",
    type = null,
    isArchived = false,
  }) {
    const offset = (page - 1) * limit;

    // Construction des conditions WHERE
    const where = { user_id: userId };

    // Recherche par nom ou contact
    if (search) {
      where[Client.sequelize.Op.or] = [
        { name: { [Client.sequelize.Op.iLike]: `%${search}%` } },
        { contact_name: { [Client.sequelize.Op.iLike]: `%${search}%` } },
        { contact_email: { [Client.sequelize.Op.iLike]: `%${search}%` } },
      ];
    }

    // Filtre par type
    if (type && type !== "all") {
      where.type = type;
    }

    // Filtre par archivage
    where.is_archived = isArchived === "true" ? true : false;

    const { count, rows } = await Client.findAndCountAll({
      where,
      limit: +limit,
      offset,
      order: [["createdAt", "DESC"]],
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

  //get One client avec include ✅
  /**
   * Récupère un client spécifique avec ses relations
   * @param {Number} clientId
   * @param {Number} userId
   * @returns {Object|null} client ou null
   */
  async getOne(clientId, userId) {
    if (!Number.isInteger(clientId) || clientId <= 0) {
      return null;
    }

    const client = await Client.findOne({
      where: {
        id: clientId,
        user_id: userId,
      },
      include: [
        {
          association: "projects",
          required: false,
        },
      ],
    });

    return client;
  }

  //create Client avec validation ✅
  /**
   * Crée un nouveau client
   * @param {Object} data - Données du client
   * @returns {Object} client créé
   * @throws {Error} si données invalides
   */
  async create(data) {
    // Validation des données obligatoires
    if (!data.name || data.name.trim().length < 2) {
      throw new Error(
        "Le nom du client est requis et doit contenir au moins 2 caractères"
      );
    }

    // Nettoyage des données
    const cleanData = {
      name: data.name.trim(),
      type: data.type || "individual",
      contact_name: data.contact_name?.trim() || null,
      contact_email: data.contact_email?.trim() || null,
      contact_phone: data.contact_phone?.trim() || null,
      billing_address: data.billing_address?.trim() || null,
      note: data.note?.trim() || null,
      is_archived: false,
      user_id: data.user_id,
    };

    const client = await Client.create(cleanData);
    return client;
  }

  //update client avec gestion partielle ✅
  /**
   * Met à jour un client existant
   * @param {Number} clientId
   * @param {Object} data
   * @param {Number} userId
   * @returns {Object|null} client mis à jour ou null
   */
  async update(clientId, data, userId) {
    const client = await this.getOne(clientId, userId);
    if (!client) return null;

    // Nettoyage des données de mise à jour
    const updateData = {};

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (data.type !== undefined) {
      updateData.type = data.type;
    }
    if (data.contact_name !== undefined) {
      updateData.contact_name = data.contact_name?.trim() || null;
    }
    if (data.contact_email !== undefined) {
      updateData.contact_email = data.contact_email?.trim() || null;
    }
    if (data.contact_phone !== undefined) {
      updateData.contact_phone = data.contact_phone?.trim() || null;
    }
    if (data.billing_address !== undefined) {
      updateData.billing_address = data.billing_address?.trim() || null;
    }
    if (data.note !== undefined) {
      updateData.note = data.note?.trim() || null;
    }
    if (data.is_archived !== undefined) {
      updateData.is_archived = !!data.is_archived;
    }

    // Mise à jour seulement si des changements
    if (Object.keys(updateData).length > 0) {
      await client.update(updateData);
    }

    // Rafraîchir pour retourner les données à jour
    return await this.getOne(clientId, userId);
  }

  //remove client avec vérification cascade ✅
  /**
   * Supprime un client (soft delete via is_archived)
   * @param {Number} clientId
   * @param {Number} userId
   * @returns {Boolean} true si supprimé, false sinon
   */
  async remove(clientId, userId) {
    const client = await this.getOne(clientId, userId);
    if (!client) return false;

    // Marquer comme archivé au lieu de hard delete
    await client.update({ is_archived: true });
    return true;
  }

  async getClientStats(userId) {
    const stats = await Client.findAll({
      where: { user_id: userId },
      attributes: [
        "type",
        [Client.sequelize.fn("COUNT", Client.sequelize.col("id")), "count"],
      ],
      group: ["type"],
      raw: true,
    });

    return {
      total: await Client.count({ where: { user_id: userId } }),
      active: await Client.count({
        where: {
          user_id: userId,
          is_archived: false,
        },
      }),
      byType: stats,
    };
  }
}

export default new ClientService();
