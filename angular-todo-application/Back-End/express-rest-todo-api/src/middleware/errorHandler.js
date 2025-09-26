const logger = require('../utils/logger');

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true, stack = '') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Handle CastError (invalid MongoDB ObjectId)
 * @param {Error} err - CastError object
 * @returns {AppError} - Formatted application error
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle duplicate key error (MongoDB duplicate field)
 * @param {Error} err - MongoDB duplicate key error
 * @returns {AppError} - Formatted application error
 */
const handleDuplicateKeyErrorDB = (err) => {
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0];
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

/**
 * Handle validation error (MongoDB/Mongoose validation)
 * @param {Error} err - Validation error object
 * @returns {AppError} - Formatted application error
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(val => val.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Handle JWT invalid signature error
 * @returns {AppError} - Formatted application error
 */
const handleJWTError = () => 
  new AppError('Invalid token. Please log in again', 401);

/**
 * Handle JWT expired error
 * @returns {AppError} - Formatted application error
 */
const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again', 401);

/**
 * Send error response for development environment
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendErrorDev = (err, req, res) => {
  // Log the full error in development
  logger.error('Error:', {
    error: err,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // API error response
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.name,
      message: err.message,
      stack: err.stack,
      details: {
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Rendered website error (if you have views)
  res.status(err.statusCode).json({
    success: false,
    error: 'Something went wrong',
    message: err.message,
    stack: err.stack
  });
};

/**
 * Send error response for production environment
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendErrorProd = (err, req, res) => {
  // Log error details for monitoring
  logger.error('Production Error:', {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // API error response
  if (req.originalUrl.startsWith('/api')) {
    // Operational errors: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.status,
        message: err.message,
        timestamp: new Date().toISOString()
      });
    }

    // Programming or other unknown errors: don't leak error details
    return res.status(500).json({
      success: false,
      error: 'error',
      message: 'Something went wrong on our end',
      timestamp: new Date().toISOString()
    });
  }

  // Rendered website error
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: 'Something went wrong',
      message: err.message
    });
  }

  // Programming or unknown errors
  res.status(500).json({
    success: false,
    error: 'Something went wrong',
    message: 'Please try again later'
  });
};

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateKeyErrorDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

/**
 * Catch-all handler for undefined routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404);
  next(err);
};

/**
 * Async error catcher wrapper
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function with error handling
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', err);
    // Close server & exit process
    process.exit(1);
  });
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception thrown:', err);
    process.exit(1);
  });
};

/**
 * Handle SIGTERM signal (graceful shutdown)
 */
const handleSigterm = (server) => {
  process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
      logger.info('💥 Process terminated');
    });
  });
};

module.exports = {
  AppError,
  globalErrorHandler,
  notFoundHandler,
  catchAsync,
  handleUnhandledRejection,
  handleUncaughtException,
  handleSigterm
};