/**
 * CSV Parser Utility
 *
 * Parses CSV text into an array of row objects keyed by the header row.
 * Prefers the `csv-parse` library; falls back to a small hand-rolled parser
 * if the dependency is unavailable (e.g. blocked corporate registry).
 */

let parseSync = null;
try {
  // eslint-disable-next-line global-require
  parseSync = require('csv-parse/sync').parse;
} catch (e) {
  parseSync = null;
}

/**
 * Hand-rolled RFC-4180-ish CSV line splitter supporting quoted fields.
 */
function splitCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function handRolledParse(text) {
  const normalized = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').filter((l) => l.trim() !== '');
  if (lines.length === 0) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = splitCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    rows.push(row);
  }
  return rows;
}

/**
 * Parse CSV text into an array of objects keyed by the (trimmed) header row.
 *
 * @param {string|Buffer} input
 * @returns {Array<Object>}
 */
function parseCsv(input) {
  const text = Buffer.isBuffer(input) ? input.toString('utf-8') : String(input || '');
  if (!text.trim()) return [];

  if (parseSync) {
    try {
      return parseSync(text, {
        columns: (header) => header.map((h) => String(h).trim()),
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true
      });
    } catch (e) {
      // Fall through to hand-rolled parser on any library error.
    }
  }
  return handRolledParse(text);
}

module.exports = {
  parseCsv,
  splitCsvLine
};
