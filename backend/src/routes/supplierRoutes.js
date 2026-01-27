/**
 * Supplier Routes
 * API endpoints for supplier management
 */

const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All supplier routes require authentication
router.use(authenticateToken);

// Supplier CRUD operations
router.post('/', supplierController.createSupplier);
router.get('/', supplierController.getSuppliers);
router.get('/stats', supplierController.getSupplierStats);
router.get('/:id', supplierController.getSupplierById);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;
