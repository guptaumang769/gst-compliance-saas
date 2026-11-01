/**
 * P&L / Financials Calculator — Jest unit tests (pure, no DB).
 */

const {
  computePnl,
  computeBalanceSheet
} = require('../../src/utils/pnlCalculator');

describe('computePnl', () => {
  test('revenue, cogs, profit from taxable amounts', () => {
    const r = computePnl({
      invoices: [{ taxableAmount: 1000 }, { taxableAmount: 2000 }],
      purchases: [{ taxableAmount: 400 }, { taxableAmount: 600 }]
    });
    expect(r.revenue).toBe(3000);
    expect(r.cogs).toBe(1000);
    expect(r.grossProfit).toBe(2000);
    expect(r.netProfit).toBe(2000);
    expect(r.margin).toBeCloseTo(66.67, 2);
  });

  test('rows include a Net Profit line', () => {
    const r = computePnl({ invoices: [{ taxableAmount: 100 }], purchases: [] });
    expect(r.rows.some((row) => row.label === 'Net Profit' && row.amount === 100)).toBe(true);
  });

  test('guards divide-by-zero for margin', () => {
    const r = computePnl({ invoices: [], purchases: [] });
    expect(r.revenue).toBe(0);
    expect(r.margin).toBe(0);
    expect(r.netProfit).toBe(0);
  });
});

describe('computeBalanceSheet', () => {
  test('computes totals and equity', () => {
    const s = computeBalanceSheet({
      receivables: 5000,
      payables: 2000,
      inventoryValue: 3000,
      taxPayable: 500,
      cash: 0
    });
    expect(s.assets.receivables).toBe(5000);
    expect(s.assets.inventoryValue).toBe(3000);
    expect(s.totalAssets).toBe(8000);
    expect(s.totalLiabilities).toBe(2500);
    expect(s.equity).toBe(5500);
  });
});
