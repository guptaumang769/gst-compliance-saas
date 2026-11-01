/**
 * Report Builders & CSV Serializer - Unit Tests
 *
 * Tests the pure report row/summary builders and the CSV serializer
 * (no DB required).
 */

const {
  buildSalesRegister,
  buildPurchaseRegister,
  buildTaxRateSummary,
  buildHsnSummary,
  buildItcAnalysis
} = require('../../src/utils/reportBuilders');
const { toCSV } = require('../../src/utils/csvSerializer');

describe('reportBuilders.buildSalesRegister', () => {
  const invoices = [
    {
      invoiceDate: new Date(2026, 0, 10),
      invoiceNumber: 'INV-202601-0001',
      customer: { customerName: 'Sunrise Enterprises' },
      taxableAmount: 1000,
      cgstAmount: 90,
      sgstAmount: 90,
      igstAmount: 0,
      cessAmount: 0,
      totalAmount: 1180
    },
    {
      invoiceDate: new Date(2026, 0, 20),
      invoiceNumber: 'INV-202601-0002',
      customer: { customerName: 'Bengaluru Tech' },
      taxableAmount: 2000,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 360,
      cessAmount: 0,
      totalAmount: 2360
    }
  ];

  test('maps invoices to rows with expected fields', () => {
    const { rows } = buildSalesRegister(invoices);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      date: '2026-01-10',
      invoiceNumber: 'INV-202601-0001',
      customer: 'Sunrise Enterprises',
      taxable: 1000,
      cgst: 90,
      sgst: 90,
      igst: 0,
      cess: 0,
      total: 1180
    });
  });

  test('computes totals across all rows', () => {
    const { totals } = buildSalesRegister(invoices);
    expect(totals.count).toBe(2);
    expect(totals.taxable).toBe(3000);
    expect(totals.igst).toBe(360);
    expect(totals.total).toBe(3540);
  });

  test('handles empty input', () => {
    const { rows, totals } = buildSalesRegister([]);
    expect(rows).toEqual([]);
    expect(totals.count).toBe(0);
    expect(totals.total).toBe(0);
  });
});

describe('reportBuilders.buildPurchaseRegister', () => {
  const purchases = [
    {
      supplierInvoiceDate: new Date(2026, 0, 6),
      supplierInvoiceNumber: 'BILL-1',
      supplier: { supplierName: 'Metro' },
      taxableAmount: 1000,
      cgstAmount: 90,
      sgstAmount: 90,
      igstAmount: 0,
      cessAmount: 0,
      totalAmount: 1180,
      isItcEligible: true,
      itcAmount: 180
    },
    {
      supplierInvoiceDate: new Date(2026, 0, 9),
      supplierInvoiceNumber: 'BILL-2',
      supplier: { supplierName: 'Delhi' },
      taxableAmount: 500,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 25,
      cessAmount: 0,
      totalAmount: 525,
      isItcEligible: false,
      itcAmount: 0
    }
  ];

  test('includes ITC eligible amount and excludes ineligible ITC', () => {
    const { rows, totals } = buildPurchaseRegister(purchases);
    expect(rows[0].itcEligible).toBe(180);
    expect(rows[1].itcEligible).toBe(0);
    expect(totals.itcEligible).toBe(180);
  });
});

describe('reportBuilders.buildTaxRateSummary', () => {
  const items = [
    { gstRate: 18, taxableAmount: 1000, cgstAmount: 90, sgstAmount: 90, igstAmount: 0, cessAmount: 0 },
    { gstRate: 18, taxableAmount: 500, cgstAmount: 0, sgstAmount: 0, igstAmount: 90, cessAmount: 0 },
    { gstRate: 5, taxableAmount: 200, cgstAmount: 5, sgstAmount: 5, igstAmount: 0, cessAmount: 0 }
  ];

  test('groups by GST rate with taxable, tax and count', () => {
    const { rows, totals } = buildTaxRateSummary(items);
    const r18 = rows.find((r) => r.gstRate === 18);
    const r5 = rows.find((r) => r.gstRate === 5);
    expect(r18.taxable).toBe(1500);
    expect(r18.tax).toBe(270);
    expect(r18.count).toBe(2);
    expect(r5.count).toBe(1);
    expect(totals.taxable).toBe(1700);
    expect(totals.count).toBe(3);
  });

  test('rows are sorted ascending by rate', () => {
    const { rows } = buildTaxRateSummary(items);
    expect(rows.map((r) => r.gstRate)).toEqual([5, 18]);
  });
});

describe('reportBuilders.buildHsnSummary', () => {
  const items = [
    { hsnCode: '9617', quantity: 10, taxableAmount: 1000, cgstAmount: 90, sgstAmount: 90 },
    { hsnCode: '9617', quantity: 5, taxableAmount: 500, cgstAmount: 45, sgstAmount: 45 },
    { sacCode: '9983', quantity: 2, taxableAmount: 4000, igstAmount: 720 }
  ];

  test('groups by HSN/SAC with qty, taxable and tax', () => {
    const { rows } = buildHsnSummary(items);
    const bottle = rows.find((r) => r.hsnSac === '9617');
    const service = rows.find((r) => r.hsnSac === '9983');
    expect(bottle.qty).toBe(15);
    expect(bottle.taxable).toBe(1500);
    expect(bottle.tax).toBe(270);
    expect(service.tax).toBe(720);
  });
});

describe('reportBuilders.buildItcAnalysis', () => {
  const purchases = [
    { isItcEligible: true, cgstAmount: 90, sgstAmount: 90, igstAmount: 0, cessAmount: 0 },
    { isItcEligible: false, cgstAmount: 50, sgstAmount: 50, igstAmount: 0, cessAmount: 0 }
  ];
  const invoices = [
    { cgstAmount: 40, sgstAmount: 40, igstAmount: 0, cessAmount: 0 }
  ];

  test('computes available, proxy-utilized (capped by liability) and balance', () => {
    const { rows, totals } = buildItcAnalysis(purchases, invoices);
    const cgst = rows.find((r) => r.taxHead === 'CGST');
    expect(cgst.available).toBe(90); // ineligible purchase excluded
    expect(cgst.utilized).toBe(40); // capped at liability
    expect(cgst.balance).toBe(50);
    expect(totals.available).toBe(180);
    expect(totals.utilized).toBe(80);
    expect(totals.balance).toBe(100);
  });
});

describe('csvSerializer.toCSV', () => {
  const columns = [
    { key: 'date', header: 'Date' },
    { key: 'customer', header: 'Customer' },
    { key: 'total', header: 'Total' }
  ];

  test('produces a header row and data rows', () => {
    const csv = toCSV(
      [{ date: '2026-01-10', customer: 'Sunrise', total: 1180 }],
      columns
    );
    expect(csv).toBe('Date,Customer,Total\r\n2026-01-10,Sunrise,1180');
  });

  test('escapes fields containing commas and quotes', () => {
    const csv = toCSV(
      [{ date: '2026-01-10', customer: 'Acme, "Inc"', total: 100 }],
      columns
    );
    expect(csv).toBe('Date,Customer,Total\r\n2026-01-10,"Acme, ""Inc""",100');
  });

  test('returns empty string when no columns are given', () => {
    expect(toCSV([{ a: 1 }], [])).toBe('');
  });
});
