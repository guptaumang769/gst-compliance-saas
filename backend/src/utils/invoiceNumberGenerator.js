/**
 * Invoice Number Generator
 * Week 3-4: Invoice Management
 *
 * Generates unique invoice numbers for a business based on the business's
 * configurable format string.
 *
 * Supported format tokens:
 *   {PREFIX} - business.invoicePrefix (default "INV")
 *   {YYYY}   - 4 digit year (e.g. 2026)
 *   {YY}     - 2 digit year (e.g. 26)
 *   {MM}     - 2 digit month (e.g. 01)
 *   {SEQ}    - zero-padded running sequence number
 *
 * Default format: "{PREFIX}-{YYYY}{MM}-{SEQ}" => e.g. INV-202601-0001
 * This reproduces the previous behaviour exactly, so existing invoices and
 * numbering remain backward compatible.
 */

const prisma = require('../config/database');
const {
  replaceTokens,
  buildInvoiceNumber,
  DEFAULT_PREFIX,
  DEFAULT_FORMAT
} = require('./invoiceNumberFormat');

/**
 * Generate next invoice number for a business.
 * Uses the business's configured format/prefix and derives the next sequence
 * from existing invoices matching the resolved (non-sequence) pattern, so the
 * numbering stays collision-free and backward compatible. `invoiceNextNumber`
 * acts as an optional floor (minimum next sequence) that a business can set.
 *
 * @param {string} businessId - Business ID
 * @returns {Promise<string>} Generated invoice number
 */
async function generateInvoiceNumber(businessId) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    const format = (business && business.invoiceNumberFormat) || DEFAULT_FORMAT;
    const prefix = (business && business.invoicePrefix) || DEFAULT_PREFIX;
    const floor = (business && business.invoiceNextNumber) || 1;
    const now = new Date();

    // Resolve the static portions surrounding the {SEQ} token so we can match
    // existing invoices for this period/format and find the highest sequence.
    const [beforeRaw, afterRaw = ''] = format.split('{SEQ}');
    const before = replaceTokens(beforeRaw, prefix, now);
    const after = replaceTokens(afterRaw, prefix, now);

    const existing = await prisma.invoice.findMany({
      where: {
        businessId,
        invoiceNumber: { startsWith: before }
      },
      select: { invoiceNumber: true }
    });

    let maxSeq = 0;
    for (const { invoiceNumber } of existing) {
      if (after && !invoiceNumber.endsWith(after)) continue;
      const mid = invoiceNumber.slice(
        before.length,
        after ? invoiceNumber.length - after.length : undefined
      );
      const parsed = parseInt(mid, 10);
      if (!Number.isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }

    const seq = Math.max(maxSeq + 1, floor);

    return buildInvoiceNumber(format, { prefix, date: now, seq });
  } catch (error) {
    console.error('Generate invoice number error:', error);
    throw new Error('Failed to generate invoice number');
  }
}

/**
 * Validate invoice number format (legacy default format).
 *
 * @param {string} invoiceNumber - Invoice number to validate
 * @returns {boolean} True if valid
 */
function validateInvoiceNumber(invoiceNumber) {
  // Legacy default format: INV-YYYYMM-NNNN
  const regex = /^INV-\d{6}-\d{4}$/;
  return regex.test(invoiceNumber);
}

/**
 * Parse invoice number to extract components (legacy default format).
 *
 * @param {string} invoiceNumber - Invoice number
 * @returns {Object} Parsed components
 */
function parseInvoiceNumber(invoiceNumber) {
  if (!validateInvoiceNumber(invoiceNumber)) {
    throw new Error('Invalid invoice number format');
  }

  const parts = invoiceNumber.split('-');
  const yearMonth = parts[1];
  const sequence = parseInt(parts[2]);

  return {
    prefix: 'INV',
    year: parseInt(yearMonth.substring(0, 4)),
    month: parseInt(yearMonth.substring(4, 6)),
    sequence,
    full: invoiceNumber
  };
}

module.exports = {
  generateInvoiceNumber,
  validateInvoiceNumber,
  parseInvoiceNumber,
  buildInvoiceNumber,
  replaceTokens,
  DEFAULT_FORMAT,
  DEFAULT_PREFIX
};
