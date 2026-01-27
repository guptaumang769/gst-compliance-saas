/**
 * Payment Controller
 * Week 11-12: Payment HTTP Handlers
 * 
 * Handles API requests for:
 * - Creating payment orders
 * - Verifying payments
 * - Getting payment history
 * - Processing refunds
 */

const paymentService = require('../services/paymentService');
const subscriptionService = require('../services/subscriptionService');

/**
 * POST /api/payments/create-order
 * Create Razorpay order for subscription payment
 */
async function createPaymentOrder(req, res) {
  try {
    const userId = req.user.userId;
    const { planId, billingCycle = 'monthly' } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }

    // Get user's business
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No active business found'
      });
    }

    // Create order
    const orderDetails = await paymentService.createSubscriptionOrder(
      business.id,
      planId,
      billingCycle
    );

    return res.status(200).json({
      success: true,
      message: 'Order created successfully',
      data: orderDetails,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID // For frontend
    });
    
  } catch (error) {
    console.error('Create payment order error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to create payment order'
    });
  }
}

/**
 * POST /api/payments/verify
 * Verify payment after successful Razorpay payment
 */
async function verifyPayment(req, res) {
  try {
    const userId = req.user.userId;
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment details'
      });
    }

    // Process payment
    const result = await paymentService.processSuccessfulPayment({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Payment verification failed'
    });
  }
}

/**
 * GET /api/payments/history
 * Get payment history for the business
 */
async function getPaymentHistory(req, res) {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0, status, paymentType } = req.query;

    // Get user's business
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No active business found'
      });
    }

    // Get payments
    const result = await paymentService.getBusinessPayments(business.id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      status,
      paymentType
    });

    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Get payment history error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history'
    });
  }
}

/**
 * GET /api/payments/:id
 * Get payment details by ID
 */
async function getPaymentById(req, res) {
  try {
    const userId = req.user.userId;
    const paymentId = req.params.id;

    // Get user's business
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No active business found'
      });
    }

    // Get payment
    const payment = await paymentService.getPaymentDetails(paymentId, business.id);

    return res.status(200).json({
      success: true,
      data: payment
    });
    
  } catch (error) {
    console.error('Get payment error:', error);
    return res.status(404).json({
      success: false,
      error: error.message || 'Payment not found'
    });
  }
}

/**
 * POST /api/payments/:id/refund
 * Process refund for a payment
 */
async function processRefund(req, res) {
  try {
    const userId = req.user.userId;
    const paymentId = req.params.id;
    const { amount, reason } = req.body;

    // Get user's business
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No active business found'
      });
    }

    // Process refund
    const result = await paymentService.processRefund(
      paymentId,
      business.id,
      amount,
      reason
    );

    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Process refund error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to process refund'
    });
  }
}

/**
 * GET /api/payments/gst-calculation
 * Calculate GST on payment amount (for preview)
 */
async function calculateGST(req, res) {
  try {
    const { amount } = req.query;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    const gstCalculation = paymentService.calculatePaymentGST(parseFloat(amount));

    return res.status(200).json({
      success: true,
      data: gstCalculation
    });
    
  } catch (error) {
    console.error('Calculate GST error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate GST'
    });
  }
}

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
  getPaymentById,
  processRefund,
  calculateGST
};
