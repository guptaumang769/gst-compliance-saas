/**
 * Purchase Controller
 * Handles HTTP requests for purchase invoice management
 */

const purchaseService = require('../services/purchaseService');

/**
 * Create a new purchase invoice
 * POST /api/purchases
 */
async function createPurchase(req, res) {
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
        message: 'No active business found'
      });
    }

    const purchaseData = {
      businessId: business.id,
      ...req.body
    };

    const purchase = await purchaseService.createPurchase(purchaseData);

    res.status(201).json({
      success: true,
      message: 'Purchase invoice created successfully',
      data: purchase
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create purchase invoice'
    });
  }
}

/**
 * Get all purchases for the authenticated business
 * GET /api/purchases
 */
async function getPurchases(req, res) {
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
        message: 'No active business found'
      });
    }

    const businessId = business.id;
    const filters = {
      supplierId: req.query.supplierId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      purchaseType: req.query.purchaseType,
      isItcEligible: req.query.isItcEligible,
      search: req.query.search,
      status: req.query.status,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await purchaseService.getPurchases(businessId, filters);

    res.status(200).json({
      success: true,
      message: 'Purchases retrieved successfully',
      purchases: result.purchases,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to retrieve purchases'
    });
  }
}

/**
 * Get a single purchase by ID
 * GET /api/purchases/:id
 */
async function getPurchaseById(req, res) {
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
        message: 'No active business found'
      });
    }

    const businessId = business.id;
    const purchaseId = req.params.id;

    const purchase = await purchaseService.getPurchaseById(purchaseId, businessId);

    res.status(200).json({
      success: true,
      message: 'Purchase retrieved successfully',
      data: purchase
    });
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Purchase not found'
    });
  }
}

/**
 * Update a purchase invoice
 * PUT /api/purchases/:id
 */
async function updatePurchase(req, res) {
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
        message: 'No active business found'
      });
    }

    const businessId = business.id;
    const purchaseId = req.params.id;
    const updateData = req.body;

    const purchase = await purchaseService.updatePurchase(purchaseId, businessId, updateData);

    res.status(200).json({
      success: true,
      message: 'Purchase updated successfully',
      data: purchase
    });
  } catch (error) {
    console.error('Update purchase error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update purchase'
    });
  }
}

/**
 * Delete a purchase invoice
 * DELETE /api/purchases/:id
 */
async function deletePurchase(req, res) {
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
        message: 'No active business found'
      });
    }

    const businessId = business.id;
    const purchaseId = req.params.id;

    await purchaseService.deletePurchase(purchaseId, businessId);

    res.status(200).json({
      success: true,
      message: 'Purchase deleted successfully'
    });
  } catch (error) {
    console.error('Delete purchase error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete purchase'
    });
  }
}

/**
 * Get purchase statistics
 * GET /api/purchases/stats
 */
async function getPurchaseStats(req, res) {
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
        message: 'No active business found'
      });
    }

    const businessId = business.id;
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      month: parseInt(req.query.month),
      year: parseInt(req.query.year)
    };

    const stats = await purchaseService.getPurchaseStats(businessId, filters);

    res.status(200).json({
      success: true,
      message: 'Purchase statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Get purchase stats error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to retrieve purchase statistics'
    });
  }
}

/**
 * Calculate ITC for a specific period (month/year)
 * GET /api/purchases/itc/:year/:month
 */
async function calculateItcForPeriod(req, res) {
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
        message: 'No active business found'
      });
    }

    const businessId = business.id;
    const { year, month } = req.params;

    const itcData = await purchaseService.calculateItcForPeriod(
      businessId,
      parseInt(month),
      parseInt(year)
    );

    res.status(200).json({
      success: true,
      message: 'ITC calculated successfully',
      data: itcData
    });
  } catch (error) {
    console.error('Calculate ITC error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to calculate ITC'
    });
  }
}

/**
 * Mark a purchase as paid
 * PATCH /api/purchases/:id/mark-paid
 */
async function markPurchaseAsPaid(req, res) {
  try {
    const userId = req.user.userId;
    
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });
    
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'No active business found'
      });
    }

    const businessId = business.id;
    const purchaseId = req.params.id;
    const { isPaid, paymentMethod } = req.body;

    // Verify purchase belongs to business
    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, businessId, isActive: true }
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    const updatedPurchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        isPaid: isPaid !== undefined ? isPaid : true,
        paymentDate: isPaid !== false ? new Date() : null,
        paymentMethod: paymentMethod || 'bank_transfer'
      },
      include: {
        items: true,
        supplier: true
      }
    });

    res.status(200).json({
      success: true,
      message: isPaid !== false ? 'Purchase marked as paid' : 'Purchase marked as unpaid',
      data: updatedPurchase
    });
  } catch (error) {
    console.error('Mark purchase as paid error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update payment status'
    });
  }
}

module.exports = {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  getPurchaseStats,
  calculateItcForPeriod,
  markPurchaseAsPaid
};
