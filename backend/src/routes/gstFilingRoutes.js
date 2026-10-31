/**
 * GST Filing Routes (Phase 3: GST filing STUB)
 * Auth-protected + business-scoped. Writes require OWNER/ACCOUNTANT.
 */

const express = require('express');
const router = express.Router();
const gstFilingController = require('../controllers/gstFilingController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);

const canWrite = requireRole('OWNER', 'ACCOUNTANT');

router.post('/file', canWrite, gstFilingController.file);
router.get('/status/:referenceId', gstFilingController.status);

module.exports = router;
