/**
 * TDS/TCS Controller (Phase 3: TDS/TCS)
 */

const tdsTcsService = require('../services/tdsTcsService');
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

async function getEntries(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await tdsTcsService.listEntries(business.id, {
      page: req.query.page, limit: req.query.limit, type: req.query.type, period: req.query.period
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to fetch TDS/TCS entries');
  }
}

async function createEntry(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await tdsTcsService.createEntry(business.id, req.body);
    auditService.logAudit({
      businessId: business.id, userId: req.user.userId,
      action: 'create', entityType: 'tds_tcs', entityId: result.entry.id,
      details: { type: result.entry.type, section: result.entry.section }
    }).catch(() => {});
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to create TDS/TCS entry');
  }
}

async function getSummary(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await tdsTcsService.getSummary(business.id, {
      year: req.query.year, month: req.query.month
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to fetch TDS/TCS summary');
  }
}

async function getEntryById(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await tdsTcsService.getEntry(req.params.id, business.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to fetch TDS/TCS entry');
  }
}

async function updateEntry(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await tdsTcsService.updateEntry(req.params.id, business.id, req.body);
    auditService.logAudit({
      businessId: business.id, userId: req.user.userId,
      action: 'update', entityType: 'tds_tcs', entityId: req.params.id
    }).catch(() => {});
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to update TDS/TCS entry');
  }
}

async function deleteEntry(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await tdsTcsService.deleteEntry(req.params.id, business.id);
    auditService.logAudit({
      businessId: business.id, userId: req.user.userId,
      action: 'delete', entityType: 'tds_tcs', entityId: req.params.id
    }).catch(() => {});
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to delete TDS/TCS entry');
  }
}

module.exports = {
  getEntries,
  createEntry,
  getSummary,
  getEntryById,
  updateEntry,
  deleteEntry
};
