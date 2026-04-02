const { Op } = require('sequelize');
const { FinancialRecord, User } = require('../models');

class FinancialService {
  /**
   * Create a new financial record.
   */
  async createRecord(data, userId) {
    const record = await FinancialRecord.create({
      ...data,
      userId,
    });
    return record;
  }

  /**
   * Get records with filtering, search, pagination, and RBAC scoping.
   *
   * @param {Object} query - Validated query params
   * @param {Object} user  - Authenticated user (with role)
   */
  async getRecords(query, user) {
    const {
      type, category, startDate, endDate, search,
      page, limit, sortBy, order,
    } = query;

    const where = {};

    // RBAC scoping: viewers see only own, analysts & admins see all
    if (user.role.name === 'viewer') {
      where.userId = user.id;
    }

    // Filters
    if (type) where.type = type;
    if (category) where.category = { [Op.like]: `%${category}%` };
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.date = { [Op.lte]: endDate };
    }

    // Search in notes and category
    if (search) {
      where[Op.or] = [
        { category: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await FinancialRecord.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }],
      order: [[sortBy, order.toUpperCase()]],
      limit,
      offset,
    });

    return {
      records: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get a single record by ID with RBAC scoping.
   */
  async getRecordById(id, user) {
    const record = await FinancialRecord.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }],
    });

    if (!record) {
      const error = new Error('Financial record not found');
      error.statusCode = 404;
      throw error;
    }

    // Viewers can only see own records
    if (user.role.name === 'viewer' && record.userId !== user.id) {
      const error = new Error('Forbidden — insufficient permissions');
      error.statusCode = 403;
      throw error;
    }

    return record;
  }

  /**
   * Update a record. Analysts can update own records only; admins can update any.
   */
  async updateRecord(id, data, user) {
    const record = await FinancialRecord.findByPk(id);

    if (!record) {
      const error = new Error('Financial record not found');
      error.statusCode = 404;
      throw error;
    }

    // Analysts can only update their own records
    if (user.role.name === 'analyst' && record.userId !== user.id) {
      const error = new Error('Forbidden — you can only update your own records');
      error.statusCode = 403;
      throw error;
    }

    await record.update(data);

    const updatedRecord = await FinancialRecord.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }],
    });

    return updatedRecord;
  }

  /**
   * Delete a record (admin only — enforced by route middleware).
   */
  async deleteRecord(id) {
    const record = await FinancialRecord.findByPk(id);
    if (!record) {
      const error = new Error('Financial record not found');
      error.statusCode = 404;
      throw error;
    }
    await record.destroy();
    return { message: 'Financial record deleted successfully' };
  }
}

module.exports = new FinancialService();
