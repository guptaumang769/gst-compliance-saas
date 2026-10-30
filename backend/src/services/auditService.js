/**
 * Audit Service
 * Lightweight, best-effort audit logging for create/update/delete actions
 * across entities (invoices, purchases, customers, products, users, etc.).
 *
 * logAudit() NEVER throws - failures are swallowed so the main business flow
 * is never broken by audit logging.
 */

const prisma = require('../config/database');

/**
 * Record an audit log entry (best-effort).
 *
 * @param {Object} params
 * @param {string} params.businessId - Business the action belongs to
 * @param {string|null} [params.userId] - Acting user (nullable)
 * @param {string} params.action - create | update | delete | invite | role_change | ...
 * @param {string} params.entityType - invoice | purchase | customer | product | user | ...
 * @param {string} [params.entityId] - Affected entity id
 * @param {Object} [params.details] - Arbitrary JSON details
 * @returns {Promise<Object|null>} The created log or null on failure
 */
async function logAudit({ businessId, userId = null, action, entityType, entityId = null, details = null }) {
  try {
    if (!businessId || !action || !entityType) {
      return null;
    }

    return await prisma.auditLog.create({
      data: {
        businessId,
        userId: userId || null,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        details: details || undefined
      }
    });
  } catch (error) {
    // Best-effort: never break the caller
    console.error('[Audit] Failed to write audit log:', error.message);
    return null;
  }
}

/**
 * Get paginated audit logs for a business.
 *
 * @param {string} businessId
 * @param {Object} options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=50]
 * @param {string} [options.entityType] - optional filter
 * @returns {Promise<Object>} { logs, pagination }
 */
async function getAuditLogs(businessId, options = {}) {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const where = { businessId };
  if (options.entityType) {
    where.entityType = options.entityType;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true }
        }
      }
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

module.exports = {
  logAudit,
  getAuditLogs
};
