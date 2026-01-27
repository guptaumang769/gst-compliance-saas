/**
 * GSTR-1 Routes
 * API endpoints for GSTR-1 return generation and management
 */

const express = require('express');
const router = express.Router();
const gstr1Controller = require('../controllers/gstr1Controller');
const { authenticateToken } = require('../middleware/authMiddleware');

// All GSTR-1 routes require authentication
router.use(authenticateToken);

// GSTR-1 operations
router.post('/generate', gstr1Controller.generateGSTR1);
router.get('/:year/:month', gstr1Controller.getGSTR1);
router.get('/:year/:month/export/json', gstr1Controller.exportGSTR1JSON);

module.exports = router;
