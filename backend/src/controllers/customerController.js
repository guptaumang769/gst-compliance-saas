/**
 * Customer Controller
 * Week 3-4: Customer Management
 * Handles HTTP requests for customer operations
 */

const customerService = require('../services/customerService');

/**
 * POST /api/customers
 * Create a new customer
 */
async function createCustomer(req, res) {
  try {
    // Business ID comes from user's first business (for now)
    // Later we'll support multiple businesses per user
    const userId = req.user.userId;
    
    // Get user's business
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No active business found for user'
      });
    }
    
    // Create customer
    const result = await customerService.createCustomer(business.id, req.body);
    
    return res.status(201).json(result);
    
  } catch (error) {
    console.error('Create customer error:', error);
    
    if (error.message.includes('Invalid GSTIN') || 
        error.message.includes('required') ||
        error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to create customer'
    });
  }
}

/**
 * GET /api/customers
 * Get all customers for the business
 */
async function getCustomers(req, res) {
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
      customerType: req.query.customerType,
      isActive: req.query.isActive !== 'false'
    };
    
    const result = await customerService.getCustomers(business.id, options);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Get customers error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch customers'
    });
  }
}

/**
 * GET /api/customers/:id
 * Get customer by ID
 */
async function getCustomerById(req, res) {
  try {
    const userId = req.user.userId;
    const customerId = req.params.id;
    
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
    
    const result = await customerService.getCustomerById(customerId, business.id);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Get customer error:', error);
    
    if (error.message === 'Customer not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch customer'
    });
  }
}

/**
 * PUT /api/customers/:id
 * Update customer
 */
async function updateCustomer(req, res) {
  try {
    const userId = req.user.userId;
    const customerId = req.params.id;
    
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
    
    const result = await customerService.updateCustomer(customerId, business.id, req.body);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Update customer error:', error);
    
    if (error.message === 'Customer not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Invalid GSTIN') || error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to update customer'
    });
  }
}

/**
 * DELETE /api/customers/:id
 * Delete customer (soft delete)
 */
async function deleteCustomer(req, res) {
  try {
    const userId = req.user.userId;
    const customerId = req.params.id;
    
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
    
    const result = await customerService.deleteCustomer(customerId, business.id);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Delete customer error:', error);
    
    if (error.message === 'Customer not found') {
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
      error: 'Failed to delete customer'
    });
  }
}

/**
 * GET /api/customers/stats
 * Get customer statistics
 */
async function getCustomerStats(req, res) {
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
    
    const result = await customerService.getCustomerStats(business.id);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Get customer stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
}

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerStats
};
