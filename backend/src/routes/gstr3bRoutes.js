/**
 * GSTR-3B Routes
 * API endpoints for GSTR-3B return generation and management
 */

const express = require('express');
const router = express.Router();
const gstr3bController = require('../controllers/gstr3bController');
const { authenticate } = require('../middleware/authMiddleware');

// All GSTR-3B routes require authentication
router.use(authenticate);

// GSTR-3B operations
router.post('/generate', gstr3bController.generateGSTR3B);
router.get('/:year/:month', gstr3bController.getGSTR3B);
router.get('/:year/:month/export/json', gstr3bController.exportGSTR3BJSON);

module.exports = router;
