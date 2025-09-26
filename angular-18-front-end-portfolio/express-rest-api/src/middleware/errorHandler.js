/**
 * Error Handling Middleware
 * Centralized error handling for all API endpoints
 */

const logger = require('../utils/logger');
const config = require('../config/config');

// Custom error classes
class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends APIError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class NotFoundError extends APIError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends APIError {
  constructor(message = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends APIError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

class ServiceUnavailableError extends APIError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

// Error response formatter
const formatErrorResponse = (error, req) => {
  const isDevelopment = config.isDevelopment();
  
  const errorResponse = {
    success: false,
    message: error.message || 'An unexpected error occurred',
    error: {
      code: error.code || 'INTERNAL_ERROR',
      details: error.details || null,
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: config.api.version,
      requestId: req.id || null,
    },
  };

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  // Add validation errors if present
  if (error.name === 'ValidationError' && error.details) {
    errorResponse.error.validationErrors = error.details;
  }

  return errorResponse;
};

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  logger.logError(error, req, {
    errorType: error.constructor.name,
    isOperational: error.isOperational,
  });

  // Handle different types of errors
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));
    error = new ValidationError('Validation failed', validationErrors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error = new ConflictError(`Duplicate ${field}: ${value}`);
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    error = new ValidationError(`Invalid ${err.path}: ${err.value}`);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new UnauthorizedError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new UnauthorizedError('Token expired');
  }

  // Axios errors (for JSON Server requests)
  if (err.response && err.response.status) {
    const status = err.response.status;
    const message = err.response.data?.message || err.message;
    
    if (status === 404) {
      error = new NotFoundError('Requested resource');
    } else if (status === 400) {
      error = new ValidationError(message);
    } else if (status >= 500) {
      error = new ServiceUnavailableError('External service unavailable');
    } else {
      error = new APIError(message, status, 'EXTERNAL_SERVICE_ERROR');
    }
  }

  // Handle ECONNREFUSED (JSON Server down)
  if (err.code === 'ECONNREFUSED') {
    error = new ServiceUnavailableError('Data service is currently unavailable');
  }

  // Handle timeout errors
  if (err.code === 'ECONNABORTED' || err.timeout) {
    error = new ServiceUnavailableError('Request timeout - service is taking too long to respond');
  }

  // Default to APIError if not already an operational error
  if (!error.isOperational) {
    error = new APIError(
      config.isDevelopment() ? err.message : 'Something went wrong',
      500,
      'INTERNAL_ERROR'
    );
  }

  // Set default status code
  const statusCode = error.statusCode || 500;

  // Format and send error response
  const errorResponse = formatErrorResponse(error, req);
  
  res.status(statusCode).json(errorResponse);
};

// 404 handler for non-existent routes
const notFoundHandler = (req, res) => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  const errorResponse = formatErrorResponse(error, req);
  res.status(404).json(errorResponse);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Helper function to create standardized success responses
const createSuccessResponse = (data, message = 'Success', meta = {}) => ({
  success: true,
  message,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    version: config.api.version,
    ...meta,
  },
});

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createSuccessResponse,
  
  // Error classes
  APIError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ServiceUnavailableError,
};