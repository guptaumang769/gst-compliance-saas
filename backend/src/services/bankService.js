/**
 * Bank Reconciliation Service (Phase 3: Bank Reconciliation)
 *
 * Imports bank statements (CSV or JSON rows) into BankTransaction records and
 * auto-matches unmatched transactions against invoices (CREDIT) / purchases
 * (DEBIT) using the pure bankMatcher. All responses { success, ... }.
 */

const prisma = require('../config/database');
const { parseCsv } = require('../utils/csvParser');
const { decideMatch, DEFAULT_TOLERANCE_DAYS } = require('../utils/bankMatcher');

function normalizeTxnType(type, amount) {
  const t = String(type || '').toUpperCase();
  if (t === 'CREDIT' || t === 'CR' || t === 'C') return 'CREDIT';
  if (t === 'DEBIT' || t === 'DR' || t === 'D') return 'DEBIT';
  // Fallback: infer from amount sign.
  return Number(amount) < 0 ? 'DEBIT' : 'CREDIT';
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Normalise raw rows (from CSV or JSON) into transaction data objects.
 */
function normalizeRows(rows) {
  const normalized = [];
  for (const raw of rows || []) {
    const date = toDate(raw.date);
    const amountRaw = raw.amount;
    const amount = Math.abs(Number(amountRaw));
    if (!date || !Number.isFinite(amount)) {
      continue; // skip malformed rows
    }
    normalized.push({
      date,
      description: raw.description || raw.desc || null,
      amount,
      type: normalizeTxnType(raw.type, amountRaw)
    });
  }
  return normalized;
}

/**
 * Create a statement + its transactions.
 *
 * @param {string} businessId
 * @param {Object} params - { name, rows, csvText }
 */
async function createStatement(businessId, { name, rows, csvText } = {}) {
  let sourceRows = rows;
  if ((!sourceRows || sourceRows.length === 0) && csvText) {
    sourceRows = parseCsv(csvText);
  }

  const normalized = normalizeRows(sourceRows);
  if (normalized.length === 0) {
    throw new Error('No valid transactions found. Provide CSV with columns date,description,amount,type or JSON rows.');
  }

  const statement = await prisma.bankStatement.create({
    data: {
      businessId,
      name: name || `Statement ${new Date().toISOString().slice(0, 10)}`
    }
  });

  await prisma.bankTransaction.createMany({
    data: normalized.map((t) => ({
      businessId,
      statementId: statement.id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: t.type,
      status: 'UNMATCHED'
    }))
  });

  const transactions = await prisma.bankTransaction.findMany({
    where: { statementId: statement.id },
    orderBy: { date: 'asc' }
  });

  return {
    success: true,
    message: 'Bank statement imported successfully',
    statement,
    transactions,
    created: transactions.length
  };
}

async function listStatements(businessId) {
  const statements = await prisma.bankStatement.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { transactions: true } } }
  });
  return { success: true, statements };
}

async function listTransactions(businessId, options = {}) {
  const where = { businessId };
  if (options.status) where.status = String(options.status).toUpperCase();
  if (options.statementId) where.statementId = options.statementId;

  const transactions = await prisma.bankTransaction.findMany({
    where,
    orderBy: { date: 'desc' }
  });
  return { success: true, transactions };
}

/**
 * Auto-reconcile unmatched transactions against invoices/purchases.
 */
async function reconcile(businessId, { statementId } = {}) {
  const txnWhere = { businessId, status: 'UNMATCHED' };
  if (statementId) txnWhere.statementId = statementId;

  const [transactions, invoices, purchases] = await Promise.all([
    prisma.bankTransaction.findMany({ where: txnWhere, orderBy: { date: 'asc' } }),
    prisma.invoice.findMany({
      where: { businessId, isActive: true },
      select: { id: true, totalAmount: true, invoiceDate: true }
    }),
    prisma.purchase.findMany({
      where: { businessId, isActive: true },
      select: { id: true, totalAmount: true, supplierInvoiceDate: true }
    })
  ]);

  // Candidate pools keyed by id so we can remove ones already matched.
  const invoicePool = invoices.map((i) => ({ id: i.id, amount: Number(i.totalAmount), date: i.invoiceDate }));
  const purchasePool = purchases.map((p) => ({ id: p.id, amount: Number(p.totalAmount), date: p.supplierInvoiceDate }));
  const usedInvoiceIds = new Set();
  const usedPurchaseIds = new Set();

  let matchedCount = 0;
  const updates = [];

  for (const txn of transactions) {
    const pools = {
      invoices: invoicePool.filter((c) => !usedInvoiceIds.has(c.id)),
      purchases: purchasePool.filter((c) => !usedPurchaseIds.has(c.id))
    };
    const decision = decideMatch(
      { amount: Number(txn.amount), date: txn.date, type: txn.type },
      pools,
      DEFAULT_TOLERANCE_DAYS
    );

    if (decision.matched) {
      matchedCount += 1;
      if (decision.matchedType === 'invoice') usedInvoiceIds.add(decision.matchedId);
      else usedPurchaseIds.add(decision.matchedId);

      updates.push(
        prisma.bankTransaction.update({
          where: { id: txn.id },
          data: {
            status: 'MATCHED',
            matchedType: decision.matchedType,
            matchedId: decision.matchedId
          }
        })
      );
    }
  }

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }

  return {
    success: true,
    message: `Reconciliation complete. ${matchedCount} transaction(s) matched.`,
    matched: matchedCount,
    processed: transactions.length
  };
}

async function updateTransaction(id, businessId, { status, matchedType, matchedId } = {}) {
  const existing = await prisma.bankTransaction.findFirst({ where: { id, businessId } });
  if (!existing) throw new Error('Bank transaction not found');

  const data = {};
  if (status !== undefined) {
    const s = String(status).toUpperCase();
    if (!['UNMATCHED', 'MATCHED', 'IGNORED'].includes(s)) {
      throw new Error('Invalid status. Must be UNMATCHED, MATCHED or IGNORED');
    }
    data.status = s;
    if (s === 'UNMATCHED' || s === 'IGNORED') {
      data.matchedType = null;
      data.matchedId = null;
    }
  }
  if (matchedType !== undefined) data.matchedType = matchedType === '' ? null : matchedType;
  if (matchedId !== undefined) data.matchedId = matchedId === '' ? null : matchedId;

  const transaction = await prisma.bankTransaction.update({ where: { id }, data });
  return { success: true, message: 'Bank transaction updated successfully', transaction };
}

/**
 * Reconciliation summary counts + totals.
 */
async function getSummary(businessId) {
  const transactions = await prisma.bankTransaction.findMany({
    where: { businessId },
    select: { status: true, type: true, amount: true }
  });

  let matched = 0;
  let unmatched = 0;
  let ignored = 0;
  let totalCredit = 0;
  let totalDebit = 0;

  for (const t of transactions) {
    if (t.status === 'MATCHED') matched += 1;
    else if (t.status === 'IGNORED') ignored += 1;
    else unmatched += 1;

    if (t.type === 'CREDIT') totalCredit += Number(t.amount);
    else totalDebit += Number(t.amount);
  }

  return {
    success: true,
    matched,
    unmatched,
    ignored,
    totalCredit: Math.round((totalCredit + Number.EPSILON) * 100) / 100,
    totalDebit: Math.round((totalDebit + Number.EPSILON) * 100) / 100
  };
}

module.exports = {
  createStatement,
  listStatements,
  listTransactions,
  reconcile,
  updateTransaction,
  getSummary,
  normalizeRows
};
