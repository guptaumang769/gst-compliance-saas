/**
 * Insights Routes (Phase 3: Insights)
 * Auth-protected + business-scoped. Read-only; always returns an array.
 */

const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', insightsController.getInsights);

module.exports = router;
