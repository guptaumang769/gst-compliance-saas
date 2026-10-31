/**
 * Insights Controller (Phase 3: Insights)
 * Always returns an array of insights, never errors.
 */

const insightsService = require('../services/insightsService');

async function getInsights(req, res) {
  try {
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId: req.user.userId, isActive: true }
    });
    if (!business) {
      // Still return an array per contract (never error out).
      return res.status(200).json({ success: true, insights: [] });
    }
    const result = await insightsService.getInsights(business.id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Insights error:', error);
    // Never error: return an empty array.
    return res.status(200).json({ success: true, insights: [] });
  }
}

module.exports = { getInsights };
