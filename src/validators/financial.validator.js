const Joi = require('joi');

const createRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid('income', 'expense').required(),
  category: Joi.string().min(1).max(100).required(),
  date: Joi.date().iso().required(),
  notes: Joi.string().max(500).allow('', null).optional(),
});

const updateRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2).optional(),
  type: Joi.string().valid('income', 'expense').optional(),
  category: Joi.string().min(1).max(100).optional(),
  date: Joi.date().iso().optional(),
  notes: Joi.string().max(500).allow('', null).optional(),
}).min(1); // At least one field required

const queryRecordsSchema = Joi.object({
  type: Joi.string().valid('income', 'expense').optional(),
  category: Joi.string().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  search: Joi.string().max(100).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('date', 'amount', 'category', 'type', 'createdAt').default('date'),
  order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
});

module.exports = { createRecordSchema, updateRecordSchema, queryRecordsSchema };
