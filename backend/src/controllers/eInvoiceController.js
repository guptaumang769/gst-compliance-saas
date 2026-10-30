/**
 * E-Invoice Controller (Phase 3: E-Invoice)
 */

const eInvoiceService = require('../services/eInvoiceService');
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
  if (error.message && (error.message.includes('required') || error.message.includes('Invalid'))) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.status(500).json({ success: false, error: fallback });
}

async function generate(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await eInvoiceService.generateForInvoice(req.params.invoiceId, business.id);
    auditService.logAudit({
      businessId: business.id, userId: req.user.userId,
      action: 'generate', entityType: 'einvoice', entityId: req.params.invoiceId,
      details: { irn: result.eInvoice.irn }
    }).catch(() => {});
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to generate E-Invoice');
  }
}

async function getByInvoice(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await eInvoiceService.getByInvoice(req.params.invoiceId, business.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to fetch E-Invoice');
  }
}

async function cancel(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await eInvoiceService.cancelForInvoice(req.params.invoiceId, business.id);
    auditService.logAudit({
      businessId: business.id, userId: req.user.userId,
      action: 'cancel', entityType: 'einvoice', entityId: req.params.invoiceId
    }).catch(() => {});
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to cancel E-Invoice');
  }
}

async function list(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await eInvoiceService.listEInvoices(business.id, {
      page: req.query.page, limit: req.query.limit, status: req.query.status
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to list E-Invoices');
  }
}

module.exports = { generate, getByInvoice, cancel, list };
