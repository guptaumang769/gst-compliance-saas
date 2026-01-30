/**
 * GSTR-1 Controller
 * Handles HTTP requests for GSTR-1 return generation and management
 */

const gstr1Service = require('../services/gstr1Service');

/**
 * Generate GSTR-1 for a specific period
 * POST /api/gstr1/generate
 */
async function generateGSTR1(req, res) {
  try {
    const userId = req.user.userId;
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'No active business found'
      });
    }

    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: month, year'
      });
    }

    const gstr1 = await gstr1Service.generateGSTR1(business.id, month, year);

    res.status(200).json({
      success: true,
      message: 'GSTR-1 generated successfully',
      data: gstr1
    });
  } catch (error) {
    console.error('Generate GSTR-1 error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate GSTR-1'
    });
  }
}

/**
 * Get all GSTR-1 returns for the business
 * GET /api/gstr1
 */
async function getAllGSTR1(req, res) {
  try {
    const userId = req.user.userId;
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'No active business found'
      });
    }

    const gstr1Returns = await prisma.gSTReturn.findMany({
      where: { 
        businessId: business.id,
        returnType: 'gstr1',
        deletedAt: null
      },
      orderBy: { generatedAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      returns: gstr1Returns.map(r => ({
        id: r.id,
        returnType: 'GSTR1',
        period: r.filingPeriod,
        generatedDate: r.generatedAt || r.createdAt,
        status: r.status || 'generated',
        totalTaxLiability: parseFloat(r.totalTaxLiability || 0),
      }))
    });
  } catch (error) {
    console.error('Get all GSTR-1 error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to retrieve GSTR-1 returns'
    });
  }
}

/**
 * Get GSTR-1 for a specific period
 * GET /api/gstr1/:year/:month
 */
async function getGSTR1(req, res) {
  try {
    const userId = req.user.userId;
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'No active business found'
      });
    }

    const { year, month } = req.params;

    const gstr1 = await gstr1Service.getGSTR1(business.id, parseInt(month), parseInt(year));

    res.status(200).json({
      success: true,
      message: 'GSTR-1 retrieved successfully',
      data: gstr1
    });
  } catch (error) {
    console.error('Get GSTR-1 error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'GSTR-1 not found'
    });
  }
}

/**
 * Export GSTR-1 as JSON
 * GET /api/gstr1/:year/:month/export/json
 */
async function exportGSTR1JSON(req, res) {
  try {
    const userId = req.user.userId;
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'No active business found'
      });
    }

    const { year, month } = req.params;

    const gstr1 = await gstr1Service.getGSTR1(business.id, parseInt(month), parseInt(year));
    const jsonData = gstr1Service.exportGSTR1ToJSON(gstr1.returnData);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="GSTR1_${gstr1.returnData.gstin}_${year}${String(month).padStart(2, '0')}.json"`);
    
    res.status(200).send(jsonData);
  } catch (error) {
    console.error('Export GSTR-1 JSON error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to export GSTR-1'
    });
  }
}

module.exports = {
  generateGSTR1,
  getAllGSTR1,
  getGSTR1,
  exportGSTR1JSON
};
