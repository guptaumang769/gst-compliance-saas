/**
 * Payment Routes
 * Week 11-12: Payment API Endpoints
 * 
 * Defines routes for payment operations
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All payment routes require authentication
router.use(authenticateToken);

/**
 * Payment Operations
 */

// POST /api/payments/create-order - Create Razorpay order
router.post('/create-order', paymentController.createPaymentOrder);

// POST /api/payments/verify - Verify payment after Razorpay payment
router.post('/verify', paymentController.verifyPayment);

// GET /api/payments/history - Get payment history
router.get('/history', paymentController.getPaymentHistory);

// GET /api/payments/gst-calculation - Calculate GST on amount
router.get('/gst-calculation', paymentController.calculateGST);

// GET /api/payments/:id - Get payment details by ID
router.get('/:id', paymentController.getPaymentById);

// POST /api/payments/:id/refund - Process refund
router.post('/:id/refund', paymentController.processRefund);

module.exports = router;
