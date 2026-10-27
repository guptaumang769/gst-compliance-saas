/**
 * WhatsApp Link Builder (pure, DB-free)
 *
 * Builds a click-to-chat https://wa.me link with a prefilled message. Kept
 * dependency-free so link construction can be unit-tested.
 *
 * To swap for the real WhatsApp Business API: instead of returning a wa.me
 * link, POST a template message to the Cloud API endpoint
 * (https://graph.facebook.com/<version>/<phone-number-id>/messages) with your
 * permanent access token, using an approved message template.
 */

/**
 * Normalise a phone number to digits with a country code.
 * If exactly 10 digits, the default country code is prepended.
 *
 * @param {string} phone
 * @param {string} [defaultCountryCode='91']
 * @returns {string} digits only (may be empty if no digits present)
 */
function normalizePhone(phone, defaultCountryCode = '91') {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) {
    return `${defaultCountryCode}${digits}`;
  }
  return digits;
}

/**
 * Build a wa.me click-to-chat URL.
 *
 * @param {Object} params
 * @param {string} params.phone
 * @param {string} params.text
 * @param {string} [params.defaultCountryCode='91']
 * @returns {string}
 */
function buildWhatsappLink({ phone, text, defaultCountryCode = '91' }) {
  const normalized = normalizePhone(phone, defaultCountryCode);
  const encoded = encodeURIComponent(text || '');
  const base = normalized ? `https://wa.me/${normalized}` : 'https://wa.me/';
  return `${base}?text=${encoded}`;
}

/**
 * Build a concise invoice summary message.
 *
 * @param {Object} params
 * @returns {string}
 */
function buildInvoiceSummaryText({ businessName, invoiceNumber, total, dueDate }) {
  const parts = [];
  if (businessName) parts.push(`Hello, here is your invoice from ${businessName}.`);
  else parts.push('Hello, here is your invoice.');
  if (invoiceNumber) parts.push(`Invoice No: ${invoiceNumber}`);
  if (total !== undefined && total !== null) parts.push(`Total: ₹${Number(total).toFixed(2)}`);
  if (dueDate) parts.push(`Due: ${dueDate}`);
  parts.push('Thank you for your business!');
  return parts.join('\n');
}

module.exports = {
  normalizePhone,
  buildWhatsappLink,
  buildInvoiceSummaryText
};
