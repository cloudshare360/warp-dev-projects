/**
 * Portfolio Express REST API Server
 * Main server entry point with comprehensive middleware setup
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Import custom modules
const config = require('./config/config');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');
const { requestLogger } = require('./middleware/requestLogger');

// Import routes
const profileRoutes = require('./routes/profileRoutes');
const experienceRoutes = require('./routes/experienceRoutes');
const skillsRoutes = require('./routes/skillsRoutes');
const projectsRoutes = require('./routes/projectsRoutes');
const educationRoutes = require('./routes/educationRoutes');
const certificationsRoutes = require('./routes/certificationsRoutes');
const testimonialsRoutes = require('./routes/testimonialsRoutes');
const contactRoutes = require('./routes/contactRoutes');
const healthRoutes = require('./routes/healthRoutes');

// Initialize Express app
const app = express();

// Trust proxy for rate limiting when behind reverse proxy
app.set('trust proxy', 1);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: config.swagger.title,
      version: config.api.version,
      description: config.swagger.description,
      contact: {
        name: config.swagger.contactName,
        email: config.swagger.contactEmail,
        url: config.swagger.contactUrl,
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://${config.server.host}:${config.server.port}${config.api.prefix}`,
        description: 'Development server',
      },
      {
        url: `${config.api.prefix}`,
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                details: { type: 'string' },
              },
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string', example: 'Success' },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                version: { type: 'string' },
              },
            },
          },
        },
      },
      parameters: {
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items to return (max 100)',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
        },
        OffsetParam: {
          name: 'offset',
          in: 'query',
          description: 'Number of items to skip',
          required: false,
          schema: { type: 'integer', minimum: 0, default: 0 },
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          description: 'Sort field',
          required: false,
          schema: { type: 'string' },
        },
        OrderParam: {
          name: 'order',
          in: 'query',
          description: 'Sort order',
          required: false,
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Security middleware
if (config.security.helmetEnabled) {
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
}

// Compression middleware
if (config.security.compressionEnabled) {
  app.use(compression());
}

// CORS middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan(config.logging.format, {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Custom request logger
app.use(requestLogger);

// Rate limiting middleware
app.use(rateLimiter);

// API Documentation
if (config.swagger.enabled) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Portfolio API Documentation',
    customfavIcon: '/favicon.ico',
  }));
  
  // Serve swagger.json
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// API Routes
const apiPrefix = config.api.prefix;

// Health check routes
if (config.healthCheck.enabled) {
  app.use(config.healthCheck.endpoint, healthRoutes);
}

// API version info
app.get(`${apiPrefix}`, (req, res) => {
  res.json({
    success: true,
    message: 'Portfolio REST API',
    data: {
      name: 'Portfolio Express API',
      version: config.api.version,
      description: 'Comprehensive REST API for portfolio website',
      documentation: '/api-docs',
      endpoints: {
        profile: `${apiPrefix}/profile`,
        experience: `${apiPrefix}/experience`,
        skills: `${apiPrefix}/skills`,
        projects: `${apiPrefix}/projects`,
        education: `${apiPrefix}/education`,
        certifications: `${apiPrefix}/certifications`,
        testimonials: `${apiPrefix}/testimonials`,
        contact: `${apiPrefix}/contact`,
        health: '/health',
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: config.api.version,
    },
  });
});

// API Routes
app.use(`${apiPrefix}/profile`, profileRoutes);
app.use(`${apiPrefix}/experience`, experienceRoutes);
app.use(`${apiPrefix}/skills`, skillsRoutes);
app.use(`${apiPrefix}/projects`, projectsRoutes);
app.use(`${apiPrefix}/education`, educationRoutes);
app.use(`${apiPrefix}/certifications`, certificationsRoutes);
app.use(`${apiPrefix}/testimonials`, testimonialsRoutes);
app.use(`${apiPrefix}/contact`, contactRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: {
      code: 'ROUTE_NOT_FOUND',
      details: 'The requested endpoint does not exist',
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: config.api.version,
    },
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(config.server.port, config.server.host, () => {
  logger.info(`🚀 Portfolio API Server started successfully!`);
  logger.info(`📍 Server running at: http://${config.server.host}:${config.server.port}`);
  logger.info(`📚 API Documentation: http://${config.server.host}:${config.server.port}/api-docs`);
  logger.info(`🏥 Health Check: http://${config.server.host}:${config.server.port}/health`);
  logger.info(`🌍 Environment: ${config.server.nodeEnv}`);
  logger.info(`🔗 JSON Server: ${config.jsonServer.url}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;