/**
 * Bank Matcher — Jest unit tests (pure, no DB).
 */

const {
  findMatch,
  decideMatch,
  daysBetween,
  amountsEqual
} = require('../../src/utils/bankMatcher');

describe('helpers', () => {
  test('daysBetween', () => {
    expect(daysBetween('2026-01-10', '2026-01-12')).toBe(2);
  });
  test('amountsEqual within epsilon', () => {
    expect(amountsEqual(1180, 1180.004)).toBe(true);
    expect(amountsEqual(1180, 1181)).toBe(false);
  });
});

describe('findMatch', () => {
  const candidates = [
    { id: 'a', amount: 1180, date: '2026-01-20' },
    { id: 'b', amount: 1180, date: '2026-01-12' },
    { id: 'c', amount: 500, date: '2026-01-11' }
  ];

  test('matches exact amount within tolerance and prefers closest date', () => {
    const m = findMatch({ amount: 1180, date: '2026-01-10' }, candidates, 7);
    expect(m).not.toBeNull();
    expect(m.id).toBe('b'); // 2 days away beats 10 days away
  });

  test('returns null when amount does not match', () => {
    expect(findMatch({ amount: 9999, date: '2026-01-10' }, candidates, 7)).toBeNull();
  });

  test('returns null when outside date tolerance', () => {
    expect(findMatch({ amount: 500, date: '2026-02-20' }, candidates, 7)).toBeNull();
  });
});

describe('decideMatch', () => {
  const pools = {
    invoices: [{ id: 'inv1', amount: 1180, date: '2026-01-12' }],
    purchases: [{ id: 'pur1', amount: 2360, date: '2026-01-09' }]
  };

  test('CREDIT matches an invoice', () => {
    const r = decideMatch({ amount: 1180, date: '2026-01-10', type: 'CREDIT' }, pools);
    expect(r).toEqual({ matched: true, matchedType: 'invoice', matchedId: 'inv1' });
  });

  test('DEBIT matches a purchase', () => {
    const r = decideMatch({ amount: 2360, date: '2026-01-10', type: 'DEBIT' }, pools);
    expect(r).toEqual({ matched: true, matchedType: 'purchase', matchedId: 'pur1' });
  });

  test('no match returns matched:false', () => {
    const r = decideMatch({ amount: 777, date: '2026-01-10', type: 'CREDIT' }, pools);
    expect(r.matched).toBe(false);
    expect(r.matchedId).toBeNull();
  });
});
