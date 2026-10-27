/**
 * CSV Serializer Utility
 * Small dependency-free CSV serializer for report exports.
 */

/**
 * Escape a single CSV field value.
 */
function escapeField(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of row objects to a CSV string.
 *
 * @param {Array<Object>} rows - data rows
 * @param {Array<{key: string, header: string}>} columns - column definitions
 * @returns {string} CSV text
 */
function toCSV(rows, columns) {
  if (!Array.isArray(columns) || columns.length === 0) {
    return '';
  }

  const headerLine = columns.map((c) => escapeField(c.header)).join(',');
  const lines = (rows || []).map((row) =>
    columns.map((c) => escapeField(row[c.key])).join(',')
  );

  return [headerLine, ...lines].join('\r\n');
}

module.exports = {
  toCSV,
  escapeField
};
