/**
 * GST Validation Utilities — Jest unit tests (pure, no DB).
 * Ported from the legacy console script.
 */

const {
  validateGSTIN,
  validatePAN,
  extractStateCode,
  extractPAN,
  getStateName,
  getStateCode,
  validateHSNSAC,
  validateGSTRate,
  validateGSTINPANMatch,
  validateGSTINStateMatch
} = require('../../src/utils/gstValidation');

describe('validateGSTIN', () => {
  test('accepts a well-formed GSTIN', () => {
    const r = validateGSTIN('27AABCT1332L1ZM');
    expect(r.valid).toBe(true);
    expect(r.details.stateCode).toBe('27');
    expect(r.details.stateName).toBe('Maharashtra');
  });

  test('rejects wrong length', () => {
    const r = validateGSTIN('27AABCT1332L1Z');
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/15 characters/);
  });

  test('rejects wrong format', () => {
    const r = validateGSTIN('2XAABCT1332L1ZM');
    expect(r.valid).toBe(false);
  });
});

describe('validatePAN', () => {
  test('accepts a valid PAN', () => {
    expect(validatePAN('AABCT1332L').valid).toBe(true);
  });
  test('rejects an invalid PAN', () => {
    expect(validatePAN('ABC123').valid).toBe(false);
  });
});

describe('extractStateCode / extractPAN', () => {
  test('extracts the state code', () => {
    expect(extractStateCode('27AABCT1332L1ZM')).toBe('27');
  });
  test('extracts the embedded PAN', () => {
    expect(extractPAN('27AABCT1332L1ZM')).toBe('AABCT1332L');
  });
});

describe('getStateName / getStateCode', () => {
  test('maps code -> name', () => {
    expect(getStateName('27')).toBe('Maharashtra');
    expect(getStateName('07')).toBe('Delhi');
  });
  test('maps name -> code', () => {
    expect(getStateCode('Maharashtra')).toBe('27');
    expect(getStateCode('Karnataka')).toBe('29');
  });
  test('unknown code returns Unknown', () => {
    expect(getStateName('88')).toBe('Unknown');
  });
});

describe('validateHSNSAC', () => {
  test('valid 4-digit HSN for goods', () => {
    expect(validateHSNSAC('8471', 'goods').valid).toBe(true);
  });
  test('valid 6-digit SAC for services', () => {
    expect(validateHSNSAC('998314', 'services').valid).toBe(true);
  });
  test('invalid short HSN', () => {
    expect(validateHSNSAC('12', 'goods').valid).toBe(false);
  });
});

describe('validateGSTRate', () => {
  test('accepts supported rates', () => {
    [0, 0.25, 3, 5, 12, 18, 28].forEach((rate) => {
      expect(validateGSTRate(rate).valid).toBe(true);
    });
  });
  test('rejects unsupported rates', () => {
    expect(validateGSTRate(15).valid).toBe(false);
  });
});

describe('cross-field validation', () => {
  test('GSTIN/PAN match', () => {
    expect(validateGSTINPANMatch('27AABCT1332L1ZM', 'AABCT1332L').valid).toBe(true);
    expect(validateGSTINPANMatch('27AABCT1332L1ZM', 'ZZZZZ9999Z').valid).toBe(false);
  });
  test('GSTIN/state match', () => {
    expect(validateGSTINStateMatch('27AABCT1332L1ZM', 'Maharashtra').valid).toBe(true);
    expect(validateGSTINStateMatch('27AABCT1332L1ZM', 'Karnataka').valid).toBe(false);
  });
});
