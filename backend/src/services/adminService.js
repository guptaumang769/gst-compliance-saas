/**
 * Admin Service (Phase 3: Admin)
 *
 * Business/account-level admin panel data (OWNER only). Everything is scoped to
 * the caller's own business.
 *
 * NOTE: This is a per-business ("account admin") panel, NOT a cross-tenant
 * platform console. A true platform super-admin (able to see all businesses,
 * manage plans, impersonate users, etc.) would be a separate, independently
 * authorised surface — do not conflate the two.
 */

const prisma = require('../config/database');

async function getOverview(business) {
  const businessId = business.id;

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [customers, invoices, products, members, revenueAgg] = await Promise.all([
    prisma.customer.count({ where: { businessId, isActive: true } }),
    prisma.invoice.count({ where: { businessId, isActive: true } }),
    prisma.product.count({ where: { businessId, isActive: true } }),
    prisma.user.count({ where: { memberBusinessId: businessId, isActive: true } }),
    prisma.invoice.aggregate({
      where: { businessId, isActive: true, invoiceDate: { gte: startOfMonth } },
      _sum: { totalAmount: true }
    })
  ]);

  return {
    success: true,
    counts: {
      users: members + 1, // team members + the owner
      customers,
      invoices,
      products
    },
    revenueThisMonth: Number(revenueAgg._sum.totalAmount || 0),
    subscription: {
      plan: business.subscriptionPlan,
      status: business.subscriptionStatus,
      validUntil: business.subscriptionValidUntil
    }
  };
}

async function getActivity(businessId, limit = 50) {
  const logs = await prisma.auditLog.findMany({
    where: { businessId },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, email: true } } }
  });
  return { success: true, activity: logs };
}

async function getHealth() {
  let dbConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch (e) {
    dbConnected = false;
  }

  return {
    success: true,
    status: 'OK',
    dbConnected,
    uptimeSeconds: Math.round(process.uptime()),
    version: '1.0.0',
    nodeVersion: process.version
  };
}

module.exports = {
  getOverview,
  getActivity,
  getHealth
};
