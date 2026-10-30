/**
 * E-Way Bill Routes (Phase 3: E-Way Bill)
 * All routes auth-protected + business-scoped. Writes require OWNER/ACCOUNTANT.
 */

const express = require('express');
const router = express.Router();
const ewayBillController = require('../controllers/ewayBillController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);

const canWrite = requireRole('OWNER', 'ACCOUNTANT');

// Create a draft from an invoice (place before /:id to avoid conflicts)
router.post('/from-invoice/:invoiceId', canWrite, ewayBillController.createFromInvoice);

router.get('/', ewayBillController.getEwayBills);
router.post('/', canWrite, ewayBillController.createEwayBill);

router.get('/:id', ewayBillController.getEwayBillById);
router.put('/:id', canWrite, ewayBillController.updateEwayBill);
router.delete('/:id', canWrite, ewayBillController.deleteEwayBill);

router.post('/:id/generate', canWrite, ewayBillController.generateEwayBill);
router.post('/:id/cancel', canWrite, ewayBillController.cancelEwayBill);

module.exports = router;
