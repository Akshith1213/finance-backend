const userService = require('../services/user.service');
const ApiResponse = require('../utils/apiResponse');

class UserController {
  async getAllUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers();
      return ApiResponse.success(res, users, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      return ApiResponse.success(res, user, 'User retrieved successfully');
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  async assignRole(req, res, next) {
    try {
      const user = await userService.assignRole(req.params.id, req.body.roleId);
      return ApiResponse.success(res, user, 'Role assigned successfully');
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const user = await userService.updateStatus(req.params.id, req.body.isActive);
      const message = req.body.isActive ? 'User activated' : 'User deactivated';
      return ApiResponse.success(res, user, message);
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(req.params.id);
      return ApiResponse.success(res, result, 'User deleted successfully');
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.error(res, error.message, error.statusCode);
      }
      next(error);
    }
  }
}

module.exports = new UserController();
