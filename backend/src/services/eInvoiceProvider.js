/**
 * E-Invoice Provider (MOCK IRP/GSP)
 * ============================================================================
 * This module simulates a call to the GSTN Invoice Registration Portal (IRP).
 *
 * In production, replace `generateIRN` with a real IRP/GSP integration:
 *   1. Authenticate with your GSP (e.g. obtain an auth token / app key + secret).
 *   2. Build the e-invoice JSON per the current GSTN schema (schema 1.1) — the
 *      `buildEInvoicePayload` helper already produces this shape.
 *   3. POST the payload to the GSP's /einvoice/generate endpoint over TLS.
 *   4. The IRP responds with the government-signed IRN, AckNo, AckDt and a
 *      signed QR code (a JWT). Persist those verbatim instead of the mock values.
 *   5. Implement `cancelIRN(irn, reason)` against the IRP's /einvoice/cancel.
 *
 * The mock below computes a deterministic IRN = sha256(gstin + invoiceNumber + fy)
 * so the same invoice always yields the same IRN, and generates a QR data URL
 * from the canonical signed-QR data string using the `qrcode` library.
 * ============================================================================
 */

const QRCode = require('qrcode');
const {
  getFinancialYear,
  computeIRN,
  buildEInvoicePayload,
  buildSignedQrString
} = require('../utils/einvoiceBuilder');

/**
 * Generate a (mock) IRN + signed QR for an invoice.
 *
 * @param {Object} params
 * @param {Object} params.business - seller business
 * @param {Object} params.customer - buyer customer
 * @param {Object} params.invoice - invoice header
 * @param {Array<Object>} params.items - invoice line items
 * @returns {Promise<Object>} { irn, ackNo, ackDate, signedQrCode, qrImageDataUrl, payload }
 */
async function generateIRN({ business, customer, invoice, items = [] }) {
  const payload = buildEInvoicePayload({ business, customer, invoice, items });

  const fy = getFinancialYear(invoice.invoiceDate);
  const irn = computeIRN(business.gstin, invoice.invoiceNumber, fy);

  const now = new Date();
  const ackNo = String(now.getTime());
  const ackDate = now;

  const mainItem = items[0] || {};
  const signedQrCode = buildSignedQrString({
    sellerGstin: business.gstin,
    buyerGstin: customer.gstin || 'URP',
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    totalValue: invoice.totalAmount,
    itemCount: items.length,
    mainHsn: mainItem.hsnCode || mainItem.sacCode || '',
    irn
  });

  let qrImageDataUrl = null;
  try {
    qrImageDataUrl = await QRCode.toDataURL(signedQrCode, { margin: 1, width: 256 });
  } catch (err) {
    // Never let QR image generation break IRN issuance.
    console.error('[eInvoiceProvider] QR generation failed:', err.message);
  }

  return { irn, ackNo, ackDate, signedQrCode, qrImageDataUrl, payload };
}

/**
 * Cancel an IRN (mock). A real implementation would call the IRP cancel API.
 */
async function cancelIRN(irn, reason = 'Cancelled by taxpayer') {
  return { irn, cancelled: true, reason, cancelledAt: new Date() };
}

module.exports = {
  generateIRN,
  cancelIRN
};
