/**
 * Report Routes
 * Reports & Analytics (Phase 2)
 *
 * All endpoints are auth-protected, scoped to the caller's business, and
 * accept ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD and optional ?format=csv.
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/sales-register', reportController.salesRegister);
router.get('/purchase-register', reportController.purchaseRegister);
router.get('/tax-rate-summary', reportController.taxRateSummary);
router.get('/hsn-summary', reportController.hsnSummary);
router.get('/itc-analysis', reportController.itcAnalysis);

module.exports = router;
