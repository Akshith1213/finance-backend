const { Op, fn, col, literal } = require('sequelize');
const { FinancialRecord } = require('../models');

class DashboardService {
  /**
   * Build a where clause scoped by user role.
   * Viewers see only their data; analysts/admins see all.
   */
  _buildScope(user) {
    const where = {};
    if (user.role.name === 'viewer') {
      where.userId = user.id;
    }
    return where;
  }

  /**
   * Summary: total income, total expenses, net balance.
   */
  async getSummary(user) {
    const where = this._buildScope(user);

    const [incomeResult, expenseResult] = await Promise.all([
      FinancialRecord.findOne({
        where: { ...where, type: 'income' },
        attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
        raw: true,
      }),
      FinancialRecord.findOne({
        where: { ...where, type: 'expense' },
        attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
        raw: true,
      }),
    ]);

    const totalIncome = parseFloat(incomeResult.total) || 0;
    const totalExpenses = parseFloat(expenseResult.total) || 0;
    const netBalance = totalIncome - totalExpenses;

    return {
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netBalance: Number(netBalance.toFixed(2)),
    };
  }

  /**
   * Category-wise totals, split by type.
   */
  async getCategoryBreakdown(user) {
    const where = this._buildScope(user);

    const results = await FinancialRecord.findAll({
      where,
      attributes: [
        'type',
        'category',
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['type', 'category'],
      order: [[literal('total'), 'DESC']],
      raw: true,
    });

    // Group by type for cleaner output
    const income = results
      .filter((r) => r.type === 'income')
      .map((r) => ({ category: r.category, total: parseFloat(r.total), count: parseInt(r.count, 10) }));

    const expenses = results
      .filter((r) => r.type === 'expense')
      .map((r) => ({ category: r.category, total: parseFloat(r.total), count: parseInt(r.count, 10) }));

    return { income, expenses };
  }

  /**
   * Monthly or weekly trends.
   *
   * @param {Object} user
   * @param {'monthly'|'weekly'} period
   */
  async getTrends(user, period = 'monthly') {
    const where = this._buildScope(user);

    let dateExpr;
    if (period === 'weekly') {
      // ISO week: YYYY-Www
      dateExpr = literal("strftime('%Y-W%W', date)");
    } else {
      // Monthly: YYYY-MM
      dateExpr = literal("strftime('%Y-%m', date)");
    }

    const results = await FinancialRecord.findAll({
      where,
      attributes: [
        [dateExpr, 'period'],
        'type',
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [literal('period'), 'type'],
      order: [[literal('period'), 'ASC']],
      raw: true,
    });

    // Pivot: [{period, income, expense, net}]
    const periodMap = {};
    results.forEach((r) => {
      if (!periodMap[r.period]) {
        periodMap[r.period] = { period: r.period, income: 0, expense: 0, net: 0 };
      }
      const amount = parseFloat(r.total) || 0;
      if (r.type === 'income') {
        periodMap[r.period].income = amount;
      } else {
        periodMap[r.period].expense = amount;
      }
    });

    // Calculate net
    const trends = Object.values(periodMap).map((t) => ({
      ...t,
      income: Number(t.income.toFixed(2)),
      expense: Number(t.expense.toFixed(2)),
      net: Number((t.income - t.expense).toFixed(2)),
    }));

    return trends;
  }
}

module.exports = new DashboardService();
