/**
 * E-Invoice Service (Phase 3: E-Invoice)
 *
 * Generates/cancels/reads e-invoices (one per invoice). Delegates IRN + QR
 * generation to the eInvoiceProvider (mock IRP). All responses { success, ... }.
 */

const prisma = require('../config/database');
const eInvoiceProvider = require('./eInvoiceProvider');

/**
 * Generate an e-invoice for an invoice. Idempotent: returns the existing
 * (non-cancelled) e-invoice if one already exists.
 */
async function generateForInvoice(invoiceId, businessId) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, businessId, isActive: true },
    include: { business: true, customer: true, items: true }
  });
  if (!invoice) throw new Error('Invoice not found');

  const existing = await prisma.eInvoice.findUnique({ where: { invoiceId } });
  if (existing && existing.status !== 'CANCELLED') {
    return { success: true, message: 'E-Invoice already generated', eInvoice: existing };
  }

  const result = await eInvoiceProvider.generateIRN({
    business: invoice.business,
    customer: invoice.customer,
    invoice,
    items: invoice.items
  });

  const data = {
    businessId,
    invoiceId,
    irn: result.irn,
    ackNo: result.ackNo,
    ackDate: result.ackDate,
    signedQrCode: result.signedQrCode,
    qrImageDataUrl: result.qrImageDataUrl || null,
    payload: result.payload,
    status: 'GENERATED',
    cancelledAt: null
  };

  const eInvoice = existing
    ? await prisma.eInvoice.update({ where: { invoiceId }, data })
    : await prisma.eInvoice.create({ data });

  return { success: true, message: 'E-Invoice generated successfully', eInvoice };
}

async function getByInvoice(invoiceId, businessId) {
  const eInvoice = await prisma.eInvoice.findFirst({ where: { invoiceId, businessId } });
  if (!eInvoice) throw new Error('E-Invoice not found');
  return { success: true, eInvoice };
}

async function cancelForInvoice(invoiceId, businessId) {
  const eInvoice = await prisma.eInvoice.findFirst({ where: { invoiceId, businessId } });
  if (!eInvoice) throw new Error('E-Invoice not found');

  await eInvoiceProvider.cancelIRN(eInvoice.irn);

  const updated = await prisma.eInvoice.update({
    where: { invoiceId },
    data: { status: 'CANCELLED', cancelledAt: new Date() }
  });
  return { success: true, message: 'E-Invoice cancelled successfully', eInvoice: updated };
}

async function listEInvoices(businessId, options = {}) {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const where = { businessId };
  if (options.status) where.status = String(options.status).toUpperCase();

  const [eInvoices, total] = await Promise.all([
    prisma.eInvoice.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.eInvoice.count({ where })
  ]);

  return {
    success: true,
    eInvoices,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
}

module.exports = {
  generateForInvoice,
  getByInvoice,
  cancelForInvoice,
  listEInvoices
};
