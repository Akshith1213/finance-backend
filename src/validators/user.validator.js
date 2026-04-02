const Joi = require('joi');

const assignRoleSchema = Joi.object({
  roleId: Joi.number().integer().positive().required(),
});

const updateStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});

module.exports = { assignRoleSchema, updateStatusSchema };
