/**
 * Inventory Routes (Phase 3: Inventory)
 * All routes auth-protected + business-scoped. Writes require OWNER/ACCOUNTANT.
 */

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);

const canWrite = requireRole('OWNER', 'ACCOUNTANT');

router.get('/', inventoryController.getInventory);
router.get('/movements', inventoryController.getMovements);
router.get('/low-stock', inventoryController.getLowStock);
router.post('/adjust', canWrite, inventoryController.adjustStock);

module.exports = router;
