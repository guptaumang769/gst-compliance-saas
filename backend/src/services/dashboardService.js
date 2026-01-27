/**
 * Dashboard Service
 * Provides aggregated business metrics and insights
 * 
 * Key Metrics:
 * - Sales Tax Liability (from invoices)
 * - ITC Available (from purchases)
 * - Net Tax Payable (Sales Tax - ITC)
 * - Invoice/Purchase counts
 * - Top customers/suppliers
 * - Upcoming GST filing deadlines
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get dashboard overview for a specific month
 * @param {string} businessId - Business ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (YYYY)
 * @returns {Promise<Object>} - Dashboard metrics
 */
async function getDashboardOverview(businessId, month, year) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  // Parallel queries for performance
  const [
    salesData,
    purchaseData,
    invoiceCount,
    purchaseCount,
    customerCount,
    supplierCount
  ] = await Promise.all([
    // Sales tax liability
    prisma.invoice.aggregate({
      where: {
        businessId,
        isActive: true,
        invoiceDate: { gte: monthStart, lte: monthEnd }
      },
      _sum: {
        totalAmount: true,
        taxableAmount: true,
        totalTaxAmount: true,
        cgstAmount: true,
        sgstAmount: true,
        igstAmount: true,
        cessAmount: true
      }
    }),
    // Purchase tax (ITC)
    prisma.purchase.aggregate({
      where: {
        businessId,
        isActive: true,
        isItcEligible: true,
        supplierInvoiceDate: { gte: monthStart, lte: monthEnd }
      },
      _sum: {
        totalAmount: true,
        taxableAmount: true,
        itcAmount: true,
        cgstAmount: true,
        sgstAmount: true,
        igstAmount: true,
        cessAmount: true
      }
    }),
    // Invoice count
    prisma.invoice.count({
      where: {
        businessId,
        isActive: true,
        invoiceDate: { gte: monthStart, lte: monthEnd }
      }
    }),
    // Purchase count
    prisma.purchase.count({
      where: {
        businessId,
        isActive: true,
        supplierInvoiceDate: { gte: monthStart, lte: monthEnd }
      }
    }),
    // Customer count
    prisma.customer.count({
      where: { businessId, isActive: true }
    }),
    // Supplier count
    prisma.supplier.count({
      where: { businessId, isActive: true }
    })
  ]);

  // Calculate net tax payable
  const salesTax = parseFloat(salesData._sum.totalTaxAmount || 0);
  const itcAvailable = parseFloat(purchaseData._sum.itcAmount || 0);
  const netTaxPayable = salesTax - itcAvailable;

  return {
    period: {
      month,
      year,
      monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' })
    },
    sales: {
      totalRevenue: parseFloat(salesData._sum.totalAmount || 0),
      taxableAmount: parseFloat(salesData._sum.taxableAmount || 0),
      totalTax: salesTax,
      cgst: parseFloat(salesData._sum.cgstAmount || 0),
      sgst: parseFloat(salesData._sum.sgstAmount || 0),
      igst: parseFloat(salesData._sum.igstAmount || 0),
      cess: parseFloat(salesData._sum.cessAmount || 0),
      invoiceCount
    },
    purchases: {
      totalExpenditure: parseFloat(purchaseData._sum.totalAmount || 0),
      taxableAmount: parseFloat(purchaseData._sum.taxableAmount || 0),
      totalItc: itcAvailable,
      cgst: parseFloat(purchaseData._sum.cgstAmount || 0),
      sgst: parseFloat(purchaseData._sum.sgstAmount || 0),
      igst: parseFloat(purchaseData._sum.igstAmount || 0),
      cess: parseFloat(purchaseData._sum.cessAmount || 0),
      purchaseCount
    },
    tax: {
      outputTax: salesTax,
      inputTaxCredit: itcAvailable,
      netTaxPayable: netTaxPayable > 0 ? netTaxPayable : 0,
      refundDue: netTaxPayable < 0 ? Math.abs(netTaxPayable) : 0
    },
    counts: {
      totalCustomers: customerCount,
      totalSuppliers: supplierCount,
      invoicesThisMonth: invoiceCount,
      purchasesThisMonth: purchaseCount
    }
  };
}

/**
 * Get top customers by revenue
 * @param {string} businessId - Business ID
 * @param {Object} filters - Date filters
 * @returns {Promise<Array>} - Top customers
 */
async function getTopCustomers(businessId, filters = {}) {
  const { month, year, limit = 10 } = filters;

  const where = {
    businessId,
    isActive: true
  };

  if (month && year) {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);
    where.invoiceDate = { gte: monthStart, lte: monthEnd };
  }

  const topCustomers = await prisma.invoice.groupBy({
    by: ['customerId'],
    where,
    _sum: {
      totalAmount: true,
      totalTaxAmount: true
    },
    _count: true,
    orderBy: {
      _sum: {
        totalAmount: 'desc'
      }
    },
    take: limit
  });

  // Fetch customer details
  const customerIds = topCustomers.map(c => c.customerId);
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, customerName: true, customerType: true, state: true }
  });

  const customerMap = {};
  customers.forEach(c => { customerMap[c.id] = c; });

  return topCustomers.map(item => ({
    customer: customerMap[item.customerId],
    totalRevenue: parseFloat(item._sum.totalAmount || 0),
    totalTax: parseFloat(item._sum.totalTaxAmount || 0),
    invoiceCount: item._count
  }));
}

/**
 * Get top suppliers by expenditure
 * @param {string} businessId - Business ID
 * @param {Object} filters - Date filters
 * @returns {Promise<Array>} - Top suppliers
 */
async function getTopSuppliers(businessId, filters = {}) {
  const { month, year, limit = 10 } = filters;

  const where = {
    businessId,
    isActive: true
  };

  if (month && year) {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);
    where.supplierInvoiceDate = { gte: monthStart, lte: monthEnd };
  }

  const topSuppliers = await prisma.purchase.groupBy({
    by: ['supplierId'],
    where,
    _sum: {
      totalAmount: true,
      itcAmount: true
    },
    _count: true,
    orderBy: {
      _sum: {
        totalAmount: 'desc'
      }
    },
    take: limit
  });

  // Fetch supplier details
  const supplierIds = topSuppliers.map(s => s.supplierId);
  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: supplierIds } },
    select: { id: true, supplierName: true, supplierType: true, state: true }
  });

  const supplierMap = {};
  suppliers.forEach(s => { supplierMap[s.id] = s; });

  return topSuppliers.map(item => ({
    supplier: supplierMap[item.supplierId],
    totalExpenditure: parseFloat(item._sum.totalAmount || 0),
    totalItc: parseFloat(item._sum.itcAmount || 0),
    purchaseCount: item._count
  }));
}

/**
 * Get revenue trend (last 6 months)
 * @param {string} businessId - Business ID
 * @returns {Promise<Array>} - Monthly revenue data
 */
async function getRevenueTrend(businessId) {
  const trends = [];
  const currentDate = new Date();

  for (let i = 5; i >= 0; i--) {
    const month = currentDate.getMonth() - i;
    const year = currentDate.getFullYear();
    const date = new Date(year, month, 1);

    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

    const salesData = await prisma.invoice.aggregate({
      where: {
        businessId,
        isActive: true,
        invoiceDate: { gte: monthStart, lte: monthEnd }
      },
      _sum: {
        totalAmount: true,
        totalTaxAmount: true
      }
    });

    trends.push({
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      monthName: date.toLocaleString('default', { month: 'short' }),
      revenue: parseFloat(salesData._sum.totalAmount || 0),
      tax: parseFloat(salesData._sum.totalTaxAmount || 0)
    });
  }

  return trends;
}

/**
 * Get upcoming GST filing deadlines
 * @param {string} businessId - Business ID
 * @returns {Promise<Array>} - List of upcoming deadlines
 */
async function getGstDeadlines(businessId) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, isActive: true },
    select: { filingFrequency: true }
  });

  if (!business) {
    throw new Error('Business not found');
  }

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // GST deadlines (standard)
  const deadlines = [
    {
      returnType: 'GSTR-1',
      description: 'Details of outward supplies (sales)',
      dueDate: 11, // 11th of next month
      status: 'pending'
    },
    {
      returnType: 'GSTR-3B',
      description: 'Summary return with tax payment',
      dueDate: 20, // 20th of next month
      status: 'pending'
    }
  ];

  // Add quarterly deadlines if filing frequency is quarterly
  if (business.filingFrequency === 'quarterly') {
    deadlines.push({
      returnType: 'GSTR-1 (Quarterly)',
      description: 'Quarterly details of outward supplies',
      dueDate: 13, // 13th of month following quarter
      status: 'pending'
    });
  }

  // Calculate next due dates
  return deadlines.map(deadline => {
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const dueDate = new Date(nextYear, nextMonth - 1, deadline.dueDate);

    // Check if already filed
    const today = new Date();
    const isPast = dueDate < today;

    return {
      ...deadline,
      forPeriod: `${String(currentMonth).padStart(2, '0')}/${currentYear}`,
      dueDate: dueDate.toISOString().split('T')[0],
      daysRemaining: Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)),
      isOverdue: isPast,
      priority: isPast ? 'high' : dueDate - today < 7 * 24 * 60 * 60 * 1000 ? 'medium' : 'normal'
    };
  });
}

/**
 * Get quick stats (for dashboard cards)
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Quick statistics
 */
async function getQuickStats(businessId) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const overview = await getDashboardOverview(businessId, currentMonth, currentYear);

  return {
    currentMonth: {
      revenue: overview.sales.totalRevenue,
      expenses: overview.purchases.totalExpenditure,
      taxLiability: overview.tax.outputTax,
      itcAvailable: overview.tax.inputTaxCredit,
      netTaxPayable: overview.tax.netTaxPayable
    },
    counts: overview.counts,
    alerts: {
      overdueInvoices: 0, // TODO: Implement overdue invoice tracking
      upcomingDeadlines: 2, // GSTR-1 and GSTR-3B
      pendingPayments: 0 // TODO: Implement payment tracking
    }
  };
}

module.exports = {
  getDashboardOverview,
  getTopCustomers,
  getTopSuppliers,
  getRevenueTrend,
  getGstDeadlines,
  getQuickStats
};
