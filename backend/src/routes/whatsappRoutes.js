/**
 * WhatsApp Routes (Phase 3: WhatsApp)
 * Auth-protected + business-scoped. Read-only link builder.
 */

const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/invoice-link/:invoiceId', whatsappController.invoiceLink);

module.exports = router;
