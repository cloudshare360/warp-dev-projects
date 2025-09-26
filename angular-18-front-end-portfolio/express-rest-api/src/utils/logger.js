/**
 * Logger Utility
 * Winston-based logging configuration with multiple transports
 */

const winston = require('winston');
const config = require('../config/config');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Define which level to use based on environment
const level = () => {
  const env = config.server.nodeEnv;
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define format for logs
const format = winston.format.combine(
  // Add timestamp
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  
  // Tell Winston that the logs will be colored
  winston.format.colorize({ all: true }),
  
  // Add errors stack trace
  winston.format.errors({ stack: true }),
  
  // Define format of log message
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? `\n${info.stack}` : ''}`,
  ),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: level(),
    format,
  }),
];

// Add file transports in production
if (config.isProduction()) {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    }),
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  
  // Exit on error if not in production
  exitOnError: false,
});

// Create stream for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Helper methods for structured logging
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  };
  
  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

logger.logError = (error, req = null, additionalInfo = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
  };
  
  if (req) {
    errorData.request = {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
    };
  }
  
  logger.error('Application Error', errorData);
};

logger.logAPICall = (endpoint, method, statusCode, responseTime, additionalInfo = {}) => {
  const logData = {
    endpoint,
    method,
    statusCode,
    responseTime: `${responseTime}ms`,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
  };
  
  if (statusCode >= 400) {
    logger.warn('API Call', logData);
  } else {
    logger.info('API Call', logData);
  }
};

logger.logPerformance = (operation, duration, additionalInfo = {}) => {
  const logData = {
    operation,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
  };
  
  if (duration > 1000) {
    logger.warn('Performance Warning', logData);
  } else {
    logger.debug('Performance Info', logData);
  }
};

// Log startup information
logger.startup = () => {
  logger.info('🚀 Starting Portfolio Express API');
  logger.info(`📍 Environment: ${config.server.nodeEnv}`);
  logger.info(`📍 Port: ${config.server.port}`);
  logger.info(`📍 Host: ${config.server.host}`);
  logger.info(`📍 Log Level: ${level()}`);
  logger.info(`📍 JSON Server: ${config.jsonServer.url}`);
};

// Log shutdown information
logger.shutdown = (reason = 'Unknown') => {
  logger.info(`🛑 Shutting down Portfolio Express API - Reason: ${reason}`);
};

module.exports = logger;