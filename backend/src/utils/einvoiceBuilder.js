/**
 * E-Invoice Payload + IRN Builder (pure, DB-free)
 *
 * Builds the standard e-invoice JSON payload and computes a deterministic mock
 * IRN. Kept DB-free so IRN determinism and payload shape are unit-testable.
 *
 * The IRN is computed as the SHA-256 hex of (supplierGstin + invoiceNumber + fy),
 * mirroring the uniqueness contract of a real GSTN IRP (which derives the IRN
 * from GSTIN + Doc Type + Doc Number + FY). Swap eInvoiceProvider.generateIRN
 * for a real IRP/GSP call to obtain a government-signed IRN + QR.
 */

const crypto = require('crypto');

/**
 * Financial year string (India: April -> March), e.g. "2025-26".
 *
 * @param {Date|string|number} date
 * @returns {string}
 */
function getFinancialYear(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-based; Jan = 0, April = 3
  const startYear = month >= 3 ? year : year - 1;
  const endYear = (startYear + 1) % 100;
  return `${startYear}-${String(endYear).padStart(2, '0')}`;
}

/**
 * Compute a deterministic mock IRN.
 *
 * @param {string} gstin - supplier GSTIN
 * @param {string} invoiceNumber
 * @param {string} fy - financial year string
 * @returns {string} 64-char sha256 hex
 */
function computeIRN(gstin, invoiceNumber, fy) {
  const basis = `${gstin || ''}${invoiceNumber || ''}${fy || ''}`;
  return crypto.createHash('sha256').update(basis).digest('hex');
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

/**
 * Build the standard e-invoice JSON payload (schema 1.1 style, simplified).
 *
 * @param {Object} params
 * @param {Object} params.business - seller
 * @param {Object} params.customer - buyer
 * @param {Object} params.invoice - invoice header
 * @param {Array<Object>} params.items - invoice line items
 * @returns {Object} payload
 */
function buildEInvoicePayload({ business, customer, invoice, items = [] }) {
  const b = business || {};
  const c = customer || {};
  const inv = invoice || {};

  const itemList = items.map((it, idx) => ({
    SlNo: String(idx + 1),
    PrdDesc: it.itemName || it.description || 'Item',
    HsnCd: it.hsnCode || it.sacCode || '',
    Qty: Number(it.quantity || 0),
    Unit: it.unit || 'NOS',
    UnitPrice: round2(it.unitPrice || 0),
    TotAmt: round2(it.taxableAmount || 0),
    AssAmt: round2(it.taxableAmount || 0),
    GstRt: Number(it.gstRate || 0),
    CgstAmt: round2(it.cgstAmount || 0),
    SgstAmt: round2(it.sgstAmount || 0),
    IgstAmt: round2(it.igstAmount || 0),
    CesAmt: round2(it.cessAmount || 0),
    TotItemVal: round2(it.totalAmount || 0)
  }));

  return {
    Version: '1.1',
    TranDtls: {
      TaxSch: 'GST',
      SupTyp: (inv.invoiceType || 'b2b').toUpperCase().includes('EXPORT') ? 'EXPWOP' : 'B2B',
      RegRev: inv.reverseCharge ? 'Y' : 'N'
    },
    DocDtls: {
      Typ: 'INV',
      No: inv.invoiceNumber || '',
      Dt: formatDocDate(inv.invoiceDate)
    },
    SellerDtls: {
      Gstin: b.gstin || '',
      LglNm: b.businessName || '',
      Addr1: b.addressLine1 || '',
      Loc: b.city || '',
      Pin: b.pincode || '',
      Stcd: b.stateCode || ''
    },
    BuyerDtls: {
      Gstin: c.gstin || 'URP',
      LglNm: c.customerName || '',
      Pos: inv.buyerStateCode || c.stateCode || '',
      Addr1: c.billingAddress || '',
      Loc: c.city || '',
      Pin: c.pincode || '',
      Stcd: c.stateCode || ''
    },
    ItemList: itemList,
    ValDtls: {
      AssVal: round2(inv.taxableAmount || 0),
      CgstVal: round2(inv.cgstAmount || 0),
      SgstVal: round2(inv.sgstAmount || 0),
      IgstVal: round2(inv.igstAmount || 0),
      CesVal: round2(inv.cessAmount || 0),
      TotInvVal: round2(inv.totalAmount || 0)
    }
  };
}

/**
 * Build the signed-QR data string (the payload encoded into the e-invoice QR).
 * Real IRPs return a JWT signed by the government; here we build the canonical
 * pipe-delimited data that a QR would carry.
 *
 * @param {Object} params
 * @returns {string}
 */
function buildSignedQrString({ sellerGstin, buyerGstin, invoiceNumber, invoiceDate, totalValue, itemCount, mainHsn, irn }) {
  return [
    sellerGstin || '',
    buyerGstin || 'URP',
    invoiceNumber || '',
    formatDocDate(invoiceDate),
    round2(totalValue || 0),
    itemCount || 0,
    mainHsn || '',
    irn || ''
  ].join('|');
}

/**
 * Format a date as DD/MM/YYYY (e-invoice DocDtls.Dt format).
 */
function formatDocDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

module.exports = {
  getFinancialYear,
  computeIRN,
  buildEInvoicePayload,
  buildSignedQrString,
  formatDocDate
};
