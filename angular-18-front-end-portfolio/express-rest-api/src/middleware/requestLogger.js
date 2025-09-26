/**
 * Request Logger Middleware
 * Custom request logging with performance tracking
 */

const logger = require('../utils/logger');
const config = require('../config/config');

const requestLogger = (req, res, next) => {
  // Generate unique request ID
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Store start time for performance tracking
  req.startTime = Date.now();
  
  // Log incoming request
  if (config.isDevelopment()) {
    logger.debug(`🔄 Incoming Request [${req.id}]`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length'),
      timestamp: new Date().toISOString(),
    });
  }
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const responseTime = Date.now() - req.startTime;
    
    // Log response details
    logger.logRequest(req, res, responseTime);
    
    // Log performance warnings for slow requests
    if (responseTime > 1000) {
      logger.warn(`⚠️  Slow Request [${req.id}]`, {
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Add response headers for tracking
    res.set('X-Request-ID', req.id);
    res.set('X-Response-Time', `${responseTime}ms`);
    res.set('X-API-Version', config.api.version);
    
    // Call original json method
    return originalJson.call(this, body);
  };
  
  // Override res.send to handle non-JSON responses
  const originalSend = res.send;
  res.send = function(body) {
    const responseTime = Date.now() - req.startTime;
    
    // Only log if not already logged by res.json
    if (!res.headersSent || !res.get('X-Request-ID')) {
      logger.logRequest(req, res, responseTime);
      
      // Add response headers for tracking
      res.set('X-Request-ID', req.id);
      res.set('X-Response-Time', `${responseTime}ms`);
      res.set('X-API-Version', config.api.version);
    }
    
    return originalSend.call(this, body);
  };
  
  // Log when request ends
  res.on('finish', () => {
    const responseTime = Date.now() - req.startTime;
    
    // Log completed request in development
    if (config.isDevelopment()) {
      logger.debug(`✅ Request Completed [${req.id}]`, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        contentLength: res.get('Content-Length'),
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  // Log when request is closed (client disconnected)
  res.on('close', () => {
    if (!res.writableEnded) {
      const responseTime = Date.now() - req.startTime;
      logger.warn(`🔌 Client Disconnected [${req.id}]`, {
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  next();
};

// Middleware to log request body for debugging (development only)
const requestBodyLogger = (req, res, next) => {
  if (config.isDevelopment() && req.body && Object.keys(req.body).length > 0) {
    logger.debug(`📝 Request Body [${req.id}]`, {
      body: req.body,
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length'),
    });
  }
  next();
};

// Middleware to log query parameters
const queryLogger = (req, res, next) => {
  if (config.isDevelopment() && Object.keys(req.query).length > 0) {
    logger.debug(`🔍 Query Parameters [${req.id}]`, {
      query: req.query,
      url: req.originalUrl,
    });
  }
  next();
};

// Middleware to log request headers (development only)
const headersLogger = (req, res, next) => {
  if (config.isDevelopment()) {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    const safeHeaders = { ...req.headers };
    
    // Redact sensitive headers
    sensitiveHeaders.forEach(header => {
      if (safeHeaders[header]) {
        safeHeaders[header] = '[REDACTED]';
      }
    });
    
    logger.debug(`📋 Request Headers [${req.id}]`, {
      headers: safeHeaders,
    });
  }
  next();
};

module.exports = {
  requestLogger,
  requestBodyLogger,
  queryLogger,
  headersLogger,
};