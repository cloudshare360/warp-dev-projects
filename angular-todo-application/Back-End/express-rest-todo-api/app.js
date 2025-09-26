const express = require('express');
const path = require('path');
const morgan = require('morgan');
const compression = require('compression');

// Import middleware
const { 
  applySecurityMiddleware,
  globalErrorHandler,
  notFoundHandler
} = require('./src/middleware');

// Import routes
const routes = require('./src/routes');

// Import Swagger configuration
const { setupSwagger, validateSwaggerSpec } = require('./src/config/swagger');

// Import database configuration
const { initializeDatabase } = require('./src/config/database');

// Import logger
const logger = require('./src/utils/logger');

// Create Express application
const app = express();

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

/**
 * MIDDLEWARE SETUP
 */

// Apply security middleware (CORS, Helmet, sanitization, etc.)
applySecurityMiddleware(app);

// Compression middleware for response compression
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  strict: true,
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb',
  parameterLimit: 50
}));

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    },
    skip: (req, res) => res.statusCode < 400
  }));
}

// Static files (if needed)
app.use('/static', express.static(path.join(__dirname, 'public')));

/**
 * SWAGGER DOCUMENTATION SETUP
 */
try {
  // Validate Swagger specification
  if (validateSwaggerSpec()) {
    // Setup Swagger documentation
    setupSwagger(app);
  }
} catch (error) {
  logger.error('Error setting up Swagger documentation:', error);
}

/**
 * API ROUTES
 */
app.use('/api', routes);

// Root endpoint redirect to API documentation
app.get('/', (req, res) => {
  res.redirect('/api/docs');
});

/**
 * HEALTH CHECK ENDPOINT (before rate limiting)
 */
app.get('/health', (req, res) => {
  const healthCheck = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.API_VERSION || '1.0.0',
    memory: {
      used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100
    }
  };
  
  res.status(200).json(healthCheck);
});

/**
 * API INFORMATION ENDPOINT
 */
app.get('/info', (req, res) => {
  res.json({
    success: true,
    name: 'Angular Todo Application API',
    version: process.env.API_VERSION || '1.0.0',
    description: 'A comprehensive REST API for managing todo lists and items',
    environment: process.env.NODE_ENV || 'development',
    documentation: {
      swagger: '/api/docs',
      json: '/api/swagger.json'
    },
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      lists: '/api/lists',
      todos: '/api/todos'
    },
    features: [
      'JWT Authentication',
      'Rate Limiting',
      'Input Validation',
      'Error Handling',
      'Request Logging',
      'API Documentation'
    ],
    contact: {
      name: 'API Support',
      email: 'support@todo-api.com'
    }
  });
});

/**
 * ERROR HANDLING
 */

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

/**
 * GRACEFUL SHUTDOWN HANDLING
 */
const gracefulShutdown = async () => {
  logger.info('🛑 Graceful shutdown initiated...');
  
  try {
    // Close server
    if (server) {
      await new Promise((resolve) => {
        server.close(() => {
          logger.info('✅ HTTP server closed');
          resolve();
        });
      });
    }
    
    // Close database connections
    const { disconnectDatabase } = require('./src/config/database');
    await disconnectDatabase();
    
    logger.info('👋 Graceful shutdown completed');
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

/**
 * SERVER STARTUP
 */
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server;

const startServer = async () => {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    server = app.listen(PORT, () => {
      logger.info(`🚀 Server started successfully!`);
      logger.info(`🌍 Environment: ${NODE_ENV}`);
      logger.info(`🔗 Server URL: http://localhost:${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      logger.info(`📊 Health Check: http://localhost:${PORT}/health`);
      logger.info(`ℹ️  API Info: http://localhost:${PORT}/info`);
      
      if (NODE_ENV === 'development') {
        logger.info(`🔧 Development mode - detailed logging enabled`);
      }
    });

    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch(error => {
  logger.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Export app for testing
module.exports = app;