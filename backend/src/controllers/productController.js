/**
 * Product Controller
 * Product / Service Master (Week: Product Master)
 * Handles HTTP requests for product operations. Mirrors the customer pattern.
 */

const productService = require('../services/productService');
const auditService = require('../services/auditService');

async function resolveBusiness(req, res) {
  const prisma = require('../config/database');
  const business = await prisma.business.findFirst({
    where: { userId: req.user.userId, isActive: true }
  });
  if (!business) {
    res.status(404).json({ success: false, error: 'No active business found' });
    return null;
  }
  return business;
}

/**
 * POST /api/products
 */
async function createProduct(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;

    const result = await productService.createProduct(business.id, req.body);

    auditService.logAudit({
      businessId: business.id,
      userId: req.user.userId,
      action: 'create',
      entityType: 'product',
      entityId: result.product.id,
      details: { name: result.product.name }
    }).catch(() => {});

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create product error:', error);
    if (error.message.includes('required') || error.message.includes('Invalid')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Failed to create product' });
  }
}

/**
 * GET /api/products
 */
async function getProducts(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;

    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 50,
      search: req.query.search,
      type: req.query.type,
      isActive: req.query.isActive !== 'false'
    };

    const result = await productService.getProducts(business.id, options);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
}

/**
 * GET /api/products/:id
 */
async function getProductById(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;

    const result = await productService.getProductById(req.params.id, business.id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get product error:', error);
    if (error.message === 'Product not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
}

/**
 * PUT /api/products/:id
 */
async function updateProduct(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;

    const result = await productService.updateProduct(req.params.id, business.id, req.body);

    auditService.logAudit({
      businessId: business.id,
      userId: req.user.userId,
      action: 'update',
      entityType: 'product',
      entityId: req.params.id
    }).catch(() => {});

    return res.status(200).json(result);
  } catch (error) {
    console.error('Update product error:', error);
    if (error.message === 'Product not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Failed to update product' });
  }
}

/**
 * DELETE /api/products/:id
 */
async function deleteProduct(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;

    const result = await productService.deleteProduct(req.params.id, business.id);

    auditService.logAudit({
      businessId: business.id,
      userId: req.user.userId,
      action: 'delete',
      entityType: 'product',
      entityId: req.params.id
    }).catch(() => {});

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete product error:', error);
    if (error.message === 'Product not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
