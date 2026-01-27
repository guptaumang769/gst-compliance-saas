/**
 * Supplier Controller
 * Handles HTTP requests for supplier management
 */

const supplierService = require('../services/supplierService');

/**
 * Create a new supplier
 * POST /api/suppliers
 */
async function createSupplier(req, res) {
  try {
    const businessId = req.user.businessId;
    const supplierData = {
      businessId,
      ...req.body
    };

    const supplier = await supplierService.createSupplier(supplierData);

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create supplier'
    });
  }
}

/**
 * Get all suppliers for the authenticated business
 * GET /api/suppliers
 */
async function getSuppliers(req, res) {
  try {
    const businessId = req.user.businessId;
    const filters = {
      supplierType: req.query.supplierType,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await supplierService.getSuppliers(businessId, filters);

    res.status(200).json({
      success: true,
      message: 'Suppliers retrieved successfully',
      data: result.suppliers,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to retrieve suppliers'
    });
  }
}

/**
 * Get a single supplier by ID
 * GET /api/suppliers/:id
 */
async function getSupplierById(req, res) {
  try {
    const businessId = req.user.businessId;
    const supplierId = req.params.id;

    const supplier = await supplierService.getSupplierById(supplierId, businessId);

    res.status(200).json({
      success: true,
      message: 'Supplier retrieved successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Supplier not found'
    });
  }
}

/**
 * Update a supplier
 * PUT /api/suppliers/:id
 */
async function updateSupplier(req, res) {
  try {
    const businessId = req.user.businessId;
    const supplierId = req.params.id;
    const updateData = req.body;

    const supplier = await supplierService.updateSupplier(supplierId, businessId, updateData);

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update supplier'
    });
  }
}

/**
 * Delete a supplier
 * DELETE /api/suppliers/:id
 */
async function deleteSupplier(req, res) {
  try {
    const businessId = req.user.businessId;
    const supplierId = req.params.id;

    await supplierService.deleteSupplier(supplierId, businessId);

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete supplier'
    });
  }
}

/**
 * Get supplier statistics
 * GET /api/suppliers/stats
 */
async function getSupplierStats(req, res) {
  try {
    const businessId = req.user.businessId;
    const stats = await supplierService.getSupplierStats(businessId);

    res.status(200).json({
      success: true,
      message: 'Supplier statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Get supplier stats error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to retrieve supplier statistics'
    });
  }
}

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  getSupplierStats
};
