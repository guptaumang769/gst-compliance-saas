/**
 * Authentication Middleware
 * Verifies JWT token and protects routes
 * Week 2: Authentication Module
 */

const authService = require('../services/authService');

/**
 * Verify JWT token from Authorization header
 * Protects routes that require authentication
 * 
 * Usage:
 * router.get('/protected', authenticateToken, controller.method);
 */
function authenticateToken(req, res, next) {
  try {
    // Get token from Authorization header
    // Format: "Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token after "Bearer "
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required',
        message: 'Please provide a valid authentication token'
      });
    }
    
    // Verify token
    const decoded = authService.verifyToken(token);
    
    // Attach user info to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    // Continue to next middleware/controller
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.message === 'Token has expired') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      });
    }
    
    if (error.message === 'Invalid token') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'The provided token is invalid'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Could not authenticate request'
    });
  }
}

/**
 * Check if user has specific role
 * 
 * Usage:
 * router.delete('/admin-only', authenticateToken, authorizeRole('admin'), controller.method);
 */
function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }
      
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Access forbidden',
          message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
        });
      }
      
      next();
      
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(403).json({
        success: false,
        error: 'Authorization failed'
      });
    }
  };
}

/**
 * Optional authentication
 * Doesn't fail if token is missing, but validates if provided
 * 
 * Usage:
 * router.get('/public-but-personalized', optionalAuth, controller.method);
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      // Token provided, verify it
      const decoded = authService.verifyToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
    }
    
    // Continue regardless of token presence
    next();
    
  } catch (error) {
    // If token is invalid, just continue without user info
    next();
  }
}

module.exports = {
  authenticateToken,
  authorizeRole,
  optionalAuth
};
