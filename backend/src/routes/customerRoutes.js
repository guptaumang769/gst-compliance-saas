/**
 * Customer Routes
 * Week 3-4: Customer Management
 * Defines API endpoints for customer operations
 */

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All customer routes require authentication
router.use(authenticateToken);

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
