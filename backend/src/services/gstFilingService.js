/**
 * GST Filing Service (Phase 3: GST filing STUB)
 *
 * Wraps the (simulated) gstFilingProvider and persists a lightweight
 * GstFilingLog record. Does NOT alter the invoice/GSTReturn filing workflow.
 */

const prisma = require('../config/database');
const gstFilingProvider = require('./gstFilingProvider');

async function fileReturn(businessId, { returnType, returnId } = {}) {
  if (!returnType) throw new Error('Missing required field: returnType');

  const result = gstFilingProvider.fileReturn({ returnType, returnId });

  // Persist a lightweight record (best-effort; never block the response).
  try {
    await prisma.gstFilingLog.create({
      data: {
        businessId,
        returnType,
        returnId: returnId || null,
        referenceId: result.referenceId,
        status: result.status,
        message: result.message,
        submittedAt: result.submittedAt
      }
    });
  } catch (e) {
    console.error('[gstFiling] Failed to persist filing log:', e.message);
  }

  return {
    success: true,
    status: result.status,
    referenceId: result.referenceId,
    message: result.message,
    submittedAt: result.submittedAt
  };
}

async function getStatus(referenceId, businessId) {
  const log = await prisma.gstFilingLog.findFirst({ where: { referenceId, businessId } });
  if (!log) throw new Error('Filing reference not found');

  return {
    success: true,
    status: log.status,
    referenceId: log.referenceId,
    returnType: log.returnType,
    returnId: log.returnId,
    message: log.message,
    submittedAt: log.submittedAt
  };
}

module.exports = { fileReturn, getStatus };
