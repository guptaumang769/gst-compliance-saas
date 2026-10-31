/**
 * WhatsApp Controller (Phase 3: WhatsApp)
 */

const whatsappService = require('../services/whatsappService');

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

async function invoiceLink(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await whatsappService.getInvoiceLink(req.params.invoiceId, business.id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('WhatsApp invoice link error:', error);
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Failed to build WhatsApp link' });
  }
}

module.exports = { invoiceLink };
