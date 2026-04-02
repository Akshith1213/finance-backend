require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const { sequelize } = require('./src/models');
const routes = require('./src/routes');
const { errorHandler } = require('./src/middleware/errorHandler');
const { apiLimiter } = require('./src/middleware/rateLimiter');
const swaggerSpec = require('./src/utils/swagger');
const seed = require('./seeders/seed');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------
// Global Middleware
// ---------------------
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/api', apiLimiter);

// ---------------------
// Swagger Docs
// ---------------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Finance API Docs',
}));

// ---------------------
// Routes
// ---------------------
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Finance Data Processing & Access Control API',
    version: '1.0.0',
    docs: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      records: '/api/records',
      dashboard: '/api/dashboard',
    },
  });
});

app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

// ---------------------
// Start Server
// ---------------------
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // Sync models (create tables if not exist)
    await sequelize.sync({ force: false });
    console.log('📦 Models synchronized.');

    // Run seeder (idempotent)
    await seed();

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Export for testing
module.exports = app;

// Start if run directly
if (require.main === module) {
  startServer();
}
