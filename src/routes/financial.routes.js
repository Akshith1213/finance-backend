const router = require('express').Router();
const financialController = require('../controllers/financial.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const {
  createRecordSchema,
  updateRecordSchema,
  queryRecordsSchema,
} = require('../validators/financial.validator');

/**
 * @swagger
 * tags:
 *   name: Financial Records
 *   description: Financial records CRUD
 */

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Create a financial record
 *     tags: [Financial Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000.00
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 example: income
 *               category:
 *                 type: string
 *                 example: salary
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-15"
 *               notes:
 *                 type: string
 *                 example: Monthly salary
 *     responses:
 *       201:
 *         description: Record created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'analyst'),
  validate(createRecordSchema),
  financialController.createRecord
);

/**
 * @swagger
 * /api/records:
 *   get:
 *     summary: List financial records (filtered, paginated)
 *     tags: [Financial Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, amount, category, type, createdAt]
 *           default: date
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Paginated records
 */
router.get(
  '/',
  authenticate,
  authorize('admin', 'analyst', 'viewer'),
  validate(queryRecordsSchema, 'query'),
  financialController.getRecords
);

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     summary: Get a single financial record
 *     tags: [Financial Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record details
 *       404:
 *         description: Record not found
 */
router.get(
  '/:id',
  authenticate,
  authorize('admin', 'analyst', 'viewer'),
  financialController.getRecordById
);

/**
 * @swagger
 * /api/records/{id}:
 *   put:
 *     summary: Update a financial record
 *     tags: [Financial Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Record not found
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'analyst'),
  validate(updateRecordSchema),
  financialController.updateRecord
);

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     summary: Delete a financial record
 *     tags: [Financial Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Record not found
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  financialController.deleteRecord
);

module.exports = router;
