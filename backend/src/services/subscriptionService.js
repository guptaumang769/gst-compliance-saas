/**
 * Subscription Service
 * Week 11-12: Subscription Management
 * 
 * Handles:
 * - Subscription status checks
 * - Usage limit enforcement
 * - Plan upgrades/downgrades
 * - Trial management
 * - Usage tracking
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const {
  getPlan,
  getAllPlans,
  checkLimit,
  hasFeature,
  getPlanPrice,
  getRecommendedPlan
} = require('../config/subscriptionPlans');

/**
 * Get current subscription status for a business
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Subscription details with usage stats
 */
async function getSubscriptionStatus(businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId }
  });

  if (!business) {
    throw new Error('Business not found');
  }

  const plan = getPlan(business.subscriptionPlan);
  const isExpired = business.subscriptionValidUntil && new Date(business.subscriptionValidUntil) < new Date();

  // Get current month's usage
  const currentMonth = new Date();
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const [invoiceCount, purchaseCount, customerCount, supplierCount] = await Promise.all([
    prisma.invoice.count({
      where: {
        businessId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        isActive: true
      }
    }),
    prisma.purchase.count({
      where: {
        businessId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        isActive: true
      }
    }),
    prisma.customer.count({
      where: { businessId, isActive: true }
    }),
    prisma.supplier.count({
      where: { businessId, isActive: true }
    })
  ]);

  // Check limits
  const invoiceLimit = checkLimit(business.subscriptionPlan, 'invoicesPerMonth', invoiceCount);
  const purchaseLimit = checkLimit(business.subscriptionPlan, 'purchasesPerMonth', purchaseCount);
  const customerLimit = checkLimit(business.subscriptionPlan, 'customersTotal', customerCount);
  const supplierLimit = checkLimit(business.subscriptionPlan, 'suppliersTotal', supplierCount);

  return {
    success: true,
    subscription: {
      planId: business.subscriptionPlan,
      planName: plan.displayName,
      status: business.subscriptionStatus,
      validUntil: business.subscriptionValidUntil,
      isExpired,
      isActive: business.subscriptionStatus === 'active' && !isExpired
    },
    usage: {
      invoices: {
        current: invoiceCount,
        limit: invoiceLimit.limit,
        remaining: invoiceLimit.remaining,
        unlimited: invoiceLimit.unlimited,
        exceeded: invoiceLimit.exceeded
      },
      purchases: {
        current: purchaseCount,
        limit: purchaseLimit.limit,
        remaining: purchaseLimit.remaining,
        unlimited: purchaseLimit.unlimited,
        exceeded: purchaseLimit.exceeded
      },
      customers: {
        current: customerCount,
        limit: customerLimit.limit,
        remaining: customerLimit.remaining,
        unlimited: customerLimit.unlimited,
        exceeded: customerLimit.exceeded
      },
      suppliers: {
        current: supplierCount,
        limit: supplierLimit.limit,
        remaining: supplierLimit.remaining,
        unlimited: supplierLimit.unlimited,
        exceeded: supplierLimit.exceeded
      }
    },
    features: plan.features
  };
}

/**
 * Check if a specific feature is available for a business
 * @param {string} businessId - Business ID
 * @param {string} feature - Feature name
 * @returns {Promise<boolean>} - True if feature is available
 */
async function checkFeatureAccess(businessId, feature) {
  const business = await prisma.business.findUnique({
    where: { id: businessId }
  });

  if (!business) {
    throw new Error('Business not found');
  }

  // Check if subscription is expired
  const isExpired = business.subscriptionValidUntil && new Date(business.subscriptionValidUntil) < new Date();
  if (isExpired && business.subscriptionStatus !== 'trial') {
    return false;
  }

  return hasFeature(business.subscriptionPlan, feature);
}

/**
 * Check if invoice creation limit is exceeded
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Limit check result
 */
async function checkInvoiceLimit(businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId }
  });

  if (!business) {
    throw new Error('Business not found');
  }

  // Check if subscription is active
  const isExpired = business.subscriptionValidUntil && new Date(business.subscriptionValidUntil) < new Date();
  if (isExpired && business.subscriptionStatus !== 'trial') {
    return {
      allowed: false,
      reason: 'subscription_expired',
      message: 'Your subscription has expired. Please renew to continue.'
    };
  }

  // Get current month's invoice count
  const currentMonth = new Date();
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const invoiceCount = await prisma.invoice.count({
    where: {
      businessId,
      createdAt: { gte: startOfMonth, lte: endOfMonth },
      isActive: true
    }
  });

  const limitCheck = checkLimit(business.subscriptionPlan, 'invoicesPerMonth', invoiceCount);

  if (limitCheck.exceeded) {
    return {
      allowed: false,
      reason: 'limit_exceeded',
      message: `Invoice limit reached for your ${business.subscriptionPlan} plan. Please upgrade to continue.`,
      limit: limitCheck.limit,
      current: limitCheck.currentCount
    };
  }

  return {
    allowed: true,
    limit: limitCheck.limit,
    current: invoiceCount,
    remaining: limitCheck.remaining
  };
}

/**
 * Increment invoice count for current month
 * @param {string} businessId - Business ID
 * @returns {Promise<void>}
 */
async function incrementInvoiceCount(businessId) {
  await prisma.business.update({
    where: { id: businessId },
    data: {
      invoiceCountCurrentMonth: {
        increment: 1
      }
    }
  });
}

/**
 * Reset monthly counters (should be run on 1st of every month)
 * @returns {Promise<number>} - Number of businesses reset
 */
async function resetMonthlyCounters() {
  const result = await prisma.business.updateMany({
    where: {
      isActive: true
    },
    data: {
      invoiceCountCurrentMonth: 0
    }
  });

  return result.count;
}

/**
 * Start trial subscription for a new business
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Trial details
 */
async function startTrialSubscription(businessId) {
  const trialPlan = getPlan('trial');
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + trialPlan.trialDays);

  await prisma.business.update({
    where: { id: businessId },
    data: {
      subscriptionPlan: 'trial',
      subscriptionStatus: 'trial',
      subscriptionValidUntil: trialEndDate,
      invoiceLimit: trialPlan.limits.invoicesPerMonth,
      invoiceCountCurrentMonth: 0
    }
  });

  return {
    success: true,
    planId: 'trial',
    status: 'trial',
    validUntil: trialEndDate,
    trialDays: trialPlan.trialDays,
    message: `Trial started successfully. Valid for ${trialPlan.trialDays} days.`
  };
}

/**
 * Upgrade/Change subscription plan
 * @param {string} businessId - Business ID
 * @param {string} newPlanId - New plan ID
 * @param {Date} validUntil - Subscription valid until date
 * @returns {Promise<Object>} - Updated subscription details
 */
async function changePlan(businessId, newPlanId, validUntil) {
  const newPlan = getPlan(newPlanId);

  await prisma.business.update({
    where: { id: businessId },
    data: {
      subscriptionPlan: newPlanId,
      subscriptionStatus: 'active',
      subscriptionValidUntil: validUntil,
      invoiceLimit: newPlan.limits.invoicesPerMonth,
      invoiceCountCurrentMonth: 0 // Reset counter on plan change
    }
  });

  return {
    success: true,
    planId: newPlanId,
    planName: newPlan.displayName,
    validUntil,
    message: `Subscription changed to ${newPlan.displayName} successfully`
  };
}

/**
 * Cancel subscription
 * @param {string} businessId - Business ID
 * @param {boolean} immediate - Cancel immediately or at period end
 * @returns {Promise<Object>} - Cancellation details
 */
async function cancelSubscription(businessId, immediate = false) {
  const business = await prisma.business.findUnique({
    where: { id: businessId }
  });

  if (!business) {
    throw new Error('Business not found');
  }

  if (immediate) {
    await prisma.business.update({
      where: { id: businessId },
      data: {
        subscriptionStatus: 'cancelled',
        subscriptionValidUntil: new Date() // Expire immediately
      }
    });

    return {
      success: true,
      status: 'cancelled',
      message: 'Subscription cancelled immediately'
    };
  } else {
    await prisma.business.update({
      where: { id: businessId },
      data: {
        subscriptionStatus: 'cancelled'
      }
    });

    return {
      success: true,
      status: 'cancelled',
      validUntil: business.subscriptionValidUntil,
      message: `Subscription will be cancelled on ${business.subscriptionValidUntil}`
    };
  }
}

/**
 * Get subscription plans for display
 * @returns {Array} - All available plans with pricing
 */
async function getAvailablePlans() {
  const plans = getAllPlans();

  return {
    success: true,
    plans: plans.map(plan => ({
      id: plan.id,
      name: plan.displayName,
      description: plan.description,
      price: plan.price,
      annualPrice: plan.annualPrice,
      billingCycle: plan.billingCycle,
      recommended: plan.recommended,
      features: plan.features,
      limits: plan.limits,
      savings: plan.savings
    }))
  };
}

/**
 * Get plan recommendation for a business based on usage
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Recommended plan
 */
async function getPlanRecommendation(businessId) {
  const currentMonth = new Date();
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const [invoiceCount, purchaseCount, customerCount, supplierCount] = await Promise.all([
    prisma.invoice.count({
      where: {
        businessId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        isActive: true
      }
    }),
    prisma.purchase.count({
      where: {
        businessId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        isActive: true
      }
    }),
    prisma.customer.count({
      where: { businessId, isActive: true }
    }),
    prisma.supplier.count({
      where: { businessId, isActive: true }
    })
  ]);

  const recommendedPlanId = getRecommendedPlan({
    invoicesPerMonth: invoiceCount,
    purchasesPerMonth: purchaseCount,
    totalCustomers: customerCount,
    totalSuppliers: supplierCount
  });

  const recommendedPlan = getPlan(recommendedPlanId);

  return {
    success: true,
    recommended: {
      planId: recommendedPlanId,
      planName: recommendedPlan.displayName,
      price: recommendedPlan.price,
      reason: 'Based on your current usage patterns'
    },
    currentUsage: {
      invoicesPerMonth: invoiceCount,
      purchasesPerMonth: purchaseCount,
      totalCustomers: customerCount,
      totalSuppliers: supplierCount
    }
  };
}

/**
 * Check and expire subscriptions (should be run daily)
 * @returns {Promise<number>} - Number of subscriptions expired
 */
async function expireSubscriptions() {
  const now = new Date();

  const result = await prisma.business.updateMany({
    where: {
      subscriptionStatus: 'active',
      subscriptionValidUntil: {
        lt: now
      }
    },
    data: {
      subscriptionStatus: 'expired'
    }
  });

  return result.count;
}

module.exports = {
  getSubscriptionStatus,
  checkFeatureAccess,
  checkInvoiceLimit,
  incrementInvoiceCount,
  resetMonthlyCounters,
  startTrialSubscription,
  changePlan,
  cancelSubscription,
  getAvailablePlans,
  getPlanRecommendation,
  expireSubscriptions
};
