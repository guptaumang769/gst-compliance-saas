/**
 * Audit Log Routes
 */

const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// GET /api/audit-logs - paginated audit logs for the business
router.get('/', auditLogController.getAuditLogs);

module.exports = router;
