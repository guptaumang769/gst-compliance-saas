/**
 * Financials Controller (Phase 3: Financials)
 */

const financialsService = require('../services/financialsService');

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

async function pnl(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await financialsService.getPnl(business.id, {
      startDate: req.query.startDate, endDate: req.query.endDate
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error('P&L report error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate P&L statement' });
  }
}

async function balanceSheet(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await financialsService.getBalanceSheet(business.id, { asOf: req.query.asOf });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Balance sheet report error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate balance sheet' });
  }
}

module.exports = { pnl, balanceSheet };
