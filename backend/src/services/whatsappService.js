/**
 * WhatsApp Service (Phase 3: WhatsApp)
 *
 * Builds a click-to-chat wa.me link for an invoice using the customer's phone
 * and a text summary. No credentials required (uses the public wa.me scheme).
 * See utils/whatsappLink.js for the pure link builder and how to swap in the
 * real WhatsApp Business Cloud API.
 */

const prisma = require('../config/database');
const { buildWhatsappLink, buildInvoiceSummaryText } = require('../utils/whatsappLink');

async function getInvoiceLink(invoiceId, businessId) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, businessId, isActive: true },
    include: { business: true, customer: true }
  });
  if (!invoice) throw new Error('Invoice not found');

  const text = buildInvoiceSummaryText({
    businessName: invoice.business.businessName,
    invoiceNumber: invoice.invoiceNumber,
    total: invoice.totalAmount,
    dueDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().slice(0, 10) : null
  });

  const url = buildWhatsappLink({ phone: invoice.customer.phone, text });

  return { success: true, url };
}

module.exports = { getInvoiceLink };
