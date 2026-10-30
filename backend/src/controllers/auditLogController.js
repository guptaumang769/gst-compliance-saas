/**
 * Audit Log Controller
 * Exposes paginated audit logs for the caller's business.
 */

const auditService = require('../services/auditService');

/**
 * GET /api/audit-logs?page=&limit=&entityType=
 */
async function getAuditLogs(req, res) {
  try {
    const userId = req.user.userId;
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });

    if (!business) {
      return res.status(404).json({ success: false, error: 'No active business found' });
    }

    const result = await auditService.getAuditLogs(business.id, {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 50,
      entityType: req.query.entityType
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
}

module.exports = {
  getAuditLogs
};
