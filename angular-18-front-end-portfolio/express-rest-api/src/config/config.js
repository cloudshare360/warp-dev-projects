/**
 * Application Configuration
 * Centralized configuration management with environment variables
 */

const config = {
  // Server Configuration
  server: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.HOST || 'localhost',
  },

  // API Configuration
  api: {
    prefix: process.env.API_PREFIX || '/api/v1',
    version: process.env.API_VERSION || '1.0.0',
  },

  // JSON Server Configuration
  jsonServer: {
    url: process.env.JSON_SERVER_URL || 'http://localhost:3001',
    timeout: parseInt(process.env.JSON_SERVER_TIMEOUT, 10) || 5000,
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Rate Limiting Configuration
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    message: process.env.RATE_LIMIT_MESSAGE || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
  },

  // Security Configuration
  security: {
    helmetEnabled: process.env.HELMET_ENABLED !== 'false',
    compressionEnabled: process.env.COMPRESSION_ENABLED !== 'false',
  },

  // Swagger Configuration
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
    title: process.env.SWAGGER_TITLE || 'Portfolio REST API',
    description: process.env.SWAGGER_DESCRIPTION || 'Comprehensive REST API for portfolio website',
    contactName: process.env.SWAGGER_CONTACT_NAME || 'Sri Ramanujam',
    contactEmail: process.env.SWAGGER_CONTACT_EMAIL || 'sri.ramanujam@example.com',
    contactUrl: process.env.SWAGGER_CONTACT_URL || 'https://sri-architect.com',
  },

  // Health Check Configuration
  healthCheck: {
    enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
    endpoint: process.env.HEALTH_CHECK_ENDPOINT || '/health',
  },

  // Cache Configuration
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.CACHE_TTL, 10) || 300, // 5 minutes
  },
};

// Validation
const validateConfig = () => {
  const requiredEnvVars = [];
  
  // Check for required environment variables
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate port range
  if (config.server.port < 1 || config.server.port > 65535) {
    throw new Error('PORT must be between 1 and 65535');
  }

  // Validate JSON Server URL format
  try {
    new URL(config.jsonServer.url);
  } catch (error) {
    throw new Error('JSON_SERVER_URL must be a valid URL');
  }

  // Validate CORS origin format
  if (config.cors.origin !== '*') {
    try {
      new URL(config.cors.origin);
    } catch (error) {
      throw new Error('CORS_ORIGIN must be a valid URL or "*"');
    }
  }

  // Validate rate limiting values
  if (config.rateLimiting.windowMs < 1000) {
    throw new Error('RATE_LIMIT_WINDOW_MS must be at least 1000 milliseconds');
  }

  if (config.rateLimiting.maxRequests < 1) {
    throw new Error('RATE_LIMIT_MAX_REQUESTS must be at least 1');
  }

  // Validate timeout values
  if (config.jsonServer.timeout < 1000) {
    throw new Error('JSON_SERVER_TIMEOUT must be at least 1000 milliseconds');
  }

  if (config.cache.ttl < 0) {
    throw new Error('CACHE_TTL must be a positive number');
  }
};

// Run validation
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  process.exit(1);
}

// Development environment helpers
const isDevelopment = () => config.server.nodeEnv === 'development';
const isProduction = () => config.server.nodeEnv === 'production';
const isTest = () => config.server.nodeEnv === 'test';

module.exports = {
  ...config,
  isDevelopment,
  isProduction,
  isTest,
};