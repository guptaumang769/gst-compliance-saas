/**
 * Report Controller
 * Reports & Analytics (Phase 2)
 * Handles HTTP requests for report endpoints. Supports JSON (default) and
 * CSV output (?format=csv) with a downloadable attachment.
 */

const reportService = require('../services/reportService');
const { toCSV } = require('../utils/csvSerializer');

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

/**
 * Send the report as JSON or CSV depending on ?format.
 */
function respond(req, res, reportKey, result) {
  const format = (req.query.format || '').toLowerCase();

  if (format === 'csv') {
    const columns = reportService.CSV_COLUMNS[reportKey] || [];
    const csv = toCSV(result.rows, columns);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${reportKey}.csv"`);
    return res.status(200).send(csv);
  }

  return res.status(200).json(result);
}

function parseOptions(req) {
  return {
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };
}

async function salesRegister(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await reportService.getSalesRegister(business.id, parseOptions(req));
    return respond(req, res, 'sales-register', result);
  } catch (error) {
    console.error('Sales register report error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate sales register' });
  }
}

async function purchaseRegister(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await reportService.getPurchaseRegister(business.id, parseOptions(req));
    return respond(req, res, 'purchase-register', result);
  } catch (error) {
    console.error('Purchase register report error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate purchase register' });
  }
}

async function taxRateSummary(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await reportService.getTaxRateSummary(business.id, parseOptions(req));
    return respond(req, res, 'tax-rate-summary', result);
  } catch (error) {
    console.error('Tax rate summary report error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate tax rate summary' });
  }
}

async function hsnSummary(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await reportService.getHsnSummary(business.id, parseOptions(req));
    return respond(req, res, 'hsn-summary', result);
  } catch (error) {
    console.error('HSN summary report error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate HSN summary' });
  }
}

async function itcAnalysis(req, res) {
  try {
    const business = await resolveBusiness(req, res);
    if (!business) return;
    const result = await reportService.getItcAnalysis(business.id, parseOptions(req));
    return respond(req, res, 'itc-analysis', result);
  } catch (error) {
    console.error('ITC analysis report error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate ITC analysis' });
  }
}

module.exports = {
  salesRegister,
  purchaseRegister,
  taxRateSummary,
  hsnSummary,
  itcAnalysis
};
