/**
 * TDS/TCS Service (Phase 3: TDS/TCS)
 *
 * CRUD + summary for TDS/TCS entries. Amount math is delegated to the pure
 * tdsTcsCalculator so it is unit-testable. All responses { success, ... }.
 */

const prisma = require('../config/database');
const { computeTdsTcsAmount, summarize, normalizeType } = require('../utils/tdsTcsCalculator');

const PERIOD_RE = /^\d{4}-\d{2}$/;

function validateEntry(data) {
  if (!data.section) throw new Error('Missing required field: section');
  if (!data.partyName) throw new Error('Missing required field: partyName');
  if (data.taxableAmount === undefined || data.taxableAmount === null || data.taxableAmount === '') {
    throw new Error('Missing required field: taxableAmount');
  }
  if (data.rate === undefined || data.rate === null || data.rate === '') {
    throw new Error('Missing required field: rate');
  }
  if (!data.period) throw new Error('Missing required field: period');
  if (!PERIOD_RE.test(String(data.period))) {
    throw new Error('Invalid period. Expected format YYYY-MM');
  }
}

async function listEntries(businessId, options = {}) {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const where = { businessId, isActive: true };
  if (options.type) where.type = normalizeType(options.type);
  if (options.period) where.period = options.period;

  const [entries, total] = await Promise.all([
    prisma.tdsTcsEntry.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.tdsTcsEntry.count({ where })
  ]);

  return {
    success: true,
    entries,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
}

async function createEntry(businessId, data) {
  validateEntry(data);
  const type = normalizeType(data.type);
  const amount = computeTdsTcsAmount({
    taxableAmount: data.taxableAmount,
    rate: data.rate,
    amount: data.amount
  });

  const entry = await prisma.tdsTcsEntry.create({
    data: {
      businessId,
      type,
      section: data.section,
      partyName: data.partyName,
      taxableAmount: data.taxableAmount,
      rate: data.rate,
      amount,
      period: data.period,
      note: data.note || null,
      relatedInvoiceId: data.relatedInvoiceId || null
    }
  });

  return { success: true, message: 'TDS/TCS entry created successfully', entry };
}

async function getEntry(id, businessId) {
  const entry = await prisma.tdsTcsEntry.findFirst({ where: { id, businessId, isActive: true } });
  if (!entry) throw new Error('TDS/TCS entry not found');
  return { success: true, entry };
}

async function updateEntry(id, businessId, data) {
  const existing = await prisma.tdsTcsEntry.findFirst({ where: { id, businessId, isActive: true } });
  if (!existing) throw new Error('TDS/TCS entry not found');

  const updateData = {};
  if (data.type !== undefined) updateData.type = normalizeType(data.type);
  if (data.section !== undefined) updateData.section = data.section;
  if (data.partyName !== undefined) updateData.partyName = data.partyName;
  if (data.period !== undefined) {
    if (!PERIOD_RE.test(String(data.period))) throw new Error('Invalid period. Expected format YYYY-MM');
    updateData.period = data.period;
  }
  if (data.note !== undefined) updateData.note = data.note === '' ? null : data.note;
  if (data.relatedInvoiceId !== undefined) {
    updateData.relatedInvoiceId = data.relatedInvoiceId === '' ? null : data.relatedInvoiceId;
  }

  // Recompute amount if any of taxableAmount/rate/amount are provided.
  const taxableAmount = data.taxableAmount !== undefined ? data.taxableAmount : existing.taxableAmount;
  const rate = data.rate !== undefined ? data.rate : existing.rate;
  if (data.taxableAmount !== undefined) updateData.taxableAmount = data.taxableAmount;
  if (data.rate !== undefined) updateData.rate = data.rate;
  if (data.taxableAmount !== undefined || data.rate !== undefined || data.amount !== undefined) {
    updateData.amount = computeTdsTcsAmount({
      taxableAmount,
      rate,
      amount: data.amount
    });
  }

  const entry = await prisma.tdsTcsEntry.update({ where: { id }, data: updateData });
  return { success: true, message: 'TDS/TCS entry updated successfully', entry };
}

async function deleteEntry(id, businessId) {
  const existing = await prisma.tdsTcsEntry.findFirst({ where: { id, businessId, isActive: true } });
  if (!existing) throw new Error('TDS/TCS entry not found');

  await prisma.tdsTcsEntry.update({
    where: { id },
    data: { isActive: false, deletedAt: new Date() }
  });
  return { success: true, message: 'TDS/TCS entry deleted successfully' };
}

/**
 * Summary of totals by type, optionally filtered by year and/or month.
 */
async function getSummary(businessId, { year, month } = {}) {
  const where = { businessId, isActive: true };
  if (year && month) {
    where.period = `${year}-${String(month).padStart(2, '0')}`;
  } else if (year) {
    where.period = { startsWith: `${year}-` };
  }

  const entries = await prisma.tdsTcsEntry.findMany({ where });
  const summary = summarize(
    entries.map((e) => ({ type: e.type, taxableAmount: Number(e.taxableAmount), amount: Number(e.amount) }))
  );

  return { success: true, summary, filter: { year: year || null, month: month || null } };
}

module.exports = {
  listEntries,
  createEntry,
  getEntry,
  updateEntry,
  deleteEntry,
  getSummary
};
