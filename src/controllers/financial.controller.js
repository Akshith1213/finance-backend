const financialService = require('../services/financial.service');
const ApiResponse = require('../utils/apiResponse');

class FinancialController {
  async createRecord(req, res, next) {
    try {
      const record = await financialService.createRecord(req.body, req.user.id);
      return ApiResponse.created(res, record, 'Financial record created');
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  async getRecords(req, res, next) {
    try {
      const { records, pagination } = await financialService.getRecords(req.query, req.user);
      return ApiResponse.paginated(res, records, pagination, 'Records retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getRecordById(req, res, next) {
    try {
      const record = await financialService.getRecordById(req.params.id, req.user);
      return ApiResponse.success(res, record, 'Record retrieved');
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  async updateRecord(req, res, next) {
    try {
      const record = await financialService.updateRecord(req.params.id, req.body, req.user);
      return ApiResponse.success(res, record, 'Record updated');
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  async deleteRecord(req, res, next) {
    try {
      const result = await financialService.deleteRecord(req.params.id);
      return ApiResponse.success(res, result, 'Record deleted');
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      next(error);
    }
  }
}

module.exports = new FinancialController();
