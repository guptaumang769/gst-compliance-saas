/**
 * E-Way Bill Controller (Phase 3: E-Way Bill)
 * Handles HTTP requests for E-Way Bill operations. Mirrors the product pattern.
 */

const ewayBillService = require('../services/ewayBillService');
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

async function getEwayBills(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await ewayBillService.listEwayBills(business.id, {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      status: req.query.status
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to fetch E-Way Bills');
  }
}

async function createEwayBill(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await ewayBillService.createEwayBill(business.id, req.body);
    auditService.logAudit({
      businessId: business.id, userId: req.user.userId,
      action: 'create', entityType: 'eway_bill', entityId: result.ewayBill.id,
      details: { docNumber: result.ewayBill.docNumber }
    }).catch(() => {});
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to create E-Way Bill');
  }
}

async function getEwayBillById(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await ewayBillService.getEwayBillById(req.params.id, business.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to fetch E-Way Bill');
  }
}

async function updateEwayBill(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await ewayBillService.updateEwayBill(req.params.id, business.id, req.body);
    auditService.logAudit({
      businessId: business.id, userId: req.user.userId,
      action: 'update', entityType: 'eway_bill', entityId: req.params.id
    }).catch(() => {});
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to update E-Way Bill');
  }
}

async function deleteEwayBill(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await ewayBillService.deleteEwayBill(req.params.id, business.id);
    auditService.logAudit({
      businessId: business.id, userId: req.user.userId,
      action: 'delete', entityType: 'eway_bill', entityId: req.params.id
    }).catch(() => {});
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to delete E-Way Bill');
  }
}

async function generateEwayBill(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await ewayBillService.generateEwayBill(req.params.id, business.id);
    auditService.logAudit({
      businessId: business.id, userId: req.user.userId,
      action: 'generate', entityType: 'eway_bill', entityId: req.params.id,
      details: { ewbNumber: result.ewayBill.ewbNumber }
    }).catch(() => {});
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to generate E-Way Bill');
  }
}

async function cancelEwayBill(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await ewayBillService.cancelEwayBill(req.params.id, business.id);
    auditService.logAudit({
      businessId: business.id, userId: req.user.userId,
      action: 'cancel', entityType: 'eway_bill', entityId: req.params.id
    }).catch(() => {});
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to cancel E-Way Bill');
  }
}

async function createFromInvoice(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await ewayBillService.createFromInvoice(req.params.invoiceId, business.id);
    auditService.logAudit({
      businessId: business.id, userId: req.user.userId,
      action: 'create', entityType: 'eway_bill', entityId: result.ewayBill.id,
      details: { fromInvoice: req.params.invoiceId }
    }).catch(() => {});
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to create E-Way Bill from invoice');
  }
}

module.exports = {
  getEwayBills,
  createEwayBill,
  getEwayBillById,
  updateEwayBill,
  deleteEwayBill,
  generateEwayBill,
  cancelEwayBill,
  createFromInvoice
};
