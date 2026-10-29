/**
 * Inventory Controller (Phase 3: Inventory)
 */

const inventoryService = require('../services/inventoryService');
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

function handleError(res, error, fallback) {
  console.error(`${fallback}:`, error);
  if (error.message && error.message.includes('not found')) {
    return res.status(404).json({ success: false, error: error.message });
  }
  if (error.message && (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('Missing'))) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.status(500).json({ success: false, error: fallback });
}

async function getInventory(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await inventoryService.getInventory(business.id, { search: req.query.search });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to fetch inventory');
  }
}

async function adjustStock(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await inventoryService.adjustStock(business.id, req.body);
    auditService.logAudit({
      businessId: business.id, userId: req.user.userId,
      action: 'adjust', entityType: 'inventory', entityId: result.product.id,
      details: { type: result.movement.type, qty: String(result.movement.qty) }
    }).catch(() => {});
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to adjust stock');
  }
}

async function getMovements(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await inventoryService.getMovements(business.id, {
      productId: req.query.productId, page: req.query.page, limit: req.query.limit
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to fetch stock movements');
  }
}

async function getLowStock(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await inventoryService.getLowStock(business.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to fetch low-stock items');
  }
}

module.exports = { getInventory, adjustStock, getMovements, getLowStock };
