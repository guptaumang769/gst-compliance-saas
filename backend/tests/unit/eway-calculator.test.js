/**
 * E-Way Bill Calculator — Jest unit tests (pure, no DB).
 */

const {
  computeValidityDays,
  computeValidUpto,
  generateEwbNumber
} = require('../../src/utils/ewayCalculator');

describe('computeValidityDays', () => {
  test('minimum 1 day for short/zero distance', () => {
    expect(computeValidityDays(0)).toBe(1);
    expect(computeValidityDays(50)).toBe(1);
    expect(computeValidityDays(200)).toBe(1);
  });
  test('1 day per 200km rounded up', () => {
    expect(computeValidityDays(201)).toBe(2);
    expect(computeValidityDays(400)).toBe(2);
    expect(computeValidityDays(450)).toBe(3);
    expect(computeValidityDays(1000)).toBe(5);
  });
  test('handles invalid input', () => {
    expect(computeValidityDays(-5)).toBe(1);
    expect(computeValidityDays('abc')).toBe(1);
  });
});

describe('computeValidUpto', () => {
  test('adds the correct number of days without mutating input', () => {
    const base = new Date('2026-01-10T10:00:00.000Z');
    const result = computeValidUpto(450, base);
    expect(base.toISOString()).toBe('2026-01-10T10:00:00.000Z'); // not mutated
    const diffDays = Math.round((result.getTime() - base.getTime()) / (24 * 3600 * 1000));
    expect(diffDays).toBe(3);
  });
});

describe('generateEwbNumber', () => {
  test('returns exactly 12 digits', () => {
    const n = generateEwbNumber('some-seed');
    expect(n).toMatch(/^\d{12}$/);
  });
  test('is deterministic for the same seed', () => {
    expect(generateEwbNumber('abc')).toBe(generateEwbNumber('abc'));
  });
  test('differs for different seeds', () => {
    expect(generateEwbNumber('abc')).not.toBe(generateEwbNumber('xyz'));
  });
});
