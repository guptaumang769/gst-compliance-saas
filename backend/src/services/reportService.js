/**
 * Report Service
 * Reports & Analytics (Phase 2)
 *
 * All reports are scoped to a single business and an optional date range.
 * Every report returns the shape: { rows: [...], totals: {...} }.
 *
 * Pure row/summary builders live in ../utils/reportBuilders (no DB) so they
 * can be unit tested; this service handles the data fetching.
 */

const prisma = require('../config/database');
const {
  buildSalesRegister,
  buildPurchaseRegister,
  buildTaxRateSummary,
  buildHsnSummary,
  buildItcAnalysis,
  CSV_COLUMNS
} = require('../utils/reportBuilders');

/**
 * Build a Prisma date-range filter for a given field.
 */
function dateRangeWhere(field, startDate, endDate) {
  const range = {};
  if (startDate) range.gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    range.lte = end;
  }
  return Object.keys(range).length ? { [field]: range } : {};
}

async function getSalesRegister(businessId, { startDate, endDate } = {}) {
  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      isActive: true,
      ...dateRangeWhere('invoiceDate', startDate, endDate)
    },
    include: { customer: { select: { customerName: true } } },
    orderBy: { invoiceDate: 'asc' }
  });
  return buildSalesRegister(invoices);
}

async function getPurchaseRegister(businessId, { startDate, endDate } = {}) {
  const purchases = await prisma.purchase.findMany({
    where: {
      businessId,
      isActive: true,
      ...dateRangeWhere('supplierInvoiceDate', startDate, endDate)
    },
    include: { supplier: { select: { supplierName: true } } },
    orderBy: { supplierInvoiceDate: 'asc' }
  });
  return buildPurchaseRegister(purchases);
}

async function getSalesInvoiceItems(businessId, { startDate, endDate } = {}) {
  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      isActive: true,
      ...dateRangeWhere('invoiceDate', startDate, endDate)
    },
    include: { items: true }
  });
  return invoices.flatMap((inv) => inv.items || []);
}

async function getTaxRateSummary(businessId, options = {}) {
  const items = await getSalesInvoiceItems(businessId, options);
  return buildTaxRateSummary(items);
}

async function getHsnSummary(businessId, options = {}) {
  const items = await getSalesInvoiceItems(businessId, options);
  return buildHsnSummary(items);
}

async function getItcAnalysis(businessId, { startDate, endDate } = {}) {
  const [purchases, invoices] = await Promise.all([
    prisma.purchase.findMany({
      where: {
        businessId,
        isActive: true,
        ...dateRangeWhere('supplierInvoiceDate', startDate, endDate)
      }
    }),
    prisma.invoice.findMany({
      where: {
        businessId,
        isActive: true,
        ...dateRangeWhere('invoiceDate', startDate, endDate)
      }
    })
  ]);
  return buildItcAnalysis(purchases, invoices);
}

module.exports = {
  getSalesRegister,
  getPurchaseRegister,
  getTaxRateSummary,
  getHsnSummary,
  getItcAnalysis,
  dateRangeWhere,
  CSV_COLUMNS
};
