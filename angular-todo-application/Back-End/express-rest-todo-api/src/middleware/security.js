const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const logger = require('../utils/logger');

/**
 * CORS configuration
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:4200', // Angular development server
      'http://localhost:3000', // React development server (if used)
      'http://127.0.0.1:4200',
      'http://127.0.0.1:3000'
    ];
    
    // Add production origins from environment variables
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    if (process.env.ALLOWED_ORIGINS) {
      const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',');
      allowedOrigins.push(...additionalOrigins);
    }
    
    if (process.env.NODE_ENV === 'development') {
      // In development, be more permissive
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request from origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-API-Key'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Per-Page',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
};

/**
 * Helmet configuration for security headers
 */
const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
};

/**
 * HTTP Parameter Pollution (HPP) protection
 */
const hppOptions = {
  whitelist: ['sort', 'fields', 'page', 'limit', 'tags']
};

/**
 * Express Mongo Sanitize configuration
 */
const mongoSanitizeOptions = {
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn('Potentially malicious input detected and sanitized', {
      key,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
};

/**
 * Custom security middleware to add additional headers
 */
const additionalSecurityHeaders = (req, res, next) => {
  // Remove server header
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Add API version header
  res.setHeader('X-API-Version', process.env.API_VERSION || '1.0.0');
  
  next();
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    userId: req.user?.userId,
    timestamp: new Date().toISOString()
  });
  
  // Log response when finished
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    logger.info('Response sent', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || (data ? data.length : 0),
      userId: req.user?.userId,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * IP whitelist/blacklist middleware
 */
const createIpFilter = (options = {}) => {
  const { 
    whitelist = [], 
    blacklist = [],
    message = 'Access denied from this IP address' 
  } = options;

  return (req, res, next) => {
    const clientIp = req.ip;
    
    // Check blacklist first
    if (blacklist.length > 0 && blacklist.includes(clientIp)) {
      logger.warn('Blacklisted IP attempted access', {
        ip: clientIp,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message
      });
    }
    
    // Check whitelist if defined
    if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
      logger.warn('Non-whitelisted IP attempted access', {
        ip: clientIp,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message
      });
    }
    
    next();
  };
};

/**
 * User-Agent validation middleware
 */
const validateUserAgent = (req, res, next) => {
  const userAgent = req.get('User-Agent');
  
  if (!userAgent || userAgent.trim() === '') {
    logger.warn('Request without User-Agent header', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method
    });
    
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'User-Agent header is required'
    });
  }
  
  // Block known malicious user agents (basic check)
  const maliciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /masscan/i,
    /zmap/i,
    /nmap/i,
    /<script/i,
    /javascript:/i
  ];
  
  const isMalicious = maliciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isMalicious) {
    logger.warn('Potentially malicious User-Agent detected', {
      userAgent,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method
    });
    
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Request blocked due to suspicious User-Agent'
    });
  }
  
  next();
};

/**
 * Request size limiter middleware
 */
const createRequestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSizeBytes = typeof maxSize === 'string' 
      ? parseFloat(maxSize) * (maxSize.includes('mb') ? 1024 * 1024 : maxSize.includes('kb') ? 1024 : 1)
      : maxSize;
    
    if (contentLength > maxSizeBytes) {
      logger.warn('Request size limit exceeded', {
        contentLength,
        maxSize: maxSizeBytes,
        ip: req.ip,
        url: req.originalUrl,
        method: req.method
      });
      
      return res.status(413).json({
        success: false,
        error: 'Payload Too Large',
        message: `Request size exceeds limit of ${maxSize}`
      });
    }
    
    next();
  };
};

/**
 * Apply all security middleware
 */
const applySecurityMiddleware = (app) => {
  // Trust proxy (for accurate IP addresses behind load balancer)
  app.set('trust proxy', 1);
  
  // Apply security headers
  app.use(helmet(helmetOptions));
  app.use(additionalSecurityHeaders);
  
  // Apply CORS
  app.use(cors(corsOptions));
  
  // Data sanitization against NoSQL injection
  app.use(mongoSanitize(mongoSanitizeOptions));
  
  // Data sanitization against XSS
  app.use(xss());
  
  // Prevent parameter pollution
  app.use(hpp(hppOptions));
  
  // Request logging
  if (process.env.LOG_REQUESTS !== 'false') {
    app.use(requestLogger);
  }
  
  // User-Agent validation
  app.use(validateUserAgent);
};

module.exports = {
  corsOptions,
  helmetOptions,
  hppOptions,
  mongoSanitizeOptions,
  additionalSecurityHeaders,
  requestLogger,
  createIpFilter,
  validateUserAgent,
  createRequestSizeLimit,
  applySecurityMiddleware
};