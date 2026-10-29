/**
 * Supplier Routes
 * API endpoints for supplier management
 */

const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const importController = require('../controllers/importController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { uploadCsv, handleUpload } = require('../middleware/uploadMiddleware');

// All supplier routes require authentication
router.use(authenticateToken);

const canWrite = requireRole('OWNER', 'ACCOUNTANT');

// Bulk CSV import (place before /:id to avoid conflicts)
router.get('/import/template', importController.supplierTemplate);
router.post('/import', canWrite, handleUpload(uploadCsv), importController.importSuppliers);

// Supplier CRUD operations
router.post('/', supplierController.createSupplier);
router.get('/', supplierController.getSuppliers);
router.get('/stats', supplierController.getSupplierStats);
router.get('/:id', supplierController.getSupplierById);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;
