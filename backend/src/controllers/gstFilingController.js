/**
 * GST Filing Controller (Phase 3: GST filing STUB)
 */

const gstFilingService = require('../services/gstFilingService');
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

async function file(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const { returnType, returnId } = req.body || {};
    const result = await gstFilingService.fileReturn(business.id, { returnType, returnId });
    auditService.logAudit({
      businessId: business.id, userId: req.user.userId,
      action: 'file', entityType: 'gst_filing', entityId: result.referenceId,
      details: { returnType, returnId: returnId || null }
    }).catch(() => {});
    return res.status(200).json(result);
  } catch (error) {
    console.error('GST filing error:', error);
    if (error.message && error.message.includes('required')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Failed to file return' });
  }
}

async function status(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await gstFilingService.getStatus(req.params.referenceId, business.id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('GST filing status error:', error);
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Failed to fetch filing status' });
  }
}

module.exports = { file, status };
