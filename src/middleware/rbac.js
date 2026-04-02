const ApiResponse = require('../utils/apiResponse');

/**
 * Role-based access control middleware factory.
 * Accepts an array of allowed role names and returns middleware
 * that checks if the authenticated user's role is in the list.
 *
 * @param  {...string} allowedRoles - Role names, e.g. 'admin', 'analyst'
 * @returns {Function} Express middleware
 *
 * Usage: authorize('admin', 'analyst')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    const userRole = req.user.role?.name;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return ApiResponse.forbidden(
        res,
        `Role '${userRole}' is not authorized. Required: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};

module.exports = { authorize };
