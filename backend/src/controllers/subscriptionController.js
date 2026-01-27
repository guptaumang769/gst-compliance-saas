/**
 * Subscription Controller
 * Week 11-12: Subscription HTTP Handlers
 * 
 * Handles API requests for:
 * - Getting subscription status
 * - Viewing available plans
 * - Plan recommendations
 * - Cancelling subscriptions
 */

const subscriptionService = require('../services/subscriptionService');
const { getAllPlans, getPlanComparison } = require('../config/subscriptionPlans');

/**
 * GET /api/subscriptions/status
 * Get current subscription status and usage
 */
async function getSubscriptionStatus(req, res) {
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

    // Get subscription status
    const status = await subscriptionService.getSubscriptionStatus(business.id);

    return res.status(200).json(status);
    
  } catch (error) {
    console.error('Get subscription status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription status'
    });
  }
}

/**
 * GET /api/subscriptions/plans
 * Get all available subscription plans
 */
async function getAvailablePlans(req, res) {
  try {
    const result = await subscriptionService.getAvailablePlans();

    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Get available plans error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch plans'
    });
  }
}

/**
 * GET /api/subscriptions/plans/comparison
 * Get plan comparison data (for UI)
 */
async function getPlanComparisonData(req, res) {
  try {
    const comparison = getPlanComparison();

    return res.status(200).json({
      success: true,
      data: comparison
    });
    
  } catch (error) {
    console.error('Get plan comparison error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch plan comparison'
    });
  }
}

/**
 * GET /api/subscriptions/recommendation
 * Get recommended plan based on current usage
 */
async function getPlanRecommendation(req, res) {
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

    // Get recommendation
    const result = await subscriptionService.getPlanRecommendation(business.id);

    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Get plan recommendation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get plan recommendation'
    });
  }
}

/**
 * POST /api/subscriptions/start-trial
 * Start trial subscription for a new user
 */
async function startTrial(req, res) {
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

    // Check if already on trial or paid plan
    if (business.subscriptionStatus !== 'inactive') {
      return res.status(400).json({
        success: false,
        error: 'Trial already started or subscription is active'
      });
    }

    // Start trial
    const result = await subscriptionService.startTrialSubscription(business.id);

    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Start trial error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to start trial'
    });
  }
}

/**
 * POST /api/subscriptions/cancel
 * Cancel subscription
 */
async function cancelSubscription(req, res) {
  try {
    const userId = req.user.userId;
    const { immediate = false, reason } = req.body;

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

    // Cancel subscription
    const result = await subscriptionService.cancelSubscription(business.id, immediate);

    // Log cancellation reason (for analytics)
    if (reason) {
      console.log(`Subscription cancelled for business ${business.id}: ${reason}`);
    }

    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to cancel subscription'
    });
  }
}

/**
 * GET /api/subscriptions/check-feature/:feature
 * Check if a specific feature is available
 */
async function checkFeatureAccess(req, res) {
  try {
    const userId = req.user.userId;
    const feature = req.params.feature;

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
    const hasAccess = await subscriptionService.checkFeatureAccess(business.id, feature);

    return res.status(200).json({
      success: true,
      feature,
      hasAccess,
      message: hasAccess ? 'Feature is available' : 'Feature not available in your plan'
    });
    
  } catch (error) {
    console.error('Check feature access error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check feature access'
    });
  }
}

/**
 * GET /api/subscriptions/check-limit/invoices
 * Check invoice creation limit
 */
async function checkInvoiceLimit(req, res) {
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

    // Check limit
    const result = await subscriptionService.checkInvoiceLimit(business.id);

    return res.status(200).json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Check invoice limit error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check invoice limit'
    });
  }
}

module.exports = {
  getSubscriptionStatus,
  getAvailablePlans,
  getPlanComparisonData,
  getPlanRecommendation,
  startTrial,
  cancelSubscription,
  checkFeatureAccess,
  checkInvoiceLimit
};
