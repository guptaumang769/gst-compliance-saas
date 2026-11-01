/**
 * GST Calculator — Jest unit tests (pure, no DB).
 * Assertions ported from the legacy console script (tests/integration/gst-calculator.test.js).
 */

const {
  calculateItemGST,
  calculateInvoiceGST,
  getTransactionType,
  isValidGSTRate
} = require('../../src/services/gstCalculator');

describe('calculateItemGST', () => {
  test('intra-state splits into CGST + SGST', () => {
    const r = calculateItemGST({ taxableAmount: 10000, gstRate: 18, sellerStateCode: '27', buyerStateCode: '27', invoiceType: 'b2b' });
    expect(r.cgstAmount).toBe(900);
    expect(r.sgstAmount).toBe(900);
    expect(r.igstAmount).toBe(0);
    expect(r.totalTaxAmount).toBe(1800);
    expect(r.totalAmount).toBe(11800);
    expect(r.taxType).toBe('CGST+SGST');
  });

  test('inter-state uses IGST', () => {
    const r = calculateItemGST({ taxableAmount: 10000, gstRate: 18, sellerStateCode: '27', buyerStateCode: '29', invoiceType: 'b2b' });
    expect(r.cgstAmount).toBe(0);
    expect(r.sgstAmount).toBe(0);
    expect(r.igstAmount).toBe(1800);
    expect(r.taxType).toBe('IGST');
  });

  test('various rates', () => {
    expect(calculateItemGST({ taxableAmount: 1000, gstRate: 5, sellerStateCode: '27', buyerStateCode: '27' }).totalTaxAmount).toBe(50);
    expect(calculateItemGST({ taxableAmount: 100000, gstRate: 0.25, sellerStateCode: '27', buyerStateCode: '27' }).totalTaxAmount).toBe(250);
    expect(calculateItemGST({ taxableAmount: 1000, gstRate: 3, sellerStateCode: '27', buyerStateCode: '27' }).totalTaxAmount).toBe(30);
    expect(calculateItemGST({ taxableAmount: 1000, gstRate: 40, sellerStateCode: '27', buyerStateCode: '27' }).totalTaxAmount).toBe(400);
  });

  test('export is zero-rated', () => {
    const r = calculateItemGST({ taxableAmount: 10000, gstRate: 0, sellerStateCode: '27', buyerStateCode: '96', invoiceType: 'export' });
    expect(r.totalTaxAmount).toBe(0);
    expect(r.totalAmount).toBe(10000);
  });

  test('with cess', () => {
    const r = calculateItemGST({ taxableAmount: 10000, gstRate: 40, sellerStateCode: '27', buyerStateCode: '27', cessRate: 12 });
    expect(r.cessAmount).toBe(1200);
    expect(r.totalTaxAmount).toBe(5200);
  });
});

describe('calculateInvoiceGST', () => {
  test('multi-item intra-state totals', () => {
    const r = calculateInvoiceGST({
      items: [
        { itemName: 'Laptop', quantity: 2, unitPrice: 50000, gstRate: 18 },
        { itemName: 'Mouse', quantity: 5, unitPrice: 500, gstRate: 18 },
        { itemName: 'Keyboard', quantity: 3, unitPrice: 1500, gstRate: 18 }
      ],
      sellerStateCode: '27', buyerStateCode: '27', invoiceType: 'b2b', discountAmount: 0
    });
    expect(r.subtotal).toBe(107000);
    expect(r.totalTaxAmount).toBe(19260);
    expect(r.cgstAmount).toBe(9630);
    expect(r.sgstAmount).toBe(9630);
    expect(r.totalAmount).toBe(126260);
  });
});

describe('getTransactionType', () => {
  test('intra-state', () => {
    const r = getTransactionType('27', '27');
    expect(r.type).toBe('intra-state');
    expect(r.taxType).toBe('CGST+SGST');
    expect(r.isIntraState).toBe(true);
  });
  test('inter-state', () => {
    const r = getTransactionType('27', '29');
    expect(r.type).toBe('inter-state');
    expect(r.taxType).toBe('IGST');
    expect(r.isInterState).toBe(true);
  });
});

describe('isValidGSTRate (2026 structure)', () => {
  test('valid rates', () => {
    [0, 0.25, 3, 5, 18, 40].forEach((rate) => expect(isValidGSTRate(rate)).toBe(true));
  });
  test('invalid / abolished rates', () => {
    [12, 28, 10, 15].forEach((rate) => expect(isValidGSTRate(rate)).toBe(false));
  });
});
