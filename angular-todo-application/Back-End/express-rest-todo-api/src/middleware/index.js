/**
 * Middleware exports - centralized middleware imports
 */

const auth = require('./auth');
const errorHandler = require('./errorHandler');
const validation = require('./validation');
const rateLimiter = require('./rateLimiterSimple');
const security = require('./security');

module.exports = {
  // Authentication middleware
  authMiddleware: auth.authMiddleware,
  optionalAuthMiddleware: auth.optionalAuthMiddleware,
  adminMiddleware: auth.adminMiddleware,
  // authRateLimit: auth.authRateLimit, // moved to rate limiter
  ownershipMiddleware: auth.ownershipMiddleware,
  
  // Error handling
  AppError: errorHandler.AppError,
  globalErrorHandler: errorHandler.globalErrorHandler,
  notFoundHandler: errorHandler.notFoundHandler,
  catchAsync: errorHandler.catchAsync,
  handleUnhandledRejection: errorHandler.handleUnhandledRejection,
  handleUncaughtException: errorHandler.handleUncaughtException,
  handleSigterm: errorHandler.handleSigterm,
  
  // Validation middleware
  validate: validation.validate,
  validateBody: validation.validateBody,
  validateParams: validation.validateParams,
  validateQuery: validation.validateQuery,
  validateFileUpload: validation.validateFileUpload,
  validators: validation.validators,
  schemas: validation.schemas,
  
  // Rate limiting
  generalRateLimit: rateLimiter.generalRateLimit,
  authRateLimit: rateLimiter.authRateLimit,
  passwordResetRateLimit: rateLimiter.passwordResetRateLimit,
  registrationRateLimit: rateLimiter.registrationRateLimit,
  
  // Security middleware
  corsOptions: security.corsOptions,
  helmetOptions: security.helmetOptions,
  hppOptions: security.hppOptions,
  mongoSanitizeOptions: security.mongoSanitizeOptions,
  additionalSecurityHeaders: security.additionalSecurityHeaders,
  requestLogger: security.requestLogger,
  createIpFilter: security.createIpFilter,
  validateUserAgent: security.validateUserAgent,
  createRequestSizeLimit: security.createRequestSizeLimit,
  applySecurityMiddleware: security.applySecurityMiddleware
};