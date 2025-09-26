const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { catchAsync, AppError } = require('../middleware');
const logger = require('../utils/logger');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = catchAsync(async (req, res, next) => {
  const { username, email, password, firstName, lastName, phone, dateOfBirth, avatar } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return next(new AppError('Email address is already registered', 400));
    }
    if (existingUser.username === username) {
      return next(new AppError('Username is already taken', 400));
    }
  }

  // Create new user
  const user = await User.create({
    username,
    email,
    password,
    firstName,
    lastName,
    phone,
    dateOfBirth,
    avatar
  });

  // Generate JWT token
  const token = generateToken({ userId: user._id });

  // Log successful registration
  logger.info('User registered successfully', {
    userId: user._id,
    username: user.username,
    email: user.email,
    ip: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt
      },
      token
    }
  });
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = catchAsync(async (req, res, next) => {
  const { usernameOrEmail, password } = req.body;

  // Find user by username or email
  const user = await User.findOne({
    $or: [
      { email: usernameOrEmail },
      { username: usernameOrEmail }
    ]
  }).select('+password +loginAttempts +lockUntil');

  if (!user) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Check if account is locked
  if (user.isLocked) {
    return next(new AppError('Account is temporarily locked due to too many failed login attempts', 423));
  }

  // Check if account is active
  if (!user.isActive) {
    return next(new AppError('Account is inactive. Please contact support.', 401));
  }

  // Validate password
  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    // Increment failed login attempts
    await user.incLoginAttempts();
    
    logger.warn('Failed login attempt', {
      usernameOrEmail,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return next(new AppError('Invalid credentials', 401));
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await User.updateOne(
      { _id: user._id },
      {
        $unset: { loginAttempts: 1, lockUntil: 1 }
      }
    );
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT token
  const token = generateToken({ userId: user._id });

  // Log successful login
  logger.info('User logged in successfully', {
    userId: user._id,
    username: user.username,
    email: user.email,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      },
      token
    }
  });
});

/**
 * Get user profile
 * @route GET /api/users/profile
 * @access Private
 */
const getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    }
  });
});

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
const updateProfile = catchAsync(async (req, res, next) => {
  const { firstName, lastName, phone, dateOfBirth, avatar } = req.body;

  const user = await User.findById(req.user.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Update allowed fields
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;
  if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();

  logger.info('User profile updated', {
    userId: user._id,
    updatedFields: Object.keys(req.body)
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        avatar: user.avatar,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      }
    }
  });
});

/**
 * Change password
 * @route PUT /api/users/change-password
 * @access Private
 */
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.userId).select('+password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Verify current password
  const isValidPassword = await user.comparePassword(currentPassword);

  if (!isValidPassword) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Check if new password is different from current
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    return next(new AppError('New password must be different from current password', 400));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  logger.info('User password changed', {
    userId: user._id,
    username: user.username
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * Forgot password - Send reset token
 * @route POST /api/auth/forgot-password
 * @access Public
 */
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal whether email exists or not
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    // TODO: Send email with reset token
    // For now, we'll just log it (in production, integrate with email service)
    logger.info('Password reset requested', {
      userId: user._id,
      email: user.email,
      resetToken: resetToken, // Remove this in production
      ip: req.ip
    });

    // In development, return the token for testing
    const responseData = {
      success: true,
      message: 'Password reset link has been sent to your email.'
    };

    // Include token in development mode for testing
    if (process.env.NODE_ENV === 'development') {
      responseData.resetToken = resetToken;
    }

    res.status(200).json(responseData);

  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email. Please try again.', 500));
  }
});

/**
 * Reset password
 * @route POST /api/auth/reset-password
 * @access Public
 */
const resetPassword = catchAsync(async (req, res, next) => {
  const { token, newPassword } = req.body;

  // Hash token and find user
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // Update password and clear reset token
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  logger.info('Password reset completed', {
    userId: user._id,
    email: user.email,
    ip: req.ip
  });

  // Generate new JWT token
  const jwtToken = generateToken({ userId: user._id });

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully',
    data: {
      token: jwtToken
    }
  });
});

/**
 * Delete user account
 * @route DELETE /api/users/account
 * @access Private
 */
const deleteAccount = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Soft delete - deactivate account
  user.isActive = false;
  user.deletedAt = new Date();
  await user.save();

  logger.info('User account deleted', {
    userId: user._id,
    username: user.username,
    email: user.email
  });

  res.status(200).json({
    success: true,
    message: 'Account has been deactivated successfully'
  });
});

/**
 * Logout user (invalidate token on client side)
 * @route POST /api/auth/logout
 * @access Private
 */
const logout = catchAsync(async (req, res, next) => {
  // JWT tokens are stateless, so we just send a success response
  // The client should remove the token from storage
  
  logger.info('User logged out', {
    userId: req.user.userId,
    username: req.user.username
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * Refresh token
 * @route POST /api/auth/refresh
 * @access Private
 */
const refreshToken = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.userId);

  if (!user || !user.isActive) {
    return next(new AppError('User not found or inactive', 404));
  }

  // Generate new token
  const token = generateToken({ userId: user._id });

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName
      }
    }
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  deleteAccount,
  logout,
  refreshToken
};