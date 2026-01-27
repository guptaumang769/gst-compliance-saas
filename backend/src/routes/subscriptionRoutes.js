/**
 * Subscription Routes
 * Week 11-12: Subscription API Endpoints
 * 
 * Defines routes for subscription management
 */

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All subscription routes require authentication
router.use(authenticateToken);

/**
 * Subscription Management
 */

// GET /api/subscriptions/status - Get current subscription status
router.get('/status', subscriptionController.getSubscriptionStatus);

// GET /api/subscriptions/plans - Get all available plans
router.get('/plans', subscriptionController.getAvailablePlans);

// GET /api/subscriptions/plans/comparison - Get plan comparison data
router.get('/plans/comparison', subscriptionController.getPlanComparisonData);

// GET /api/subscriptions/recommendation - Get recommended plan
router.get('/recommendation', subscriptionController.getPlanRecommendation);

// POST /api/subscriptions/start-trial - Start trial subscription
router.post('/start-trial', subscriptionController.startTrial);

// POST /api/subscriptions/cancel - Cancel subscription
router.post('/cancel', subscriptionController.cancelSubscription);

// GET /api/subscriptions/check-feature/:feature - Check feature access
router.get('/check-feature/:feature', subscriptionController.checkFeatureAccess);

// GET /api/subscriptions/check-limit/invoices - Check invoice limit
router.get('/check-limit/invoices', subscriptionController.checkInvoiceLimit);

module.exports = router;
