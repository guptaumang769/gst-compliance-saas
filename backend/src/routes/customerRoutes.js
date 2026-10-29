/**
 * Customer Routes
 * Week 3-4: Customer Management
 * Defines API endpoints for customer operations
 */

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const importController = require('../controllers/importController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { uploadCsv, handleUpload } = require('../middleware/uploadMiddleware');

// All customer routes require authentication
router.use(authenticateToken);

const canWrite = requireRole('OWNER', 'ACCOUNTANT');

/**
 * Bulk CSV import (place before /:id to avoid conflicts)
 */
// GET /api/customers/import/template - download CSV template
router.get('/import/template', importController.customerTemplate);
// POST /api/customers/import - bulk import from CSV (field 'file')
router.post('/import', canWrite, handleUpload(uploadCsv), importController.importCustomers);

/**
 * Customer CRUD operations
 */

// POST /api/customers - Create new customer
router.post('/', customerController.createCustomer);

// GET /api/customers - Get all customers (with pagination and filters)
router.get('/', customerController.getCustomers);

// GET /api/customers/stats - Get customer statistics
router.get('/stats', customerController.getCustomerStats);

// GET /api/customers/:id - Get customer by ID
router.get('/:id', customerController.getCustomerById);

// PUT /api/customers/:id - Update customer
router.put('/:id', customerController.updateCustomer);

// DELETE /api/customers/:id - Delete customer (soft delete)
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
