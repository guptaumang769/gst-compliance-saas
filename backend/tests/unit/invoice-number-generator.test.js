/**
 * Invoice Number Format Generator - Unit Tests
 *
 * Tests the pure invoice-number format builder (no DB required).
 */

const {
  buildInvoiceNumber,
  replaceTokens,
  DEFAULT_FORMAT,
  DEFAULT_PREFIX
} = require('../../src/utils/invoiceNumberFormat');

describe('invoiceNumberFormat.buildInvoiceNumber', () => {
  const date = new Date(2026, 0, 15); // Jan 2026 (month index 0)

  test('reproduces the legacy default format INV-YYYYMM-NNNN', () => {
    const result = buildInvoiceNumber(DEFAULT_FORMAT, {
      prefix: DEFAULT_PREFIX,
      date,
      seq: 1
    });
    expect(result).toBe('INV-202601-0001');
  });

  test('zero-pads the sequence to 4 digits by default', () => {
    const result = buildInvoiceNumber(DEFAULT_FORMAT, { prefix: 'INV', date, seq: 42 });
    expect(result).toBe('INV-202601-0042');
  });

  test('supports a custom prefix', () => {
    const result = buildInvoiceNumber('{PREFIX}/{YYYY}/{SEQ}', {
      prefix: 'ACME',
      date,
      seq: 7
    });
    expect(result).toBe('ACME/2026/0007');
  });

  test('supports {YY} (2-digit year) and {MM} tokens', () => {
    const result = buildInvoiceNumber('{PREFIX}-{YY}{MM}-{SEQ}', {
      prefix: 'INV',
      date,
      seq: 3
    });
    expect(result).toBe('INV-2601-0003');
  });

  test('does not zero-pad sequences longer than the pad width', () => {
    const result = buildInvoiceNumber('{PREFIX}-{SEQ}', { prefix: 'INV', date, seq: 123456 });
    expect(result).toBe('INV-123456');
  });

  test('honours a custom sequence padding width', () => {
    const result = buildInvoiceNumber('{PREFIX}-{SEQ}', {
      prefix: 'INV',
      date,
      seq: 5,
      seqPadding: 6
    });
    expect(result).toBe('INV-000005');
  });

  test('falls back to the default format when none is provided', () => {
    const result = buildInvoiceNumber(undefined, { prefix: 'INV', date, seq: 9 });
    expect(result).toBe('INV-202601-0009');
  });
});

describe('invoiceNumberFormat.replaceTokens', () => {
  const date = new Date(2026, 10, 5); // Nov 2026

  test('replaces all supported non-sequence tokens', () => {
    expect(replaceTokens('{PREFIX}|{YYYY}|{YY}|{MM}', 'BILL', date)).toBe('BILL|2026|26|11');
  });

  test('leaves the {SEQ} token untouched', () => {
    expect(replaceTokens('{PREFIX}-{SEQ}', 'INV', date)).toBe('INV-{SEQ}');
  });
});
