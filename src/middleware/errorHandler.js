const ApiResponse = require('../utils/apiResponse');

/**
 * Global error handling middleware.
 * Catches all unhandled errors and returns a structured response.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  console.error('Unhandled Error:', err);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiResponse.badRequest(res, 'Validation error', errors);
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: `${e.path} already exists`,
    }));
    return ApiResponse.badRequest(res, 'Duplicate entry', errors);
  }

  // Sequelize foreign key errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return ApiResponse.badRequest(res, 'Invalid reference — related resource not found');
  }

  // JWT errors (fallback — primary handling is in auth middleware)
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Invalid token');
  }

  // SyntaxError from malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return ApiResponse.badRequest(res, 'Malformed JSON in request body');
  }

  // Default
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  return ApiResponse.error(res, message, statusCode);
};

module.exports = { errorHandler };
