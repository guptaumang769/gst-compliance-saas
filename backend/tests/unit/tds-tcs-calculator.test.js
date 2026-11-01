/**
 * TDS/TCS Calculator — Jest unit tests (pure, no DB).
 */

const {
  computeTdsTcsAmount,
  summarize,
  normalizeType
} = require('../../src/utils/tdsTcsCalculator');

describe('computeTdsTcsAmount', () => {
  test('computes amount from taxable * rate / 100 when amount absent', () => {
    expect(computeTdsTcsAmount({ taxableAmount: 100000, rate: 2 })).toBe(2000);
    expect(computeTdsTcsAmount({ taxableAmount: 50000, rate: 1 })).toBe(500);
  });
  test('uses explicit amount when provided', () => {
    expect(computeTdsTcsAmount({ taxableAmount: 100000, rate: 2, amount: 1750 })).toBe(1750);
  });
  test('rounds to 2 decimals', () => {
    expect(computeTdsTcsAmount({ taxableAmount: 3333, rate: 2 })).toBe(66.66);
  });
  test('handles bad input gracefully', () => {
    expect(computeTdsTcsAmount({ taxableAmount: 'x', rate: 'y' })).toBe(0);
  });
});

describe('normalizeType', () => {
  test('normalises to TDS/TCS', () => {
    expect(normalizeType('tcs')).toBe('TCS');
    expect(normalizeType('tds')).toBe('TDS');
    expect(normalizeType('other')).toBe('TDS');
  });
});

describe('summarize', () => {
  test('totals by type', () => {
    const s = summarize([
      { type: 'TDS', taxableAmount: 100000, amount: 2000 },
      { type: 'TDS', taxableAmount: 50000, amount: 1000 },
      { type: 'TCS', taxableAmount: 50000, amount: 500 }
    ]);
    expect(s.TDS.count).toBe(2);
    expect(s.TDS.taxableAmount).toBe(150000);
    expect(s.TDS.amount).toBe(3000);
    expect(s.TCS.count).toBe(1);
    expect(s.totalAmount).toBe(3500);
    expect(s.totalTaxable).toBe(200000);
  });
  test('handles empty input', () => {
    const s = summarize([]);
    expect(s.totalAmount).toBe(0);
    expect(s.TDS.count).toBe(0);
  });
});
