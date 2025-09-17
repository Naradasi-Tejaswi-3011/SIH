const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Check for token in cookies (if using cookie-based auth)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).select('+isActive');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No user found with this token'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account has been deactivated'
      });
    }

    // Check if user account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'User account is temporarily locked due to failed login attempts'
      });
    }

    // Check if user is verified (if required)
    if (!user.isVerified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address to continue'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this resource`
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('+isActive');

      if (user && user.isActive && !user.isLocked) {
        req.user = user;
      }
    } catch (error) {
      // Silently fail for optional auth
      logger.debug('Optional auth token verification failed:', error.message);
    }
  }

  next();
};

// Check if user owns the resource or has admin access
const checkOwnership = (resourceField = 'user') => {
  return async (req, res, next) => {
    try {
      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      // Get resource ID from params or body
      const resourceId = req.params.id || req.params.userId || req.body[resourceField];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required'
        });
      }

      // Check if user owns the resource
      if (req.user._id.toString() === resourceId.toString()) {
        return next();
      }

      // For appointments, check if user is patient, doctor, or therapist
      if (req.baseUrl.includes('appointment')) {
        const Appointment = require('../models/Appointment');
        const appointment = await Appointment.findById(resourceId);
        
        if (appointment) {
          const userIsParticipant = 
            appointment.patient.toString() === req.user._id.toString() ||
            appointment.doctor.toString() === req.user._id.toString() ||
            appointment.therapist.toString() === req.user._id.toString();
            
          if (userIsParticipant) {
            return next();
          }
        }
      }

      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    } catch (error) {
      logger.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during authorization check'
      });
    }
  };
};

// Rate limiting for sensitive operations
const rateLimitSensitive = (windowMs = 15 * 60 * 1000, maxAttempts = 5) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + (req.user ? req.user._id : '');
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old attempts
    const userAttempts = attempts.get(key) || [];
    const recentAttempts = userAttempts.filter(time => time > windowStart);

    if (recentAttempts.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please try again later.',
        retryAfter: Math.ceil((recentAttempts[0] + windowMs - now) / 1000)
      });
    }

    // Add current attempt
    recentAttempts.push(now);
    attempts.set(key, recentAttempts);

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      for (const [k, v] of attempts.entries()) {
        if (v.length === 0 || v[v.length - 1] < windowStart) {
          attempts.delete(k);
        }
      }
    }

    next();
  };
};

// Middleware to check if user can perform specific actions based on role and permissions
const checkPermission = (permission) => {
  const permissions = {
    // User management
    'users.create': ['admin'],
    'users.read.all': ['admin'],
    'users.update.all': ['admin'],
    'users.delete': ['admin'],
    
    // Therapy management
    'therapies.create': ['admin', 'doctor'],
    'therapies.update': ['admin', 'doctor'],
    'therapies.delete': ['admin'],
    
    // Appointment management
    'appointments.create': ['admin', 'doctor', 'patient'],
    'appointments.update.all': ['admin'],
    'appointments.cancel.any': ['admin'],
    'appointments.reschedule.any': ['admin'],
    
    // Feedback management
    'feedback.moderate': ['admin', 'doctor'],
    'feedback.respond': ['admin', 'doctor', 'therapist'],
    
    // System management
    'system.monitor': ['admin'],
    'system.backup': ['admin'],
    'system.settings': ['admin'],
    
    // Reports and analytics
    'reports.financial': ['admin'],
    'reports.clinical': ['admin', 'doctor'],
    'reports.operational': ['admin']
  };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const allowedRoles = permissions[permission];
    
    if (!allowedRoles) {
      logger.warn(`Unknown permission requested: ${permission}`);
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware to log user activity
const logActivity = (action) => {
  return (req, res, next) => {
    req.activityLog = {
      action,
      user: req.user ? req.user._id : null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
      resource: req.originalUrl,
      method: req.method
    };

    // Log the activity
    logger.info('User activity:', req.activityLog);

    next();
  };
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  checkOwnership,
  rateLimitSensitive,
  checkPermission,
  logActivity
};