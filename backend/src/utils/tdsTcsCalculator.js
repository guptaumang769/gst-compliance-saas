/**
 * TDS/TCS Calculator (pure, DB-free)
 *
 * Pure helpers for computing TDS/TCS amounts and summarising a set of entries.
 * Imported by tdsTcsService so the math is unit-testable without a database.
 */

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

/**
 * Compute the TDS/TCS amount.
 *
 * If an explicit `amount` is supplied (non-empty), it is used as-is (rounded).
 * Otherwise the amount is derived as taxableAmount * rate / 100.
 *
 * @param {Object} params
 * @param {number} params.taxableAmount
 * @param {number} params.rate - percentage rate
 * @param {number} [params.amount] - optional explicit amount
 * @returns {number} amount rounded to 2 decimals
 */
function computeTdsTcsAmount({ taxableAmount, rate, amount } = {}) {
  if (amount !== undefined && amount !== null && amount !== '') {
    const explicit = Number(amount);
    if (Number.isFinite(explicit)) {
      return round2(explicit);
    }
  }

  const taxable = Number(taxableAmount);
  const pct = Number(rate);
  if (!Number.isFinite(taxable) || !Number.isFinite(pct)) {
    return 0;
  }
  return round2((taxable * pct) / 100);
}

/**
 * Normalise a type string to TDS or TCS.
 */
function normalizeType(type) {
  const t = String(type || '').toUpperCase();
  return t === 'TCS' ? 'TCS' : 'TDS';
}

/**
 * Summarise entries into totals by type.
 *
 * @param {Array<Object>} entries - each with { type, taxableAmount, amount }
 * @returns {Object} { TDS:{count,taxableAmount,amount}, TCS:{...}, totalAmount, totalTaxable }
 */
function summarize(entries = []) {
  const base = () => ({ count: 0, taxableAmount: 0, amount: 0 });
  const summary = { TDS: base(), TCS: base() };

  for (const e of entries) {
    const type = normalizeType(e.type);
    summary[type].count += 1;
    summary[type].taxableAmount = round2(summary[type].taxableAmount + Number(e.taxableAmount || 0));
    summary[type].amount = round2(summary[type].amount + Number(e.amount || 0));
  }

  return {
    ...summary,
    totalTaxable: round2(summary.TDS.taxableAmount + summary.TCS.taxableAmount),
    totalAmount: round2(summary.TDS.amount + summary.TCS.amount)
  };
}

module.exports = {
  computeTdsTcsAmount,
  summarize,
  normalizeType
};
