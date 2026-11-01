/**
 * E-Invoice Payload + IRN Builder — Jest unit tests (pure, no DB).
 */

const {
  getFinancialYear,
  computeIRN,
  buildEInvoicePayload,
  buildSignedQrString
} = require('../../src/utils/einvoiceBuilder');

describe('getFinancialYear', () => {
  test('Jan falls in the FY that started the previous April', () => {
    expect(getFinancialYear(new Date(2026, 0, 15))).toBe('2025-26');
  });
  test('April starts a new FY', () => {
    expect(getFinancialYear(new Date(2026, 3, 1))).toBe('2026-27');
  });
});

describe('computeIRN', () => {
  const business = { gstin: '27AABCT1332L1ZM' };
  test('is deterministic (sha256 hex) for same inputs', () => {
    const a = computeIRN(business.gstin, 'INV-1', '2025-26');
    const b = computeIRN(business.gstin, 'INV-1', '2025-26');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
  test('changes when invoice number changes', () => {
    const a = computeIRN(business.gstin, 'INV-1', '2025-26');
    const b = computeIRN(business.gstin, 'INV-2', '2025-26');
    expect(a).not.toBe(b);
  });
});

describe('buildEInvoicePayload', () => {
  const business = { gstin: '27AABCT1332L1ZM', businessName: 'Demo Traders', addressLine1: '101 Park', city: 'Mumbai', pincode: '400069', stateCode: '27' };
  const customer = { gstin: '29AABCB2233C1Z5', customerName: 'Bengaluru Tech', city: 'Bengaluru', pincode: '560001', stateCode: '29', billingAddress: '9 MG Road' };
  const invoice = { invoiceNumber: 'INV-1', invoiceDate: new Date(2026, 0, 15), invoiceType: 'b2b', taxableAmount: 1000, igstAmount: 180, totalAmount: 1180 };
  const items = [{ itemName: 'Widget', hsnCode: '9617', quantity: 2, unit: 'NOS', unitPrice: 500, taxableAmount: 1000, gstRate: 18, igstAmount: 180, totalAmount: 1180 }];

  test('builds a schema-1.1 shaped payload', () => {
    const p = buildEInvoicePayload({ business, customer, invoice, items });
    expect(p.Version).toBe('1.1');
    expect(p.DocDtls.No).toBe('INV-1');
    expect(p.DocDtls.Dt).toBe('15/01/2026');
    expect(p.SellerDtls.Gstin).toBe('27AABCT1332L1ZM');
    expect(p.BuyerDtls.Gstin).toBe('29AABCB2233C1Z5');
    expect(p.ItemList).toHaveLength(1);
    expect(p.ValDtls.TotInvVal).toBe(1180);
  });

  test('unregistered buyer defaults to URP', () => {
    const p = buildEInvoicePayload({ business, customer: { customerName: 'Walk-in' }, invoice, items });
    expect(p.BuyerDtls.Gstin).toBe('URP');
  });
});

describe('buildSignedQrString', () => {
  test('produces a pipe-delimited string with the IRN', () => {
    const s = buildSignedQrString({
      sellerGstin: '27AABCT1332L1ZM',
      buyerGstin: '29AABCB2233C1Z5',
      invoiceNumber: 'INV-1',
      invoiceDate: new Date(2026, 0, 15),
      totalValue: 1180,
      itemCount: 1,
      mainHsn: '9617',
      irn: 'abc123'
    });
    const parts = s.split('|');
    expect(parts[0]).toBe('27AABCT1332L1ZM');
    expect(parts[2]).toBe('INV-1');
    expect(parts[parts.length - 1]).toBe('abc123');
  });
});
