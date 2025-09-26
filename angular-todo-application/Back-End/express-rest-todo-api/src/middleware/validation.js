const Joi = require('joi');
const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');

/**
 * Common validation schemas
 */
const commonSchemas = {
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format'),
  email: Joi.string().email().trim().lowercase(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .message('Password must contain at least 8 characters with uppercase, lowercase, number and special character'),
  username: Joi.string().alphanum().min(3).max(30).trim(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).message('Invalid phone number format'),
  url: Joi.string().uri(),
  dateString: Joi.string().isoDate(),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
    sortBy: Joi.string()
  }
};

/**
 * User validation schemas
 */
const userSchemas = {
  register: Joi.object({
    username: commonSchemas.username.required(),
    email: commonSchemas.email.required(),
    password: commonSchemas.password.required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({ 'any.only': 'Passwords do not match' }),
    firstName: Joi.string().min(2).max(50).trim().required(),
    lastName: Joi.string().min(2).max(50).trim().required(),
    phone: commonSchemas.phone.optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    avatar: commonSchemas.url.optional()
  }),
  
  login: Joi.object({
    usernameOrEmail: Joi.string().required(),
    password: Joi.string().required()
  }),
  
  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).trim(),
    lastName: Joi.string().min(2).max(50).trim(),
    phone: commonSchemas.phone,
    dateOfBirth: Joi.date().max('now'),
    avatar: commonSchemas.url
  }).min(1),
  
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonSchemas.password.required(),
    confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({ 'any.only': 'New passwords do not match' })
  }),
  
  forgotPassword: Joi.object({
    email: commonSchemas.email.required()
  }),
  
  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: commonSchemas.password.required(),
    confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({ 'any.only': 'Passwords do not match' })
  })
};

/**
 * List validation schemas
 */
const listSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).trim().required(),
    description: Joi.string().max(500).trim(),
    color: Joi.string().pattern(/^#([0-9a-f]{3}){1,2}$/i).message('Invalid color format'),
    isPublic: Joi.boolean().default(false)
  }),
  
  update: Joi.object({
    name: Joi.string().min(1).max(100).trim(),
    description: Joi.string().max(500).trim(),
    color: Joi.string().pattern(/^#([0-9a-f]{3}){1,2}$/i).message('Invalid color format'),
    isPublic: Joi.boolean()
  }).min(1),
  
  query: Joi.object({
    search: Joi.string().trim(),
    isPublic: Joi.boolean(),
    sortBy: Joi.string().valid('name', 'createdAt', 'updatedAt', 'todoCount').default('updatedAt'),
    ...commonSchemas.pagination
  })
};

/**
 * Todo validation schemas
 */
const todoSchemas = {
  create: Joi.object({
    listId: commonSchemas.objectId.required(),
    title: Joi.string().min(1).max(200).trim().required(),
    description: Joi.string().max(1000).trim(),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    dueDate: Joi.date().min('now'),
    tags: Joi.array().items(Joi.string().trim().max(50)).max(10),
    estimatedTime: Joi.number().integer().min(1).max(10080) // max 1 week in minutes
  }),
  
  update: Joi.object({
    title: Joi.string().min(1).max(200).trim(),
    description: Joi.string().max(1000).trim(),
    priority: Joi.string().valid('low', 'medium', 'high'),
    dueDate: Joi.date().min('now'),
    tags: Joi.array().items(Joi.string().trim().max(50)).max(10),
    estimatedTime: Joi.number().integer().min(1).max(10080),
    isCompleted: Joi.boolean()
  }).min(1),
  
  query: Joi.object({
    listId: commonSchemas.objectId,
    search: Joi.string().trim(),
    priority: Joi.string().valid('low', 'medium', 'high'),
    isCompleted: Joi.boolean(),
    tag: Joi.string().trim(),
    dueDateFrom: Joi.date(),
    dueDateTo: Joi.date().greater(Joi.ref('dueDateFrom')),
    sortBy: Joi.string().valid('title', 'priority', 'dueDate', 'createdAt', 'updatedAt').default('createdAt'),
    ...commonSchemas.pagination
  }),
  
  toggleComplete: Joi.object({
    isCompleted: Joi.boolean().required()
  }),
  
  reorder: Joi.object({
    newOrder: Joi.number().integer().min(0).required()
  })
};

/**
 * Parameter validation schemas
 */
const paramSchemas = {
  objectId: Joi.object({
    id: commonSchemas.objectId.required()
  }),
  
  userId: Joi.object({
    userId: commonSchemas.objectId.required()
  }),
  
  listId: Joi.object({
    listId: commonSchemas.objectId.required()
  }),
  
  todoId: Joi.object({
    todoId: commonSchemas.objectId.required()
  })
};

/**
 * Generic validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Property to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false, // Include all errors
        allowUnknown: false, // Don't allow unknown fields
        stripUnknown: true // Remove unknown fields
      });

      if (error) {
        const errorMessage = error.details
          .map(detail => detail.message.replace(/["']/g, ''))
          .join(', ');
        
        logger.warn(`Validation error on ${property}:`, {
          error: errorMessage,
          data: req[property],
          url: req.originalUrl,
          method: req.method
        });
        
        throw new AppError(`Validation error: ${errorMessage}`, 400);
      }

      // Replace the property with validated and sanitized data
      req[property] = value;
      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Validate request body
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate request parameters
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateParams = (schema) => validate(schema, 'params');

/**
 * Validate query parameters
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateQuery = (schema) => validate(schema, 'query');

/**
 * Specific validation middleware functions
 */
const validators = {
  // User validators
  registerUser: validateBody(userSchemas.register),
  loginUser: validateBody(userSchemas.login),
  updateProfile: validateBody(userSchemas.updateProfile),
  changePassword: validateBody(userSchemas.changePassword),
  forgotPassword: validateBody(userSchemas.forgotPassword),
  resetPassword: validateBody(userSchemas.resetPassword),
  
  // List validators
  createList: validateBody(listSchemas.create),
  updateList: validateBody(listSchemas.update),
  queryLists: validateQuery(listSchemas.query),
  
  // Todo validators
  createTodo: validateBody(todoSchemas.create),
  updateTodo: validateBody(todoSchemas.update),
  queryTodos: validateQuery(todoSchemas.query),
  toggleComplete: validateBody(todoSchemas.toggleComplete),
  reorderTodo: validateBody(todoSchemas.reorder),
  
  // Parameter validators
  objectIdParam: validateParams(paramSchemas.objectId),
  userIdParam: validateParams(paramSchemas.userId),
  listIdParam: validateParams(paramSchemas.listId),
  todoIdParam: validateParams(paramSchemas.todoId)
};

/**
 * File upload validation
 * @param {Object} options - Upload options
 * @returns {Function} Express middleware function
 */
const validateFileUpload = (options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    required = false
  } = options;

  return (req, res, next) => {
    try {
      if (!req.file && required) {
        throw new AppError('File is required', 400);
      }

      if (req.file) {
        // Check file size
        if (req.file.size > maxSize) {
          throw new AppError(`File size too large. Maximum allowed size is ${maxSize / (1024 * 1024)}MB`, 400);
        }

        // Check file type
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new AppError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`, 400);
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  validate,
  validateBody,
  validateParams,
  validateQuery,
  validateFileUpload,
  validators,
  schemas: {
    user: userSchemas,
    list: listSchemas,
    todo: todoSchemas,
    param: paramSchemas,
    common: commonSchemas
  }
};