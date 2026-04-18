/**
 * GSTR-2A/2B Reconciliation Routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const gstr2ReconciliationController = require('../controllers/gstr2ReconciliationController');

// All routes require authentication
router.use(authenticateToken);

// Get available filing periods
router.get('/periods', gstr2ReconciliationController.getAvailablePeriods);

// Get reconciliation entries with filters
router.get('/entries', gstr2ReconciliationController.getReconciliationEntries);

// Get reconciliation summary for a period
router.get('/summary/:filingPeriod', gstr2ReconciliationController.getReconciliationSummary);

// Get ITC report for a period (GSTR-2B)
router.get('/itc-report/:filingPeriod', gstr2ReconciliationController.generateItcReport);

// Get purchases not in GSTR-2A/2B (only in books)
router.get('/unmatched-purchases/:filingPeriod', gstr2ReconciliationController.getPurchasesNotInGstr2);

// Import single GSTR-2A/2B entry
router.post('/import', gstr2ReconciliationController.importSingleEntry);

// Import bulk GSTR-2A/2B entries (JSON upload)
router.post('/import/bulk', gstr2ReconciliationController.importBulkEntries);

// Run reconciliation for a period
router.post('/reconcile', gstr2ReconciliationController.runReconciliation);

// Update action on a reconciliation entry
router.put('/entries/:id/action', gstr2ReconciliationController.updateReconciliationAction);

// Delete a reconciliation entry
router.delete('/entries/:id', gstr2ReconciliationController.deleteReconciliationEntry);

module.exports = router;
