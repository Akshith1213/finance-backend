const ApiResponse = require('../utils/apiResponse');

/**
 * Joi validation middleware factory.
 * Validates req.body, req.query, or req.params against a Joi schema.
 *
 * @param {Object} schema    - Joi schema object
 * @param {string} source    - 'body' | 'query' | 'params'
 * @returns {Function} Express middleware
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      return ApiResponse.badRequest(res, 'Validation failed', errors);
    }

    // Replace with validated + sanitized values
    req[source] = value;
    next();
  };
};

module.exports = { validate };
