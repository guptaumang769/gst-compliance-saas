/**
 * GSTR-3B Controller
 * Handles HTTP requests for GSTR-3B return generation and management
 */

const gstr3bService = require('../services/gstr3bService');

/**
 * Generate GSTR-3B for a specific period
 * POST /api/gstr3b/generate
 */
async function generateGSTR3B(req, res) {
  try {
    const businessId = req.user.businessId;
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: month, year'
      });
    }

    const gstr3b = await gstr3bService.generateGSTR3B(businessId, month, year);

    res.status(200).json({
      success: true,
      message: 'GSTR-3B generated successfully',
      data: gstr3b
    });
  } catch (error) {
    console.error('Generate GSTR-3B error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate GSTR-3B'
    });
  }
}

/**
 * Get GSTR-3B for a specific period
 * GET /api/gstr3b/:year/:month
 */
async function getGSTR3B(req, res) {
  try {
    const businessId = req.user.businessId;
    const { year, month } = req.params;

    const gstr3b = await gstr3bService.getGSTR3B(businessId, parseInt(month), parseInt(year));

    res.status(200).json({
      success: true,
      message: 'GSTR-3B retrieved successfully',
      data: gstr3b
    });
  } catch (error) {
    console.error('Get GSTR-3B error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'GSTR-3B not found'
    });
  }
}

/**
 * Export GSTR-3B as JSON
 * GET /api/gstr3b/:year/:month/export/json
 */
async function exportGSTR3BJSON(req, res) {
  try {
    const businessId = req.user.businessId;
    const { year, month } = req.params;

    const gstr3b = await gstr3bService.getGSTR3B(businessId, parseInt(month), parseInt(year));
    const jsonData = gstr3bService.exportGSTR3BToJSON(gstr3b.returnData);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="GSTR3B_${gstr3b.returnData.gstin}_${year}${String(month).padStart(2, '0')}.json"`);
    
    res.status(200).send(jsonData);
  } catch (error) {
    console.error('Export GSTR-3B JSON error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to export GSTR-3B'
    });
  }
}

module.exports = {
  generateGSTR3B,
  getGSTR3B,
  exportGSTR3BJSON
};
