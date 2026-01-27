/**
 * Subscription Middleware
 * Week 11-12: Subscription Limit Enforcement
 * 
 * Middleware to check:
 * - Subscription status
 * - Usage limits
 * - Feature access
 */

const subscriptionService = require('../services/subscriptionService');

/**
 * Check if subscription is active
 * Use this middleware on routes that require active subscription
 */
async function checkSubscriptionActive(req, res, next) {
  try {
    const userId = req.user.userId;

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

    // Check if subscription is expired
    const isExpired = business.subscriptionValidUntil && 
                      new Date(business.subscriptionValidUntil) < new Date();

    if (isExpired && business.subscriptionStatus !== 'trial') {
      return res.status(403).json({
        success: false,
        error: 'Subscription expired',
        message: 'Your subscription has expired. Please renew to continue using the service.',
        code: 'SUBSCRIPTION_EXPIRED',
        action: 'renew_subscription'
      });
    }

    // Attach business to request for later use
    req.business = business;
    next();
    
  } catch (error) {
    console.error('Subscription check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify subscription'
    });
  }
}

/**
 * Check invoice creation limit
 * Use this middleware on invoice creation route
 */
async function checkInvoiceLimit(req, res, next) {
  try {
    const userId = req.user.userId;

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

    // Check invoice limit
    const limitCheck = await subscriptionService.checkInvoiceLimit(business.id);

    if (!limitCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: limitCheck.message,
        code: limitCheck.reason.toUpperCase(),
        limit: limitCheck.limit,
        current: limitCheck.current,
        action: limitCheck.reason === 'subscription_expired' ? 'renew_subscription' : 'upgrade_plan'
      });
    }

    // Attach business to request
    req.business = business;
    next();
    
  } catch (error) {
    console.error('Invoice limit check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check invoice limit'
    });
  }
}

/**
 * Check feature access
 * Use this to restrict features based on subscription plan
 * @param {string} featureName - Feature to check
 */
function checkFeatureAccess(featureName) {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;

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

      // Check feature access
      const hasAccess = await subscriptionService.checkFeatureAccess(business.id, featureName);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: `Feature not available: ${featureName}`,
          message: `This feature is not available in your current plan. Please upgrade to access it.`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature: featureName,
          action: 'upgrade_plan'
        });
      }

      // Attach business to request
      req.business = business;
      next();
      
    } catch (error) {
      console.error('Feature access check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check feature access'
      });
    }
  };
}

/**
 * Soft limit check (warning but allow)
 * Use this to warn users when approaching limits
 */
async function warnOnLimitApproaching(req, res, next) {
  try {
    const userId = req.user.userId;

    // Get user's business
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });

    if (!business) {
      // Continue without warning if business not found
      return next();
    }

    // Check invoice limit
    const limitCheck = await subscriptionService.checkInvoiceLimit(business.id);

    // Add warning header if approaching limit (>80%)
    if (limitCheck.limit > 0 && limitCheck.remaining > 0) {
      const usagePercent = (limitCheck.current / limitCheck.limit) * 100;
      
      if (usagePercent >= 80) {
        res.setHeader('X-Limit-Warning', 'Approaching invoice limit');
        res.setHeader('X-Limit-Remaining', limitCheck.remaining.toString());
        res.setHeader('X-Limit-Total', limitCheck.limit.toString());
      }
    }

    next();
    
  } catch (error) {
    // Don't block request on warning errors
    console.error('Limit warning error:', error);
    next();
  }
}

module.exports = {
  checkSubscriptionActive,
  checkInvoiceLimit,
  checkFeatureAccess,
  warnOnLimitApproaching
};
