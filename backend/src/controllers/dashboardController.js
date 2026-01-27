/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard metrics and analytics
 */

const dashboardService = require('../services/dashboardService');

/**
 * Get dashboard overview for a specific month
 * GET /api/dashboard/overview
 * Query params: month, year
 */
async function getDashboardOverview(req, res) {
  try {
    const businessId = req.user.businessId;
    const currentDate = new Date();
    const month = parseInt(req.query.month) || currentDate.getMonth() + 1;
    const year = parseInt(req.query.year) || currentDate.getFullYear();

    const overview = await dashboardService.getDashboardOverview(businessId, month, year);

    res.status(200).json({
      success: true,
      message: 'Dashboard overview retrieved successfully',
      data: overview
    });
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to retrieve dashboard overview'
    });
  }
}

/**
 * Get top customers by revenue
 * GET /api/dashboard/top-customers
 * Query params: month, year, limit
 */
async function getTopCustomers(req, res) {
  try {
    const businessId = req.user.businessId;
    const filters = {
      month: parseInt(req.query.month),
      year: parseInt(req.query.year),
      limit: parseInt(req.query.limit) || 10
    };

    const topCustomers = await dashboardService.getTopCustomers(businessId, filters);

    res.status(200).json({
      success: true,
      message: 'Top customers retrieved successfully',
      data: topCustomers
    });
  } catch (error) {
    console.error('Get top customers error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to retrieve top customers'
    });
  }
}

/**
 * Get top suppliers by expenditure
 * GET /api/dashboard/top-suppliers
 * Query params: month, year, limit
 */
async function getTopSuppliers(req, res) {
  try {
    const businessId = req.user.businessId;
    const filters = {
      month: parseInt(req.query.month),
      year: parseInt(req.query.year),
      limit: parseInt(req.query.limit) || 10
    };

    const topSuppliers = await dashboardService.getTopSuppliers(businessId, filters);

    res.status(200).json({
      success: true,
      message: 'Top suppliers retrieved successfully',
      data: topSuppliers
    });
  } catch (error) {
    console.error('Get top suppliers error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to retrieve top suppliers'
    });
  }
}

/**
 * Get revenue trend (last 6 months)
 * GET /api/dashboard/revenue-trend
 */
async function getRevenueTrend(req, res) {
  try {
    const businessId = req.user.businessId;
    const trend = await dashboardService.getRevenueTrend(businessId);

    res.status(200).json({
      success: true,
      message: 'Revenue trend retrieved successfully',
      data: trend
    });
  } catch (error) {
    console.error('Get revenue trend error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to retrieve revenue trend'
    });
  }
}

/**
 * Get upcoming GST filing deadlines
 * GET /api/dashboard/deadlines
 */
async function getGstDeadlines(req, res) {
  try {
    const businessId = req.user.businessId;
    const deadlines = await dashboardService.getGstDeadlines(businessId);

    res.status(200).json({
      success: true,
      message: 'GST deadlines retrieved successfully',
      data: deadlines
    });
  } catch (error) {
    console.error('Get GST deadlines error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to retrieve GST deadlines'
    });
  }
}

/**
 * Get quick stats for dashboard cards
 * GET /api/dashboard/quick-stats
 */
async function getQuickStats(req, res) {
  try {
    const businessId = req.user.businessId;
    const stats = await dashboardService.getQuickStats(businessId);

    res.status(200).json({
      success: true,
      message: 'Quick stats retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Get quick stats error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to retrieve quick stats'
    });
  }
}

module.exports = {
  getDashboardOverview,
  getTopCustomers,
  getTopSuppliers,
  getRevenueTrend,
  getGstDeadlines,
  getQuickStats
};
