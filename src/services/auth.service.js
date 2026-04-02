const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

class AuthService {
  /**
   * Register a new user. Defaults to 'viewer' role.
   */
  async register({ username, email, password }) {
    // Check for existing user
    const existingUser = await User.findOne({
      where: { email },
    });
    if (existingUser) {
      const error = new Error('Email is already registered');
      error.statusCode = 409;
      throw error;
    }

    const existingUsername = await User.findOne({
      where: { username },
    });
    if (existingUsername) {
      const error = new Error('Username is already taken');
      error.statusCode = 409;
      throw error;
    }

    // Assign viewer role by default
    const viewerRole = await Role.findOne({ where: { name: 'viewer' } });
    if (!viewerRole) {
      throw new Error('Default role not found. Run the seeder first.');
    }

    const user = await User.create({
      username,
      email,
      password,
      roleId: viewerRole.id,
    });

    const userWithRole = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'role' }],
    });

    const token = this._generateToken(user);

    return {
      user: userWithRole.toSafeJSON(),
      token,
    };
  }

  /**
   * Authenticate user with email + password, return JWT.
   */
  async login({ email, password }) {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Account is deactivated. Contact an admin.');
      error.statusCode = 403;
      throw error;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const token = this._generateToken(user);

    return {
      user: user.toSafeJSON(),
      token,
    };
  }

  _generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }
}

module.exports = new AuthService();
