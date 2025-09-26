const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.'
  }
});

/**
 * Authentication rate limiter
 * 10 attempts per 15 minutes per IP (increased for development)
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts',
    message: 'Too many login attempts from this IP. Please try again in 15 minutes.'
  }
});

/**
 * Registration rate limiter
 * 5 registrations per hour per IP
 */
const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 registration attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many registration attempts',
    message: 'Too many registration attempts from this IP. Please try again in 1 hour.'
  }
});

/**
 * Password reset rate limiter
 * 5 attempts per hour per IP
 */
const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 password reset requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many password reset attempts',
    message: 'Too many password reset requests from this IP. Please try again in 1 hour.'
  }
});

module.exports = {
  generalRateLimit,
  authRateLimit,
  passwordResetRateLimit,
  registrationRateLimit
};