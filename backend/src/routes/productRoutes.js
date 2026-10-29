/**
 * Product Routes
 * Product / Service Master (Week: Product Master)
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const importController = require('../controllers/importController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { uploadCsv, handleUpload } = require('../middleware/uploadMiddleware');

// All product routes require authentication
router.use(authenticateToken);

// Mutating routes: VIEWER is read-only (OWNER/ACCOUNTANT may write)
const canWrite = requireRole('OWNER', 'ACCOUNTANT');

// Bulk CSV import (place before /:id to avoid conflicts)
router.get('/import/template', importController.productTemplate);
router.post('/import', canWrite, handleUpload(uploadCsv), importController.importProducts);

// POST /api/products - create
router.post('/', canWrite, productController.createProduct);

// GET /api/products - list (search, page, limit)
router.get('/', productController.getProducts);

// GET /api/products/:id - get by id
router.get('/:id', productController.getProductById);

// PUT /api/products/:id - update
router.put('/:id', canWrite, productController.updateProduct);

// DELETE /api/products/:id - soft delete
router.delete('/:id', canWrite, productController.deleteProduct);

module.exports = router;
