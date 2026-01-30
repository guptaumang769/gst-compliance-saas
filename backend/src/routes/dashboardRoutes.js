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
router.get('/summary', dashboardController.getDashboardOverview); // Alias for /overview
router.get('/overview', dashboardController.getDashboardOverview);
router.get('/tax-liability', dashboardController.getDashboardOverview); // Alias
router.get('/itc-summary', dashboardController.getDashboardOverview); // Alias
router.get('/net-tax-payable', dashboardController.getDashboardOverview); // Alias
router.get('/top-customers', dashboardController.getTopCustomers);
router.get('/top-suppliers', dashboardController.getTopSuppliers);
router.get('/revenue-trend', dashboardController.getRevenueTrend);
router.get('/deadlines', dashboardController.getGstDeadlines);
router.get('/quick-stats', dashboardController.getQuickStats);

module.exports = router;
