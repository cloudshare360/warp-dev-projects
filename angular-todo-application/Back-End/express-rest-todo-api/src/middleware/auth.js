const { verifyToken, extractToken } = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Authentication middleware to verify JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'No token provided'
      });
    }
    
    // Verify the token
    const decoded = verifyToken(token);
    
    // Find the user in database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'User not found'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'User account is inactive'
      });
    }
    
    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        error: 'Account locked',
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }
    
    // Add user info to request object
    req.user = {
      userId: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      isActive: user.isActive,
      tokenExp: decoded.exp
    };
    
    logger.debug(`Authenticated user: ${user.username} (${user._id})`);
    next();
    
  } catch (error) {
    logger.warn('Authentication failed:', error.message);
    
    let message = 'Invalid token';
    let statusCode = 401;
    
    if (error.message === 'Token expired') {
      message = 'Token has expired';
      statusCode = 401;
    } else if (error.message === 'Invalid token') {
      message = 'Invalid or malformed token';
      statusCode = 401;
    }
    
    return res.status(statusCode).json({
      success: false,
      error: 'Authentication failed',
      message
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive && !user.isLocked) {
        req.user = {
          userId: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          isActive: user.isActive,
          tokenExp: decoded.exp
        };
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we just continue without user info
    logger.debug('Optional auth failed:', error.message);
    next();
  }
};

/**
 * Admin-only middleware - requires user to be authenticated and admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const adminMiddleware = async (req, res, next) => {
  try {
    // First check if user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'Authentication required'
      });
    }
    
    // For now, all users can access their own data
    // In a real application, you might have an isAdmin field
    // const user = await User.findById(req.user.userId);
    // if (!user.isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Forbidden',
    //     message: 'Admin access required'
    //   });
    // }
    
    next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Error checking admin privileges'
    });
  }
};

/**
 * Rate limiting for authentication endpoints
 */
const authRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    success: false,
    error: 'Too many authentication attempts',
    message: 'Too many login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Middleware to check if user owns resource
 * @param {String} resourceField - The field name to check (e.g., 'userId')
 * @returns {Function} Express middleware function
 */
const ownershipMiddleware = (resourceField = 'userId') => {
  return (req, res, next) => {
    try {
      const resourceUserId = req.params[resourceField] || req.body[resourceField];
      
      if (!resourceUserId) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Resource owner ID is required'
        });
      }
      
      if (req.user.userId.toString() !== resourceUserId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You can only access your own resources'
        });
      }
      
      next();
    } catch (error) {
      logger.error('Ownership middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error',
        message: 'Error checking resource ownership'
      });
    }
  };
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware,
  authRateLimit,
  ownershipMiddleware
};