const rateLimit = require('express-rate-limit');
const MongoStore = require('rate-limit-mongo');
const logger = require('../utils/logger');

/**
 * Rate limiter store using MongoDB
 */
const createMongoStore = () => {
  const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/todoapp';
  
  return new MongoStore({
    uri: mongoUrl,
    collectionName: 'rateLimitData',
    expireTimeMs: 15 * 60 * 1000 // 15 minutes
  });
};

/**
 * Custom rate limit message handler
 */
const rateLimitMessage = (req, res) => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  return res.status(429).json({
    success: false,
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    timestamp: new Date().toISOString()
  });
};

/**
 * Skip rate limiting for certain conditions
 */
const skipRateLimit = (req, res) => {
  // Skip rate limiting for health check endpoints
  if (req.originalUrl === '/api/health') {
    return true;
  }
  
  // Skip rate limiting for localhost in development
  if (process.env.NODE_ENV === 'development' && req.ip === '::1') {
    return true;
  }
  
  return false;
};

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: rateLimitMessage,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: process.env.NODE_ENV === 'production' ? createMongoStore() : undefined,
  skip: skipRateLimit,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.userId || req.ip;
  }
});

/**
 * Authentication rate limiter
 * 5 attempts per 15 minutes per IP
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    return res.status(429).json({
      success: false,
      error: 'Too many authentication attempts',
      message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
      timestamp: new Date().toISOString()
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: process.env.NODE_ENV === 'production' ? createMongoStore() : undefined,
  skip: skipRateLimit
});

/**
 * Password reset rate limiter
 * 3 attempts per hour per IP
 */
const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: (req, res) => {
    logger.warn('Password reset rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    return res.status(429).json({
      success: false,
      error: 'Too many password reset attempts',
      message: 'Too many password reset requests from this IP. Please try again in 1 hour.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
      timestamp: new Date().toISOString()
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: process.env.NODE_ENV === 'production' ? createMongoStore() : undefined,
  skip: skipRateLimit
});

/**
 * Registration rate limiter
 * 3 registrations per hour per IP
 */
const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registration attempts per hour
  message: (req, res) => {
    logger.warn('Registration rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    return res.status(429).json({
      success: false,
      error: 'Too many registration attempts',
      message: 'Too many registration attempts from this IP. Please try again in 1 hour.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
      timestamp: new Date().toISOString()
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: process.env.NODE_ENV === 'production' ? createMongoStore() : undefined,
  skip: skipRateLimit
});

/**
 * File upload rate limiter
 * 10 uploads per hour per authenticated user
 */
const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each user to 10 uploads per hour
  message: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      userId: req.user?.userId,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    return res.status(429).json({
      success: false,
      error: 'Too many upload attempts',
      message: 'Too many file uploads. Please try again in 1 hour.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
      timestamp: new Date().toISOString()
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: process.env.NODE_ENV === 'production' ? createMongoStore() : undefined,
  skip: skipRateLimit,
  keyGenerator: (req) => {
    // Use user ID for authenticated users
    return req.user?.userId || req.ip;
  }
});

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per hour per authenticated user
 */
const strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each user to 10 requests per hour
  message: (req, res) => {
    logger.warn('Strict rate limit exceeded', {
      userId: req.user?.userId,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'This operation has strict rate limits. Please try again in 1 hour.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
      timestamp: new Date().toISOString()
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: process.env.NODE_ENV === 'production' ? createMongoStore() : undefined,
  skip: skipRateLimit,
  keyGenerator: (req) => {
    return req.user?.userId || req.ip;
  }
});

/**
 * Create a custom rate limiter with specified options
 * @param {Object} options - Rate limiter options
 * @returns {Function} Rate limiter middleware
 */
const createCustomRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests',
    useUserKey = false
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: (req, res) => {
      logger.warn('Custom rate limit exceeded', {
        userId: req.user?.userId,
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });

      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.round(req.rateLimit.resetTime / 1000),
        timestamp: new Date().toISOString()
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: process.env.NODE_ENV === 'production' ? createMongoStore() : undefined,
    skip: skipRateLimit,
    keyGenerator: useUserKey ? (req) => req.user?.userId || req.ip : undefined
  });
};

/**
 * Middleware to add rate limit headers to responses
 */
const addRateLimitHeaders = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Add rate limit information to API responses
    if (req.rateLimit) {
      const headers = {
        'X-RateLimit-Limit': req.rateLimit.limit,
        'X-RateLimit-Remaining': req.rateLimit.remaining,
        'X-RateLimit-Reset': new Date(req.rateLimit.resetTime).toISOString()
      };
      
      Object.keys(headers).forEach(key => {
        this.set(key, headers[key]);
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  generalRateLimit,
  authRateLimit,
  passwordResetRateLimit,
  registrationRateLimit,
  uploadRateLimit,
  strictRateLimit,
  createCustomRateLimit,
  addRateLimitHeaders
};