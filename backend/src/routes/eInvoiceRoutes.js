/**
 * E-Invoice Routes (Phase 3: E-Invoice)
 * All routes auth-protected + business-scoped. Writes require OWNER/ACCOUNTANT.
 */

const express = require('express');
const router = express.Router();
const eInvoiceController = require('../controllers/eInvoiceController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);

const canWrite = requireRole('OWNER', 'ACCOUNTANT');

// List all e-invoices
router.get('/', eInvoiceController.list);

// Generate / cancel for a specific invoice
router.post('/generate/:invoiceId', canWrite, eInvoiceController.generate);
router.post('/cancel/:invoiceId', canWrite, eInvoiceController.cancel);

// Get e-invoice for a specific invoice
router.get('/:invoiceId', eInvoiceController.getByInvoice);

module.exports = router;
