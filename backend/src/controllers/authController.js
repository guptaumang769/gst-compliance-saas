/**
 * Authentication Controller
 * Handles HTTP requests for authentication
 * Week 2: Authentication Module
 */

const authService = require('../services/authService');

/**
 * POST /api/auth/register
 * Register a new user with business details
 */
async function register(req, res) {
  try {
    const { 
      email, 
      password, 
      businessName, 
      gstin, 
      pan, 
      state,
      addressLine1,
      addressLine2,
      city,
      pincode,
      businessType,
      phone,
      businessEmail
    } = req.body;
    
    console.log('Registering user with data:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    if (!email || !password || !businessName || !gstin || !pan || !state) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['email', 'password', 'businessName', 'gstin', 'pan', 'state']
      });
    }
    
    // Call service
    const result = await authService.register({
      email,
      password,
      businessName,
      gstin,
      pan,
      state,
      addressLine1,
      addressLine2,
      city,
      pincode,
      businessType,
      phone,
      businessEmail
    });
    
    // Return success response
    return res.status(201).json(result);
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific errors
    if (error.message.includes('already exists') || error.message.includes('already registered')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    // Generic error
    return res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.'
    });
  }
}

/**
 * POST /api/auth/login
 * Login user with email and password
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // Call service
    const result = await authService.login(email, password);
    
    // Return success response
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific errors
    if (error.message.includes('Invalid email or password') || error.message.includes('deactivated')) {
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }
    
    // Generic error
    return res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
}

/**
 * GET /api/auth/me
 * Get current user profile
 * Requires authentication
 */
async function getProfile(req, res) {
  try {
    // User ID comes from auth middleware (req.user)
    const userId = req.user.userId;
    
    // Call service
    const result = await authService.getUserProfile(userId);
    
    // Return success response
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Get profile error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
}

/**
 * POST /api/auth/logout
 * Logout user (client-side removes token)
 */
async function logout(req, res) {
  // In JWT-based auth, logout is handled client-side by removing the token
  // Server can optionally blacklist the token, but that's for later
  
  return res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
}

/**
 * POST /api/auth/change-password
 * Change user password
 * Requires authentication
 */
async function changePassword(req, res) {
  try {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;
    
    // Validate required fields
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Old password and new password are required'
      });
    }
    
    // Call service
    const result = await authService.changePassword(userId, oldPassword, newPassword);
    
    // Return success response
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.message.includes('incorrect') || error.message.includes('must be')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  logout,
  changePassword
};
