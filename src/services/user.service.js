const { User, Role } = require('../models');

class UserService {
  /**
   * List all users with their roles.
   */
  async getAllUsers() {
    const users = await User.findAll({
      include: [{ model: Role, as: 'role' }],
      order: [['createdAt', 'DESC']],
    });
    return users.map((u) => u.toSafeJSON());
  }

  /**
   * Get a single user by ID.
   */
  async getUserById(id) {
    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }],
    });
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user.toSafeJSON();
  }

  /**
   * Assign a role to a user.
   */
  async assignRole(userId, roleId) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      const error = new Error('Role not found');
      error.statusCode = 404;
      throw error;
    }

    user.roleId = roleId;
    await user.save();

    const updatedUser = await User.findByPk(userId, {
      include: [{ model: Role, as: 'role' }],
    });
    return updatedUser.toSafeJSON();
  }

  /**
   * Activate or deactivate a user.
   */
  async updateStatus(userId, isActive) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    user.isActive = isActive;
    await user.save();

    const updatedUser = await User.findByPk(userId, {
      include: [{ model: Role, as: 'role' }],
    });
    return updatedUser.toSafeJSON();
  }

  /**
   * Delete a user.
   */
  async deleteUser(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    await user.destroy();
    return { message: 'User deleted successfully' };
  }
}

module.exports = new UserService();
