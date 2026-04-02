const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard analytics endpoints
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get financial summary (income, expenses, net balance)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary totals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalIncome:
 *                   type: number
 *                   example: 15000.00
 *                 totalExpenses:
 *                   type: number
 *                   example: 8500.00
 *                 netBalance:
 *                   type: number
 *                   example: 6500.00
 */
router.get(
  '/summary',
  authenticate,
  authorize('admin', 'analyst', 'viewer'),
  dashboardController.getSummary
);

/**
 * @swagger
 * /api/dashboard/categories:
 *   get:
 *     summary: Get category-wise totals
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category breakdown
 */
router.get(
  '/categories',
  authenticate,
  authorize('admin', 'analyst', 'viewer'),
  dashboardController.getCategoryBreakdown
);

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     summary: Get monthly or weekly trends
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [monthly, weekly]
 *           default: monthly
 *     responses:
 *       200:
 *         description: Trend data
 */
router.get(
  '/trends',
  authenticate,
  authorize('admin', 'analyst', 'viewer'),
  dashboardController.getTrends
);

module.exports = router;
