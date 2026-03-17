/**
 * Authentication Routes
 * Defines API endpoints for authentication
 * Week 2: Authentication Module
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', authenticateToken, authController.getProfile);
router.post('/logout', authenticateToken, authController.logout);
router.post('/change-password', authenticateToken, authController.changePassword);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/settings', authenticateToken, authController.updateSettings);

module.exports = router;
