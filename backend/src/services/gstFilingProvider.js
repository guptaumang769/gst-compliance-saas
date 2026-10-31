/**
 * GST Filing Provider (STUB / SIMULATED)
 * ============================================================================
 * Simulates submitting a GST return to the GST Network via a GSP (GST Suvidha
 * Provider). This does NOT contact any government system.
 *
 * To implement real filing:
 *   1. Onboard with a licensed GSP and obtain API credentials.
 *   2. Authenticate the taxpayer session with the GSTN (OTP / API token).
 *   3. Prepare and upload the return JSON (SAVE), then PROCEED-TO-FILE.
 *   4. Sign the return using a Digital Signature Certificate (DSC) or EVC
 *      (Electronic Verification Code / OTP). DSC signing typically happens on
 *      the client via the GST emSigner utility; the signed payload is relayed
 *      through the GSP to the GSTN.
 *   5. Poll the GSTN for the ARN (Acknowledgement Reference Number) and final
 *      filing status, and persist it.
 *
 * The stub below returns status 'SIMULATED' with a random reference id.
 * ============================================================================
 */

const crypto = require('crypto');

function newReferenceId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Simulate filing a return.
 *
 * @param {Object} params - { returnType, returnId }
 * @returns {Object} { status, referenceId, message, submittedAt }
 */
function fileReturn({ returnType, returnId } = {}) {
  const referenceId = newReferenceId();
  const submittedAt = new Date();
  return {
    status: 'SIMULATED',
    referenceId,
    message: `Filing of ${returnType || 'return'}${returnId ? ` (${returnId})` : ''} was simulated successfully. No data was sent to the GST portal.`,
    submittedAt
  };
}

module.exports = {
  fileReturn,
  newReferenceId
};
