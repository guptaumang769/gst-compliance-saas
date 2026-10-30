/**
 * TDS/TCS Routes (Phase 3: TDS/TCS)
 * All routes auth-protected + business-scoped. Writes require OWNER/ACCOUNTANT.
 */

const express = require('express');
const router = express.Router();
const tdsTcsController = require('../controllers/tdsTcsController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);

const canWrite = requireRole('OWNER', 'ACCOUNTANT');

// Summary (place before /:id to avoid conflicts)
router.get('/summary', tdsTcsController.getSummary);

router.get('/', tdsTcsController.getEntries);
router.post('/', canWrite, tdsTcsController.createEntry);

router.get('/:id', tdsTcsController.getEntryById);
router.put('/:id', canWrite, tdsTcsController.updateEntry);
router.delete('/:id', canWrite, tdsTcsController.deleteEntry);

module.exports = router;
