/**
 * Bank Reconciliation Matcher (pure, DB-free)
 *
 * Pure auto-match decision logic used by bankService. A bank transaction is
 * matched to a candidate document (Invoice for CREDIT, Purchase for DEBIT)
 * when the amounts are equal (within a small epsilon) and the dates fall
 * within +/- toleranceDays of each other.
 */

const AMOUNT_EPSILON = 0.01;
const DEFAULT_TOLERANCE_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Absolute difference between two dates in whole days.
 */
function daysBetween(a, b) {
  const da = a instanceof Date ? a : new Date(a);
  const db = b instanceof Date ? b : new Date(b);
  return Math.abs(da.getTime() - db.getTime()) / MS_PER_DAY;
}

/**
 * Whether two amounts are considered equal for matching purposes.
 */
function amountsEqual(a, b) {
  return Math.abs(Number(a) - Number(b)) <= AMOUNT_EPSILON;
}

/**
 * Find the best matching candidate for a transaction.
 *
 * @param {Object} txn - { amount, date }
 * @param {Array<Object>} candidates - each { id, amount, date }
 * @param {number} [toleranceDays=7]
 * @returns {Object|null} the matched candidate (with dayDiff) or null
 */
function findMatch(txn, candidates = [], toleranceDays = DEFAULT_TOLERANCE_DAYS) {
  if (!txn || !Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  let best = null;
  for (const c of candidates) {
    if (!amountsEqual(txn.amount, c.amount)) {
      continue;
    }
    const dayDiff = daysBetween(txn.date, c.date);
    if (dayDiff <= toleranceDays) {
      if (best === null || dayDiff < best.dayDiff) {
        best = { ...c, dayDiff };
      }
    }
  }
  return best;
}

/**
 * Decide the match result for a transaction.
 * CREDIT transactions match against invoices; DEBIT against purchases.
 *
 * @param {Object} txn - { amount, date, type }
 * @param {Object} pools - { invoices:[...], purchases:[...] }
 * @param {number} [toleranceDays=7]
 * @returns {Object} { matched, matchedType, matchedId }
 */
function decideMatch(txn, pools = {}, toleranceDays = DEFAULT_TOLERANCE_DAYS) {
  const type = String(txn.type || '').toUpperCase();
  const isCredit = type === 'CREDIT';
  const candidates = isCredit ? (pools.invoices || []) : (pools.purchases || []);
  const matchedType = isCredit ? 'invoice' : 'purchase';

  const match = findMatch(txn, candidates, toleranceDays);
  if (match) {
    return { matched: true, matchedType, matchedId: match.id };
  }
  return { matched: false, matchedType: null, matchedId: null };
}

module.exports = {
  findMatch,
  decideMatch,
  daysBetween,
  amountsEqual,
  DEFAULT_TOLERANCE_DAYS
};
