/**
 * Admin Controller (Phase 3: Admin) — OWNER only, business-scoped.
 */

const adminService = require('../services/adminService');

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

async function getOverview(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await adminService.getOverview(business);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Admin overview error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch admin overview' });
  }
}

async function getActivity(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await adminService.getActivity(business.id, 50);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Admin activity error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch activity' });
  }
}

async function getHealth(req, res) {
  try {
    const result = await adminService.getHealth();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Admin health error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch health' });
  }
}

module.exports = { getOverview, getActivity, getHealth };
