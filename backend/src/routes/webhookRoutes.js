/**
 * Webhook Routes
 * Week 11-12: Razorpay Webhook Handler
 * 
 * Handles webhook events from Razorpay for:
 * - Payment captured
 * - Payment failed
 * - Refund processed
 */

const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');

/**
 * POST /api/webhooks/razorpay
 * Handle Razorpay webhook events
 * 
 * NOTE: This endpoint should NOT use authentication middleware
 * as it's called by Razorpay servers
 */
router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Get signature from header
    const webhookSignature = req.headers['x-razorpay-signature'];

    if (!webhookSignature) {
      return res.status(400).json({
        success: false,
        error: 'Webhook signature missing'
      });
    }

    // Get raw body
    const webhookBody = req.body.toString();

    // Verify signature
    const isValid = paymentService.verifyWebhookSignature(webhookBody, webhookSignature);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    // Parse webhook event
    const event = JSON.parse(webhookBody);

    console.log('Webhook event received:', event.event);

    // Handle webhook event
    await paymentService.handleWebhookEvent(event);

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Always return 200 to Razorpay to avoid retries
    // Log the error for investigation
    return res.status(200).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

/**
 * GET /api/webhooks/test
 * Test endpoint to verify webhook is accessible
 */
router.get('/test', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
