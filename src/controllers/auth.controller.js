const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return ApiResponse.created(res, result, 'User registered successfully');
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      next(error);
    }
  }
}

module.exports = new AuthController();
