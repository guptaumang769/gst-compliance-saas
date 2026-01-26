/**
 * Invoice Controller
 * Week 3-4: Invoice Management
 * Handles HTTP requests for invoice operations
 */

const invoiceService = require('../services/invoiceService');

/**
 * POST /api/invoices
 * Create a new invoice
 */
async function createInvoice(req, res) {
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
    
    // Check subscription limits
    if (business.invoiceCountCurrentMonth >= business.invoiceLimit) {
      return res.status(403).json({
        success: false,
        error: `Invoice limit reached for ${business.subscriptionPlan} plan. Please upgrade your subscription.`,
        limit: business.invoiceLimit,
        currentCount: business.invoiceCountCurrentMonth
      });
    }
    
    // Create invoice
    const result = await invoiceService.createInvoice(business.id, req.body);
    
    return res.status(201).json(result);
    
  } catch (error) {
    console.error('Create invoice error:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('required') ||
        error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to create invoice'
    });
  }
}

/**
 * GET /api/invoices
 * Get all invoices
 */
async function getInvoices(req, res) {
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
    
    // Parse query params
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      search: req.query.search,
      invoiceType: req.query.invoiceType,
      customerId: req.query.customerId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      filedInGstr1: req.query.filedInGstr1
    };
    
    const result = await invoiceService.getInvoices(business.id, options);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Get invoices error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices'
    });
  }
}

/**
 * GET /api/invoices/:id
 * Get invoice by ID
 */
async function getInvoiceById(req, res) {
  try {
    const userId = req.user.userId;
    const invoiceId = req.params.id;
    
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
    
    const result = await invoiceService.getInvoiceById(invoiceId, business.id);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Get invoice error:', error);
    
    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice'
    });
  }
}

/**
 * PUT /api/invoices/:id
 * Update invoice
 */
async function updateInvoice(req, res) {
  try {
    const userId = req.user.userId;
    const invoiceId = req.params.id;
    
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
    
    const result = await invoiceService.updateInvoice(invoiceId, business.id, req.body);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Update invoice error:', error);
    
    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Cannot update')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to update invoice'
    });
  }
}

/**
 * DELETE /api/invoices/:id
 * Delete invoice
 */
async function deleteInvoice(req, res) {
  try {
    const userId = req.user.userId;
    const invoiceId = req.params.id;
    
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
    
    const result = await invoiceService.deleteInvoice(invoiceId, business.id);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Delete invoice error:', error);
    
    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to delete invoice'
    });
  }
}

/**
 * GET /api/invoices/stats
 * Get invoice statistics
 */
async function getInvoiceStats(req, res) {
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
    
    const options = {
      month: parseInt(req.query.month),
      year: parseInt(req.query.year)
    };
    
    const result = await invoiceService.getInvoiceStats(business.id, options);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Get invoice stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
}

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats
};
