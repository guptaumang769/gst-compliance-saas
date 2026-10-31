/**
 * Financials Routes (Phase 3: Financials)
 * All routes auth-protected + business-scoped (read-only computations).
 */

const express = require('express');
const router = express.Router();
const financialsController = require('../controllers/financialsController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/pnl', financialsController.pnl);
router.get('/balance-sheet', financialsController.balanceSheet);

module.exports = router;
