const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/apiResponse');

class DashboardController {
  async getSummary(req, res, next) {
    try {
      const summary = await dashboardService.getSummary(req.user);
      return ApiResponse.success(res, summary, 'Dashboard summary retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getCategoryBreakdown(req, res, next) {
    try {
      const breakdown = await dashboardService.getCategoryBreakdown(req.user);
      return ApiResponse.success(res, breakdown, 'Category breakdown retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getTrends(req, res, next) {
    try {
      const period = req.query.period || 'monthly';
      const trends = await dashboardService.getTrends(req.user, period);
      return ApiResponse.success(res, trends, `${period} trends retrieved`);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
