/**
 * Dashboard Routes
 * API endpoints for dashboard metrics and analytics
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All dashboard routes require authentication
router.use(authenticateToken);

// Dashboard endpoints
router.get('/overview', dashboardController.getDashboardOverview);
router.get('/top-customers', dashboardController.getTopCustomers);
router.get('/top-suppliers', dashboardController.getTopSuppliers);
router.get('/revenue-trend', dashboardController.getRevenueTrend);
router.get('/deadlines', dashboardController.getGstDeadlines);
router.get('/quick-stats', dashboardController.getQuickStats);

module.exports = router;
