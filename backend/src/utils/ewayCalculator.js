/**
 * E-Way Bill Calculator (pure, DB-free)
 *
 * Pure helpers for E-Way Bill validity + number generation so they can be
 * unit-tested without a database. Imported by ewayBillService.
 *
 * GST rule (simplified): validity is 1 day per 200 km (or part thereof), with
 * a minimum of 1 day, measured from the generation date.
 */

/**
 * Number of validity days for a given distance.
 * 1 day per 200 km (rounded up), minimum 1 day.
 *
 * @param {number} distanceKm
 * @returns {number} whole days (>= 1)
 */
function computeValidityDays(distanceKm) {
  const km = Number(distanceKm);
  if (!Number.isFinite(km) || km <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(km / 200));
}

/**
 * Compute the validUpto date given a distance and a base (generation) date.
 * Returns a new Date; does not mutate the input.
 *
 * @param {number} distanceKm
 * @param {Date|string|number} [fromDate=new Date()]
 * @returns {Date}
 */
function computeValidUpto(distanceKm, fromDate = new Date()) {
  const base = fromDate instanceof Date ? new Date(fromDate.getTime()) : new Date(fromDate);
  const days = computeValidityDays(distanceKm);
  const result = new Date(base.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Generate a MOCK 12-digit E-Way Bill number.
 *
 * Deterministic when a seed is supplied (used by tests); otherwise derives a
 * pseudo-random 12-digit string from the current time. Always returns exactly
 * 12 numeric characters.
 *
 * @param {number|string} [seed]
 * @returns {string} 12-digit numeric string
 */
function generateEwbNumber(seed) {
  let basis;
  if (seed !== undefined && seed !== null) {
    // Deterministic: fold the seed into a 12-digit space.
    const n = Math.abs(hashToInt(String(seed)));
    basis = n.toString();
  } else {
    basis = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  // Left-pad / truncate to exactly 12 digits.
  const digitsOnly = basis.replace(/\D/g, '');
  const padded = (digitsOnly + '000000000000').slice(0, 12);
  return padded;
}

/**
 * Small deterministic string hash (djb2-ish) -> 32-bit int.
 */
function hashToInt(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

module.exports = {
  computeValidityDays,
  computeValidUpto,
  generateEwbNumber
};
