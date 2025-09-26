/**
 * Rate Limiting Middleware
 * Implements rate limiting to prevent API abuse
 */

const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const logger = require('../utils/logger');

// Create rate limiter
const rateLimiter = rateLimit({
  windowMs: config.rateLimiting.windowMs,
  max: config.rateLimiting.maxRequests,
  message: {
    success: false,
    message: config.rateLimiting.message,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      details: `Too many requests. Maximum ${config.rateLimiting.maxRequests} requests per ${config.rateLimiting.windowMs / 60000} minutes allowed.`,
      retryAfter: Math.ceil(config.rateLimiting.windowMs / 1000),
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: config.api.version,
    },
  },
  standardHeaders: config.rateLimiting.standardHeaders,
  legacyHeaders: config.rateLimiting.legacyHeaders,
  
  // Custom key generator based on IP
  keyGenerator: (req) => {
    return req.ip;
  },
  
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    });
    
    res.status(429).json({
      success: false,
      message: config.rateLimiting.message,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        details: `Too many requests. Maximum ${config.rateLimiting.maxRequests} requests per ${config.rateLimiting.windowMs / 60000} minutes allowed.`,
        retryAfter: Math.ceil(config.rateLimiting.windowMs / 1000),
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: config.api.version,
      },
    });
  },
  
  // Skip rate limiting in test environment
  skip: (req) => {
    return config.isTest();
  },
  
  // Custom store for production (Redis recommended)
  // store: new RedisStore({...}) // Uncomment for Redis support
});

// Strict rate limiter for sensitive endpoints
const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    message: 'Too many requests to sensitive endpoint',
    error: {
      code: 'STRICT_RATE_LIMIT_EXCEEDED',
      details: 'Maximum 10 requests per 15 minutes allowed for this endpoint.',
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: config.api.version,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: config.isTest,
});

// Create different rate limiters for different endpoints
const createCustomRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: config.rateLimiting.windowMs,
    max: config.rateLimiting.maxRequests,
    message: config.rateLimiting.message,
    standardHeaders: true,
    legacyHeaders: false,
    skip: config.isTest,
  };
  
  return rateLimit({
    ...defaultOptions,
    ...options,
    handler: (req, res) => {
      logger.warn(`Custom rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        limit: options.max || defaultOptions.max,
        window: options.windowMs || defaultOptions.windowMs,
        timestamp: new Date().toISOString(),
      });
      
      res.status(429).json({
        success: false,
        message: options.message || defaultOptions.message,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          details: `Maximum ${options.max || defaultOptions.max} requests per ${(options.windowMs || defaultOptions.windowMs) / 60000} minutes allowed.`,
          retryAfter: Math.ceil((options.windowMs || defaultOptions.windowMs) / 1000),
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: config.api.version,
        },
      });
    },
  });
};

module.exports = {
  rateLimiter,
  strictRateLimiter,
  createCustomRateLimiter,
};