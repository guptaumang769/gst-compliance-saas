/**
 * Payment Service
 * Week 11-12: Razorpay Integration
 * 
 * Handles all payment operations:
 * - Create Razorpay orders
 * - Verify payment signatures
 * - Process payments
 * - Handle refunds
 * - Subscription activation
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getPlan, getPlanPrice } = require('../config/subscriptionPlans');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

/**
 * Generate unique receipt number
 * Format: RCP-YYYYMMDD-XXXXXX
 */
function generateReceiptNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(100000 + Math.random() * 900000);
  
  return `RCP-${year}${month}${day}-${random}`;
}

/**
 * Calculate GST on payment (18% GST on services)
 * @param {number} amount - Base amount
 * @returns {Object} - { baseAmount, gstAmount, totalAmount }
 */
function calculatePaymentGST(amount) {
  const gstRate = 0.18; // 18% GST on SaaS services
  const gstAmount = Math.round(amount * gstRate * 100) / 100;
  const totalAmount = amount + gstAmount;
  
  return {
    baseAmount: amount,
    gstAmount,
    totalAmount,
    gstRate: 18
  };
}

/**
 * Create Razorpay order for subscription payment
 * @param {string} businessId - Business ID
 * @param {string} planId - Plan ID (starter, professional, enterprise)
 * @param {string} billingCycle - 'monthly' or 'annual'
 * @returns {Promise<Object>} - Order details
 */
async function createSubscriptionOrder(businessId, planId, billingCycle = 'monthly') {
  // Validate plan
  const plan = getPlan(planId);
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  // Get business details
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { user: true }
  });

  if (!business) {
    throw new Error('Business not found');
  }

  // Calculate pricing
  const pricing = getPlanPrice(planId, billingCycle);
  const gstCalculation = calculatePaymentGST(pricing.price);

  // Convert to paise (Razorpay expects amount in smallest currency unit)
  const amountInPaise = Math.round(gstCalculation.totalAmount * 100);

  // Generate receipt number
  const receiptNumber = generateReceiptNumber();

  // Calculate subscription period
  const subscriptionStartDate = new Date();
  const subscriptionEndDate = new Date();
  
  if (billingCycle === 'annual') {
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
  } else {
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
  }

  // Create Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: receiptNumber,
    notes: {
      businessId,
      planId,
      billingCycle,
      businessName: business.businessName,
      gstin: business.gstin
    }
  });

  // Create payment record in database
  const payment = await prisma.payment.create({
    data: {
      businessId,
      paymentType: 'subscription',
      planId,
      billingCycle,
      amount: gstCalculation.baseAmount,
      currency: 'INR',
      gstAmount: gstCalculation.gstAmount,
      totalAmount: gstCalculation.totalAmount,
      razorpayOrderId: razorpayOrder.id,
      status: 'created',
      subscriptionStartDate,
      subscriptionEndDate,
      receiptNumber
    }
  });

  return {
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    receipt: receiptNumber,
    paymentId: payment.id,
    planDetails: {
      planId,
      planName: plan.displayName,
      billingCycle,
      baseAmount: gstCalculation.baseAmount,
      gstAmount: gstCalculation.gstAmount,
      totalAmount: gstCalculation.totalAmount,
      subscriptionStartDate,
      subscriptionEndDate
    }
  };
}

/**
 * Verify Razorpay payment signature
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} razorpaySignature - Signature from Razorpay
 * @returns {boolean} - True if signature is valid
 */
function verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
  const text = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex');
  
  return expectedSignature === razorpaySignature;
}

/**
 * Process successful payment and activate subscription
 * @param {Object} paymentData - Payment verification data
 * @returns {Promise<Object>} - Updated payment and subscription details
 */
async function processSuccessfulPayment(paymentData) {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  } = paymentData;

  // Verify signature
  const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  
  if (!isValid) {
    throw new Error('Invalid payment signature');
  }

  // Find payment record
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId },
    include: { business: true }
  });

  if (!payment) {
    throw new Error('Payment record not found');
  }

  if (payment.status === 'captured') {
    throw new Error('Payment already processed');
  }

  // Fetch payment details from Razorpay
  const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);

  // Update payment record
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      razorpayPaymentId,
      razorpaySignature,
      status: 'captured',
      paymentMethod: razorpayPayment.method,
      metadata: razorpayPayment
    }
  });

  // Activate subscription for the business
  await prisma.business.update({
    where: { id: payment.businessId },
    data: {
      subscriptionPlan: payment.planId,
      subscriptionStatus: 'active',
      subscriptionValidUntil: payment.subscriptionEndDate,
      invoiceLimit: getPlan(payment.planId).limits.invoicesPerMonth,
      invoiceCountCurrentMonth: 0 // Reset counter on new subscription
    }
  });

  return {
    success: true,
    paymentId: payment.id,
    razorpayPaymentId,
    status: 'captured',
    planId: payment.planId,
    subscriptionValidUntil: payment.subscriptionEndDate,
    message: 'Payment successful and subscription activated'
  };
}

/**
 * Handle failed payment
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} failureReason - Failure reason from Razorpay
 * @returns {Promise<Object>} - Updated payment record
 */
async function handleFailedPayment(razorpayOrderId, failureReason) {
  const payment = await prisma.payment.findUnique({
    where: { razorpayOrderId }
  });

  if (!payment) {
    throw new Error('Payment record not found');
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'failed',
      failureReason: failureReason || 'Payment failed'
    }
  });

  return {
    success: false,
    paymentId: payment.id,
    status: 'failed',
    message: failureReason || 'Payment failed'
  };
}

/**
 * Get payment details
 * @param {string} paymentId - Payment ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Payment details
 */
async function getPaymentDetails(paymentId, businessId) {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      businessId
    },
    include: {
      business: {
        select: {
          businessName: true,
          gstin: true,
          email: true
        }
      }
    }
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  return payment;
}

/**
 * Get all payments for a business
 * @param {string} businessId - Business ID
 * @param {Object} options - Query options (limit, offset, status)
 * @returns {Promise<Object>} - Payments list with pagination
 */
async function getBusinessPayments(businessId, options = {}) {
  const {
    limit = 20,
    offset = 0,
    status = null,
    paymentType = null
  } = options;

  const where = {
    businessId,
    ...(status && { status }),
    ...(paymentType && { paymentType })
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.payment.count({ where })
  ]);

  return {
    success: true,
    data: payments,
    pagination: {
      total,
      limit,
      offset,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Process refund for a payment
 * @param {string} paymentId - Payment ID
 * @param {string} businessId - Business ID
 * @param {number} refundAmount - Amount to refund (optional, full refund if not specified)
 * @param {string} reason - Refund reason
 * @returns {Promise<Object>} - Refund details
 */
async function processRefund(paymentId, businessId, refundAmount = null, reason = 'Requested by customer') {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      businessId,
      status: 'captured'
    }
  });

  if (!payment) {
    throw new Error('Payment not found or not eligible for refund');
  }

  if (payment.refundId) {
    throw new Error('Payment already refunded');
  }

  // Default to full refund
  const amountToRefund = refundAmount || parseFloat(payment.totalAmount);
  const amountInPaise = Math.round(amountToRefund * 100);

  // Create refund in Razorpay
  const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
    amount: amountInPaise,
    notes: {
      reason,
      refund_type: amountToRefund < parseFloat(payment.totalAmount) ? 'partial' : 'full'
    }
  });

  // Update payment record
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'refunded',
      refundId: refund.id,
      refundAmount: amountToRefund,
      refundedAt: new Date(),
      notes: reason
    }
  });

  // If subscription payment, deactivate subscription
  if (payment.paymentType === 'subscription') {
    await prisma.business.update({
      where: { id: payment.businessId },
      data: {
        subscriptionStatus: 'cancelled',
        subscriptionValidUntil: new Date() // Expire immediately
      }
    });
  }

  return {
    success: true,
    refundId: refund.id,
    refundAmount: amountToRefund,
    status: 'refunded',
    message: 'Refund processed successfully'
  };
}

/**
 * Verify webhook signature from Razorpay
 * @param {string} webhookBody - Raw webhook body
 * @param {string} webhookSignature - Signature from header
 * @returns {boolean} - True if signature is valid
 */
function verifyWebhookSignature(webhookBody, webhookSignature) {
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(webhookBody)
    .digest('hex');
  
  return expectedSignature === webhookSignature;
}

/**
 * Handle Razorpay webhook events
 * @param {Object} event - Webhook event data
 * @returns {Promise<Object>} - Processing result
 */
async function handleWebhookEvent(event) {
  const { event: eventType, payload } = event;

  switch (eventType) {
    case 'payment.authorized':
      // Payment authorized but not captured
      console.log('Payment authorized:', payload.payment.entity.id);
      break;

    case 'payment.captured':
      // Payment captured successfully
      await handlePaymentCaptured(payload.payment.entity);
      break;

    case 'payment.failed':
      // Payment failed
      await handlePaymentFailed(payload.payment.entity);
      break;

    case 'order.paid':
      // Order paid (alternative to payment.captured)
      console.log('Order paid:', payload.order.entity.id);
      break;

    case 'refund.processed':
      // Refund processed
      console.log('Refund processed:', payload.refund.entity.id);
      break;

    default:
      console.log('Unhandled webhook event:', eventType);
  }

  return { success: true, event: eventType };
}

/**
 * Handle payment captured webhook
 */
async function handlePaymentCaptured(paymentEntity) {
  const payment = await prisma.payment.findFirst({
    where: { razorpayOrderId: paymentEntity.order_id }
  });

  if (!payment || payment.status === 'captured') {
    return; // Already processed
  }

  await processSuccessfulPayment({
    razorpayOrderId: paymentEntity.order_id,
    razorpayPaymentId: paymentEntity.id,
    razorpaySignature: paymentEntity.signature // May not be present in webhook
  });
}

/**
 * Handle payment failed webhook
 */
async function handlePaymentFailed(paymentEntity) {
  await handleFailedPayment(
    paymentEntity.order_id,
    paymentEntity.error_description || 'Payment failed'
  );
}

module.exports = {
  createSubscriptionOrder,
  verifyPaymentSignature,
  processSuccessfulPayment,
  handleFailedPayment,
  getPaymentDetails,
  getBusinessPayments,
  processRefund,
  verifyWebhookSignature,
  handleWebhookEvent,
  calculatePaymentGST
};
