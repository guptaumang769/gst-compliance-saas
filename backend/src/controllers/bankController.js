/**
 * Bank Reconciliation Controller (Phase 3: Bank Reconciliation)
 */

const bankService = require('../services/bankService');
const auditService = require('../services/auditService');

async function resolveBusiness(req, res) {
  const prisma = require('../config/database');
  const business = await prisma.business.findFirst({
    where: { userId: req.user.userId, isActive: true }
  });
  if (!business) {
    res.status(404).json({ success: false, error: 'No active business found' });
    return null;
  }
  return business;
}

function handleError(res, error, fallback) {
  console.error(`${fallback}:`, error);
  if (error.message && error.message.includes('not found')) {
    return res.status(404).json({ success: false, error: error.message });
  }
  if (error.message && (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('No valid'))) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.status(500).json({ success: false, error: fallback });
}

/**
 * POST /api/bank/statements
 * Accepts either multipart CSV (field 'file') OR JSON { name, rows:[...] }.
 */
async function createStatement(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;

    const params = { name: req.body.name };
    if (req.file && req.file.buffer) {
      params.csvText = req.file.buffer.toString('utf-8');
      if (!params.name) params.name = req.file.originalname;
    } else if (req.body.rows) {
      params.rows = req.body.rows;
    }

    const result = await bankService.createStatement(business.id, params);
    auditService.logAudit({
      businessId: business.id, userId: req.user.userId,
      action: 'import', entityType: 'bank_statement', entityId: result.statement.id,
      details: { created: result.created }
    }).catch(() => {});
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to import bank statement');
  }
}

async function getStatements(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await bankService.listStatements(business.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to fetch bank statements');
  }
}

async function getTransactions(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await bankService.listTransactions(business.id, {
      status: req.query.status, statementId: req.query.statementId
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to fetch bank transactions');
  }
}

async function reconcile(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await bankService.reconcile(business.id, { statementId: req.body.statementId });
    auditService.logAudit({
      businessId: business.id, userId: req.user.userId,
      action: 'reconcile', entityType: 'bank_transaction',
      details: { matched: result.matched }
    }).catch(() => {});
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to reconcile transactions');
  }
}

async function updateTransaction(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await bankService.updateTransaction(req.params.id, business.id, req.body);
    auditService.logAudit({
      businessId: business.id, userId: req.user.userId,
      action: 'update', entityType: 'bank_transaction', entityId: req.params.id
    }).catch(() => {});
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to update bank transaction');
  }
}

async function getSummary(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await bankService.getSummary(business.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, 'Failed to fetch bank summary');
  }
}

module.exports = {
  createStatement,
  getStatements,
  getTransactions,
  reconcile,
  updateTransaction,
  getSummary
};
