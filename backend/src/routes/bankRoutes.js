/**
 * Bank Reconciliation Routes (Phase 3: Bank Reconciliation)
 * All routes auth-protected + business-scoped. Writes require OWNER/ACCOUNTANT.
 *
 * POST /statements accepts EITHER multipart CSV (field 'file') OR JSON rows.
 */

const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { uploadCsv, handleUpload } = require('../middleware/uploadMiddleware');

router.use(authenticateToken);

const canWrite = requireRole('OWNER', 'ACCOUNTANT');

router.get('/statements', bankController.getStatements);
router.post('/statements', canWrite, handleUpload(uploadCsv), bankController.createStatement);

router.get('/transactions', bankController.getTransactions);
router.put('/transactions/:id', canWrite, bankController.updateTransaction);

router.post('/reconcile', canWrite, bankController.reconcile);
router.get('/summary', bankController.getSummary);

module.exports = router;
