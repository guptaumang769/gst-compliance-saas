/**
 * Invoice Number Format Helpers (pure, no DB)
 *
 * Supported format tokens:
 *   {PREFIX} {YYYY} {YY} {MM} {SEQ}
 *
 * Kept dependency-free so it can be unit tested without a database.
 */

const DEFAULT_PREFIX = 'INV';
const DEFAULT_FORMAT = '{PREFIX}-{YYYY}{MM}-{SEQ}';
const DEFAULT_SEQ_PADDING = 4;

/**
 * Replace the non-sequence tokens of a format fragment.
 *
 * @param {string} fragment - part of the format string
 * @param {string} prefix - business prefix
 * @param {Date} date - reference date
 * @returns {string}
 */
function replaceTokens(fragment, prefix, date) {
  const d = date || new Date();
  const yyyy = String(d.getFullYear());
  const yy = yyyy.slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');

  return (fragment || '')
    .replace(/\{PREFIX\}/g, prefix || DEFAULT_PREFIX)
    .replace(/\{YYYY\}/g, yyyy)
    .replace(/\{YY\}/g, yy)
    .replace(/\{MM\}/g, mm);
}

/**
 * Build a full invoice number from a format and its components.
 *
 * @param {string} format - format string with tokens
 * @param {Object} opts
 * @param {string} opts.prefix - business prefix
 * @param {Date} [opts.date] - reference date (defaults to now)
 * @param {number} opts.seq - sequence number
 * @param {number} [opts.seqPadding] - zero-pad width for {SEQ}
 * @returns {string} generated invoice number
 */
function buildInvoiceNumber(format, { prefix, date, seq, seqPadding = DEFAULT_SEQ_PADDING } = {}) {
  const usedFormat = format || DEFAULT_FORMAT;
  const seqStr = String(seq).padStart(seqPadding, '0');
  return replaceTokens(usedFormat, prefix, date).replace(/\{SEQ\}/g, seqStr);
}

module.exports = {
  replaceTokens,
  buildInvoiceNumber,
  DEFAULT_PREFIX,
  DEFAULT_FORMAT,
  DEFAULT_SEQ_PADDING
};
