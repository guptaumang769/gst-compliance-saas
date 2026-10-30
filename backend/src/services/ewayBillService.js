/**
 * E-Way Bill Service (Phase 3: E-Way Bill)
 *
 * CRUD + generate/cancel + create-from-invoice for E-Way Bills. The E-Way Bill
 * number and validity are produced by the pure ewayCalculator (mock, no GSTN
 * call). All responses are { success, ... }.
 */

const prisma = require('../config/database');
const { computeValidUpto, generateEwbNumber } = require('../utils/ewayCalculator');

const VALID_MODES = ['ROAD', 'RAIL', 'AIR', 'SHIP'];
const VALID_STATUSES = ['DRAFT', 'GENERATED', 'CANCELLED'];

function normalizeMode(mode) {
  const m = String(mode || 'ROAD').toUpperCase();
  return VALID_MODES.includes(m) ? m : 'ROAD';
}

function toDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * List E-Way Bills (search + pagination + status filter).
 */
async function listEwayBills(businessId, options = {}) {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const where = { businessId, isActive: true };
  if (options.status) {
    where.status = String(options.status).toUpperCase();
  }
  if (options.search) {
    where.OR = [
      { docNumber: { contains: options.search, mode: 'insensitive' } },
      { ewbNumber: { contains: options.search, mode: 'insensitive' } },
      { toPlace: { contains: options.search, mode: 'insensitive' } },
      { fromPlace: { contains: options.search, mode: 'insensitive' } }
    ];
  }

  const [ewayBills, total] = await Promise.all([
    prisma.eWayBill.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.eWayBill.count({ where })
  ]);

  return {
    success: true,
    ewayBills,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
}

/**
 * Create a new E-Way Bill (DRAFT by default).
 */
async function createEwayBill(businessId, data) {
  const {
    invoiceId,
    docNumber,
    docDate,
    fromPlace,
    fromState,
    toPlace,
    toState,
    distanceKm,
    transporterName,
    transporterId,
    vehicleNumber,
    transportMode,
    value,
    status
  } = data;

  if (!docNumber) throw new Error('Missing required field: docNumber');
  if (!fromPlace || !fromState) throw new Error('Missing required field: fromPlace/fromState');
  if (!toPlace || !toState) throw new Error('Missing required field: toPlace/toState');
  if (value === undefined || value === null || value === '') {
    throw new Error('Missing required field: value');
  }

  const requestedStatus = status ? String(status).toUpperCase() : 'DRAFT';
  if (!VALID_STATUSES.includes(requestedStatus)) {
    throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const ewayBill = await prisma.eWayBill.create({
    data: {
      businessId,
      invoiceId: invoiceId || null,
      docNumber,
      docDate: toDateOrNull(docDate) || new Date(),
      fromPlace,
      fromState,
      toPlace,
      toState,
      distanceKm: parseInt(distanceKm, 10) || 0,
      transporterName: transporterName || null,
      transporterId: transporterId || null,
      vehicleNumber: vehicleNumber || null,
      transportMode: normalizeMode(transportMode),
      value,
      status: requestedStatus
    }
  });

  return { success: true, message: 'E-Way Bill created successfully', ewayBill };
}

async function getEwayBillById(id, businessId) {
  const ewayBill = await prisma.eWayBill.findFirst({ where: { id, businessId, isActive: true } });
  if (!ewayBill) throw new Error('E-Way Bill not found');
  return { success: true, ewayBill };
}

async function updateEwayBill(id, businessId, data) {
  const existing = await prisma.eWayBill.findFirst({ where: { id, businessId, isActive: true } });
  if (!existing) throw new Error('E-Way Bill not found');

  const allowed = [
    'docNumber', 'fromPlace', 'fromState', 'toPlace', 'toState',
    'transporterName', 'transporterId', 'vehicleNumber'
  ];
  const updateData = {};
  for (const field of allowed) {
    if (data[field] !== undefined) {
      updateData[field] = data[field] === '' ? null : data[field];
    }
  }
  if (data.docDate !== undefined) updateData.docDate = toDateOrNull(data.docDate) || existing.docDate;
  if (data.distanceKm !== undefined) updateData.distanceKm = parseInt(data.distanceKm, 10) || 0;
  if (data.transportMode !== undefined) updateData.transportMode = normalizeMode(data.transportMode);
  if (data.value !== undefined && data.value !== null && data.value !== '') updateData.value = data.value;

  const ewayBill = await prisma.eWayBill.update({ where: { id }, data: updateData });
  return { success: true, message: 'E-Way Bill updated successfully', ewayBill };
}

async function deleteEwayBill(id, businessId) {
  const existing = await prisma.eWayBill.findFirst({ where: { id, businessId, isActive: true } });
  if (!existing) throw new Error('E-Way Bill not found');

  await prisma.eWayBill.update({
    where: { id },
    data: { isActive: false, deletedAt: new Date() }
  });
  return { success: true, message: 'E-Way Bill deleted successfully' };
}

/**
 * Generate (mock) the E-Way Bill: assign a 12-digit number + validUpto + status.
 */
async function generateEwayBill(id, businessId) {
  const existing = await prisma.eWayBill.findFirst({ where: { id, businessId, isActive: true } });
  if (!existing) throw new Error('E-Way Bill not found');
  if (existing.status === 'CANCELLED') {
    throw new Error('Invalid operation: cannot generate a cancelled E-Way Bill');
  }

  const now = new Date();
  const ewbNumber = generateEwbNumber(`${existing.id}-${now.getTime()}`);
  const validUpto = computeValidUpto(existing.distanceKm, now);

  const ewayBill = await prisma.eWayBill.update({
    where: { id },
    data: { ewbNumber, validUpto, status: 'GENERATED' }
  });
  return { success: true, message: 'E-Way Bill generated successfully', ewayBill };
}

async function cancelEwayBill(id, businessId) {
  const existing = await prisma.eWayBill.findFirst({ where: { id, businessId, isActive: true } });
  if (!existing) throw new Error('E-Way Bill not found');

  const ewayBill = await prisma.eWayBill.update({
    where: { id },
    data: { status: 'CANCELLED' }
  });
  return { success: true, message: 'E-Way Bill cancelled successfully', ewayBill };
}

/**
 * Create a DRAFT E-Way Bill prefilled from an invoice.
 */
async function createFromInvoice(invoiceId, businessId) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, businessId, isActive: true },
    include: { business: true, customer: true }
  });
  if (!invoice) throw new Error('Invoice not found');

  const business = invoice.business;
  const customer = invoice.customer;

  const ewayBill = await prisma.eWayBill.create({
    data: {
      businessId,
      invoiceId: invoice.id,
      docNumber: invoice.invoiceNumber,
      docDate: invoice.invoiceDate,
      fromPlace: business.city,
      fromState: business.state,
      toPlace: customer.city,
      toState: customer.state,
      distanceKm: 0,
      transportMode: 'ROAD',
      value: invoice.totalAmount,
      status: 'DRAFT'
    }
  });

  return { success: true, message: 'Draft E-Way Bill created from invoice', ewayBill };
}

module.exports = {
  VALID_MODES,
  VALID_STATUSES,
  listEwayBills,
  createEwayBill,
  getEwayBillById,
  updateEwayBill,
  deleteEwayBill,
  generateEwayBill,
  cancelEwayBill,
  createFromInvoice
};
