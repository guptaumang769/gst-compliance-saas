/**
 * Subscription Plans Configuration
 * Week 11-12: Subscription & Payments
 * 
 * Defines pricing, features, and limits for each plan
 */

const SUBSCRIPTION_PLANS = {
  // Free Trial (14 days)
  trial: {
    id: 'trial',
    name: 'Free Trial',
    displayName: 'Free Trial',
    price: 0,
    currency: 'INR',
    billingCycle: 'trial',
    trialDays: 14,
    features: {
      invoiceLimit: 10,
      purchaseLimit: 10,
      customerLimit: 10,
      supplierLimit: 10,
      gstrFiling: true,
      pdfGeneration: true,
      emailSupport: true,
      bulkOperations: false,
      multiUser: false,
      apiAccess: false,
      whatsappIntegration: false,
      dedicatedSupport: false
    },
    limits: {
      invoicesPerMonth: 10,
      purchasesPerMonth: 10,
      customersTotal: 10,
      suppliersTotal: 10,
      emailsPerMonth: 20,
      pdfGenerationsPerMonth: 20
    },
    description: 'Perfect for testing the platform',
    recommended: false
  },

  // Starter Plan (Small businesses)
  starter: {
    id: 'starter',
    name: 'Starter',
    displayName: 'Starter Plan',
    price: 999,
    currency: 'INR',
    billingCycle: 'monthly',
    annualPrice: 9990, // 2 months free (999 × 10)
    features: {
      invoiceLimit: 100,
      purchaseLimit: 100,
      customerLimit: 50,
      supplierLimit: 50,
      gstrFiling: true,
      pdfGeneration: true,
      emailSupport: true,
      bulkOperations: false,
      multiUser: false,
      apiAccess: false,
      whatsappIntegration: false,
      dedicatedSupport: false
    },
    limits: {
      invoicesPerMonth: 100,
      purchasesPerMonth: 100,
      customersTotal: 50,
      suppliersTotal: 50,
      emailsPerMonth: 200,
      pdfGenerationsPerMonth: 200
    },
    description: 'For small businesses and freelancers',
    recommended: true,
    savings: {
      annual: 1998 // 2 months free
    }
  },

  // Professional Plan (Growing businesses)
  professional: {
    id: 'professional',
    name: 'Professional',
    displayName: 'Professional Plan',
    price: 2999,
    currency: 'INR',
    billingCycle: 'monthly',
    annualPrice: 29990, // 3 months free (2999 × 10)
    features: {
      invoiceLimit: 500,
      purchaseLimit: 500,
      customerLimit: 200,
      supplierLimit: 200,
      gstrFiling: true,
      pdfGeneration: true,
      emailSupport: true,
      bulkOperations: true,
      multiUser: true,
      maxUsers: 3,
      apiAccess: false,
      whatsappIntegration: true,
      dedicatedSupport: false
    },
    limits: {
      invoicesPerMonth: 500,
      purchasesPerMonth: 500,
      customersTotal: 200,
      suppliersTotal: 200,
      emailsPerMonth: 1000,
      pdfGenerationsPerMonth: 1000,
      maxUsers: 3
    },
    description: 'For growing businesses with multiple transactions',
    recommended: false,
    savings: {
      annual: 5997 // ~2 months free
    }
  },

  // Enterprise Plan (Large businesses)
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    displayName: 'Enterprise Plan',
    price: 7999,
    currency: 'INR',
    billingCycle: 'monthly',
    annualPrice: 79990, // 4 months free (7999 × 10)
    features: {
      invoiceLimit: -1, // Unlimited
      purchaseLimit: -1, // Unlimited
      customerLimit: -1, // Unlimited
      supplierLimit: -1, // Unlimited
      gstrFiling: true,
      pdfGeneration: true,
      emailSupport: true,
      bulkOperations: true,
      multiUser: true,
      maxUsers: 10,
      apiAccess: true,
      whatsappIntegration: true,
      dedicatedSupport: true,
      customReports: true,
      prioritySupport: true
    },
    limits: {
      invoicesPerMonth: -1, // Unlimited
      purchasesPerMonth: -1, // Unlimited
      customersTotal: -1, // Unlimited
      suppliersTotal: -1, // Unlimited
      emailsPerMonth: -1, // Unlimited
      pdfGenerationsPerMonth: -1, // Unlimited
      maxUsers: 10
    },
    description: 'For large businesses with unlimited needs',
    recommended: false,
    savings: {
      annual: 15996 // ~2 months free
    }
  }
};

/**
 * Get plan details by ID
 * @param {string} planId - Plan ID (trial, starter, professional, enterprise)
 * @returns {Object} - Plan configuration
 */
function getPlan(planId) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  return plan;
}

/**
 * Get all available plans
 * @returns {Array} - Array of all plans
 */
function getAllPlans() {
  return Object.values(SUBSCRIPTION_PLANS);
}

/**
 * Check if a plan allows a specific feature
 * @param {string} planId - Plan ID
 * @param {string} feature - Feature name
 * @returns {boolean} - True if feature is allowed
 */
function hasFeature(planId, feature) {
  const plan = getPlan(planId);
  return plan.features[feature] === true || plan.features[feature] === -1;
}

/**
 * Check if a limit is exceeded
 * @param {string} planId - Plan ID
 * @param {string} limitType - Limit type (invoicesPerMonth, etc.)
 * @param {number} currentCount - Current usage count
 * @returns {Object} - { exceeded: boolean, limit: number, remaining: number }
 */
function checkLimit(planId, limitType, currentCount) {
  const plan = getPlan(planId);
  const limit = plan.limits[limitType];

  // -1 means unlimited
  if (limit === -1) {
    return {
      exceeded: false,
      limit: -1,
      remaining: -1,
      unlimited: true
    };
  }

  const remaining = Math.max(0, limit - currentCount);
  const exceeded = currentCount >= limit;

  return {
    exceeded,
    limit,
    remaining,
    unlimited: false,
    currentCount
  };
}

/**
 * Get plan comparison data (for UI)
 * @returns {Array} - Formatted plan comparison
 */
function getPlanComparison() {
  return Object.values(SUBSCRIPTION_PLANS).map(plan => ({
    id: plan.id,
    name: plan.displayName,
    price: plan.price,
    annualPrice: plan.annualPrice,
    billingCycle: plan.billingCycle,
    recommended: plan.recommended,
    description: plan.description,
    features: [
      {
        name: 'Invoices per month',
        value: plan.limits.invoicesPerMonth === -1 ? 'Unlimited' : plan.limits.invoicesPerMonth
      },
      {
        name: 'Purchases per month',
        value: plan.limits.purchasesPerMonth === -1 ? 'Unlimited' : plan.limits.purchasesPerMonth
      },
      {
        name: 'Customers',
        value: plan.limits.customersTotal === -1 ? 'Unlimited' : plan.limits.customersTotal
      },
      {
        name: 'Suppliers',
        value: plan.limits.suppliersTotal === -1 ? 'Unlimited' : plan.limits.suppliersTotal
      },
      {
        name: 'GSTR Filing',
        value: plan.features.gstrFiling ? 'Yes' : 'No'
      },
      {
        name: 'PDF Generation',
        value: plan.features.pdfGeneration ? 'Yes' : 'No'
      },
      {
        name: 'Email Support',
        value: plan.features.emailSupport ? 'Yes' : 'No'
      },
      {
        name: 'Bulk Operations',
        value: plan.features.bulkOperations ? 'Yes' : 'No'
      },
      {
        name: 'Multi-User',
        value: plan.features.multiUser ? `Yes (${plan.features.maxUsers || 1} users)` : 'No'
      },
      {
        name: 'API Access',
        value: plan.features.apiAccess ? 'Yes' : 'No'
      },
      {
        name: 'WhatsApp Integration',
        value: plan.features.whatsappIntegration ? 'Yes' : 'No'
      },
      {
        name: 'Dedicated Support',
        value: plan.features.dedicatedSupport ? 'Yes' : 'No'
      }
    ],
    savings: plan.savings
  }));
}

/**
 * Calculate plan price based on billing cycle
 * @param {string} planId - Plan ID
 * @param {string} billingCycle - 'monthly' or 'annual'
 * @returns {Object} - { price, currency, savings }
 */
function getPlanPrice(planId, billingCycle = 'monthly') {
  const plan = getPlan(planId);

  if (billingCycle === 'annual' && plan.annualPrice) {
    const monthlyCost = plan.price * 12;
    const savings = monthlyCost - plan.annualPrice;

    return {
      price: plan.annualPrice,
      currency: plan.currency,
      billingCycle: 'annual',
      monthlyEquivalent: Math.round(plan.annualPrice / 12),
      savings,
      savingsPercent: Math.round((savings / monthlyCost) * 100)
    };
  }

  return {
    price: plan.price,
    currency: plan.currency,
    billingCycle: 'monthly',
    monthlyEquivalent: plan.price,
    savings: 0,
    savingsPercent: 0
  };
}

/**
 * Get recommended plan for a business
 * @param {Object} usage - Current usage stats
 * @returns {string} - Recommended plan ID
 */
function getRecommendedPlan(usage = {}) {
  const {
    invoicesPerMonth = 0,
    purchasesPerMonth = 0,
    totalCustomers = 0,
    totalSuppliers = 0,
    needsMultiUser = false,
    needsAPI = false
  } = usage;

  // Enterprise: Needs API or high volume
  if (needsAPI || invoicesPerMonth > 500 || purchasesPerMonth > 500) {
    return 'enterprise';
  }

  // Professional: Needs multi-user or moderate volume
  if (needsMultiUser || invoicesPerMonth > 100 || purchasesPerMonth > 100) {
    return 'professional';
  }

  // Starter: Low volume
  if (invoicesPerMonth > 10 || purchasesPerMonth > 10) {
    return 'starter';
  }

  // Trial: Just starting
  return 'trial';
}

module.exports = {
  SUBSCRIPTION_PLANS,
  getPlan,
  getAllPlans,
  hasFeature,
  checkLimit,
  getPlanComparison,
  getPlanPrice,
  getRecommendedPlan
};
