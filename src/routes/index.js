const router = require('express').Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const financialRoutes = require('./financial.routes');
const dashboardRoutes = require('./dashboard.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/records', financialRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
