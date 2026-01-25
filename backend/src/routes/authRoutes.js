/**
 * Authentication Routes
 * Defines API endpoints for authentication
 * Week 2: Authentication Module
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Public routes (no authentication required)
 */

// POST /api/auth/register - Register new user
router.post('/register', authController.register);

// POST /api/auth/login - Login user
router.post('/login', authController.login);

/**
 * Protected routes (authentication required)
 */

// GET /api/auth/me - Get current user profile
router.get('/me', authenticateToken, authController.getProfile);

// POST /api/auth/logout - Logout user
router.post('/logout', authenticateToken, authController.logout);

// POST /api/auth/change-password - Change password
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
