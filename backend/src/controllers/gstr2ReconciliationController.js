/**
 * GSTR-2A/2B Reconciliation Controller
 */

const gstr2ReconciliationService = require('../services/gstr2ReconciliationService');
const prisma = require('../config/database');

async function getBusinessId(userId) {
  const business = await prisma.business.findFirst({
    where: { userId, isActive: true }
  });
  if (!business) {
    throw new Error('No active business found');
  }
  return business.id;
}

async function importSingleEntry(req, res) {
  try {
    const businessId = await getBusinessId(req.user.userId);
    const entry = await gstr2ReconciliationService.importSingleEntry(businessId, req.body);
    res.status(201).json({
      success: true,
      message: 'GSTR-2A/2B entry imported successfully',
      entry
    });
  } catch (error) {
    console.error('Error importing GSTR-2A/2B entry:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

async function importBulkEntries(req, res) {
  try {
    const businessId = await getBusinessId(req.user.userId);
    const { filingPeriod, dataSource, entries } = req.body;

    if (!filingPeriod || !dataSource || !entries || !Array.isArray(entries)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: filingPeriod, dataSource, entries (array)'
      });
    }

    const results = await gstr2ReconciliationService.importBulkEntries(
      businessId,
      filingPeriod,
      dataSource,
      entries
    );

    res.status(201).json({
      success: true,
      message: `Imported ${results.imported} entries, skipped ${results.skipped} duplicates`,
      results
    });
  } catch (error) {
    console.error('Error importing bulk GSTR-2A/2B entries:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

async function runReconciliation(req, res) {
  try {
    const businessId = await getBusinessId(req.user.userId);
    const { filingPeriod } = req.body;

    if (!filingPeriod) {
      return res.status(400).json({
        success: false,
        error: 'Filing period is required'
      });
    }

    const results = await gstr2ReconciliationService.runReconciliation(businessId, filingPeriod);
    
    res.json({
      success: true,
      message: `Reconciliation completed: ${results.matched} matched, ${results.mismatched} mismatched, ${results.unmatched} unmatched`,
      results
    });
  } catch (error) {
    console.error('Error running reconciliation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getReconciliationSummary(req, res) {
  try {
    const businessId = await getBusinessId(req.user.userId);
    const { filingPeriod } = req.params;

    if (!filingPeriod) {
      return res.status(400).json({
        success: false,
        error: 'Filing period is required'
      });
    }

    const summary = await gstr2ReconciliationService.getReconciliationSummary(businessId, filingPeriod);
    
    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error getting reconciliation summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getReconciliationEntries(req, res) {
  try {
    const businessId = await getBusinessId(req.user.userId);
    const filters = {
      filingPeriod: req.query.filingPeriod,
      status: req.query.status,
      supplierGstin: req.query.supplierGstin,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await gstr2ReconciliationService.getReconciliationEntries(businessId, filters);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error getting reconciliation entries:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function getPurchasesNotInGstr2(req, res) {
  try {
    const businessId = await getBusinessId(req.user.userId);
    const { filingPeriod } = req.params;

    if (!filingPeriod) {
      return res.status(400).json({
        success: false,
        error: 'Filing period is required'
      });
    }

    const purchases = await gstr2ReconciliationService.getPurchasesNotInGstr2(businessId, filingPeriod);
    
    res.json({
      success: true,
      count: purchases.length,
      purchases
    });
  } catch (error) {
    console.error('Error getting unmatched purchases:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function updateReconciliationAction(req, res) {
  try {
    const businessId = await getBusinessId(req.user.userId);
    const { id } = req.params;
    const { actionTaken, actionNotes } = req.body;

    if (!actionTaken) {
      return res.status(400).json({
        success: false,
        error: 'Action is required'
      });
    }

    const entry = await gstr2ReconciliationService.updateReconciliationAction(id, businessId, {
      actionTaken,
      actionNotes
    });
    
    res.json({
      success: true,
      message: 'Action updated successfully',
      entry
    });
  } catch (error) {
    console.error('Error updating reconciliation action:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

async function deleteReconciliationEntry(req, res) {
  try {
    const businessId = await getBusinessId(req.user.userId);
    const { id } = req.params;

    await gstr2ReconciliationService.deleteReconciliationEntry(id, businessId);
    
    res.json({
      success: true,
      message: 'Reconciliation entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reconciliation entry:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

async function getAvailablePeriods(req, res) {
  try {
    const businessId = await getBusinessId(req.user.userId);
    const periods = await gstr2ReconciliationService.getAvailablePeriods(businessId);
    
    res.json({
      success: true,
      periods
    });
  } catch (error) {
    console.error('Error getting available periods:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function generateItcReport(req, res) {
  try {
    const businessId = await getBusinessId(req.user.userId);
    const { filingPeriod } = req.params;

    if (!filingPeriod) {
      return res.status(400).json({
        success: false,
        error: 'Filing period is required'
      });
    }

    const report = await gstr2ReconciliationService.generateItcReport(businessId, filingPeriod);
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error generating ITC report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  importSingleEntry,
  importBulkEntries,
  runReconciliation,
  getReconciliationSummary,
  getReconciliationEntries,
  getPurchasesNotInGstr2,
  updateReconciliationAction,
  deleteReconciliationEntry,
  getAvailablePeriods,
  generateItcReport
};
