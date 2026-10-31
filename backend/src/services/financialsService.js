/**
 * Financials Service (Phase 3: Financials)
 *
 * Simplified P&L and balance sheet computed purely from Invoice/Purchase/Product
 * data. The aggregation math lives in the pure pnlCalculator. All responses
 * { success, ... }. These are indicative statements, not audited accounts.
 */

const prisma = require('../config/database');
const { computePnl, computeBalanceSheet, round2 } = require('../utils/pnlCalculator');

const BALANCE_SHEET_DISCLAIMER =
  'Simplified indicative statement derived from recorded invoices, purchases and inventory. Not a substitute for audited financial statements.';

function dateRange(startDate, endDate) {
  const range = {};
  if (startDate) {
    const s = new Date(startDate);
    if (!Number.isNaN(s.getTime())) range.gte = s;
  }
  if (endDate) {
    const e = new Date(endDate);
    if (!Number.isNaN(e.getTime())) range.lte = e;
  }
  return Object.keys(range).length ? range : null;
}

/**
 * Profit & Loss for a date range.
 */
async function getPnl(businessId, { startDate, endDate } = {}) {
  const invoiceWhere = { businessId, isActive: true };
  const purchaseWhere = { businessId, isActive: true };

  const invRange = dateRange(startDate, endDate);
  if (invRange) invoiceWhere.invoiceDate = invRange;
  if (invRange) purchaseWhere.supplierInvoiceDate = invRange;

  const [invoices, purchases] = await Promise.all([
    prisma.invoice.findMany({ where: invoiceWhere, select: { taxableAmount: true } }),
    prisma.purchase.findMany({ where: purchaseWhere, select: { taxableAmount: true } })
  ]);

  const pnl = computePnl({
    invoices: invoices.map((i) => ({ taxableAmount: Number(i.taxableAmount) })),
    purchases: purchases.map((p) => ({ taxableAmount: Number(p.taxableAmount) }))
  });

  return {
    success: true,
    startDate: startDate || null,
    endDate: endDate || null,
    revenue: pnl.revenue,
    cogs: pnl.cogs,
    expenses: pnl.expenses,
    grossProfit: pnl.grossProfit,
    netProfit: pnl.netProfit,
    margin: pnl.margin,
    rows: pnl.rows
  };
}

/**
 * Simplified balance sheet as of a date.
 */
async function getBalanceSheet(businessId, { asOf } = {}) {
  const asOfDate = asOf ? new Date(asOf) : null;
  const validAsOf = asOfDate && !Number.isNaN(asOfDate.getTime()) ? asOfDate : null;

  const invoiceWhere = { businessId, isActive: true };
  const purchaseWhere = { businessId, isActive: true };
  if (validAsOf) {
    invoiceWhere.invoiceDate = { lte: validAsOf };
    purchaseWhere.supplierInvoiceDate = { lte: validAsOf };
  }

  const [invoices, purchases, products] = await Promise.all([
    prisma.invoice.findMany({
      where: invoiceWhere,
      select: { totalAmount: true, totalTaxAmount: true }
    }),
    prisma.purchase.findMany({
      where: purchaseWhere,
      select: { totalAmount: true, itcAmount: true, isPaid: true }
    }),
    prisma.product.findMany({
      where: { businessId, isActive: true },
      select: { stockQty: true, sellingPrice: true }
    })
  ]);

  const receivables = invoices.reduce((acc, i) => acc + Number(i.totalAmount || 0), 0);
  const payables = purchases
    .filter((p) => !p.isPaid)
    .reduce((acc, p) => acc + Number(p.totalAmount || 0), 0);

  const inventoryValue = products.reduce(
    (acc, p) => acc + Number(p.stockQty || 0) * Number(p.sellingPrice || 0),
    0
  );

  const outputTax = invoices.reduce((acc, i) => acc + Number(i.totalTaxAmount || 0), 0);
  const inputItc = purchases.reduce((acc, p) => acc + Number(p.itcAmount || 0), 0);
  const taxPayable = Math.max(0, round2(outputTax - inputItc));

  const sheet = computeBalanceSheet({
    receivables,
    payables,
    inventoryValue,
    taxPayable,
    cash: 0
  });

  return {
    success: true,
    asOf: asOf || null,
    assets: sheet.assets,
    liabilities: sheet.liabilities,
    totalAssets: sheet.totalAssets,
    totalLiabilities: sheet.totalLiabilities,
    equity: sheet.equity,
    disclaimer: BALANCE_SHEET_DISCLAIMER
  };
}

module.exports = {
  getPnl,
  getBalanceSheet,
  BALANCE_SHEET_DISCLAIMER
};
