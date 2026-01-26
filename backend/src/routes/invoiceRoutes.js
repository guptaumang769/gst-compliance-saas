/**
 * Invoice Routes
 * Week 3-4: Invoice Management
 * Defines API endpoints for invoice operations
 */

const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All invoice routes require authentication
router.use(authenticateToken);

/**
 * Invoice CRUD operations
 */

// POST /api/invoices - Create new invoice
router.post('/', invoiceController.createInvoice);

// GET /api/invoices - Get all invoices (with pagination and filters)
router.get('/', invoiceController.getInvoices);

// GET /api/invoices/stats - Get invoice statistics
router.get('/stats', invoiceController.getInvoiceStats);

// GET /api/invoices/:id - Get invoice by ID
router.get('/:id', invoiceController.getInvoiceById);

// PUT /api/invoices/:id - Update invoice
router.put('/:id', invoiceController.updateInvoice);

// DELETE /api/invoices/:id - Delete invoice (soft delete)
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;
