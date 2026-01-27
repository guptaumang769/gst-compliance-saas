/**
 * Invoice Controller
 * Week 3-4: Invoice Management
 * Handles HTTP requests for invoice operations
 */

const invoiceService = require('../services/invoiceService');
const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');

/**
 * POST /api/invoices
 * Create a new invoice
 */
async function createInvoice(req, res) {
  try {
    const userId = req.user.userId;
    
    // Get user's business
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No active business found'
      });
    }
    
    // Check subscription limits
    if (business.invoiceCountCurrentMonth >= business.invoiceLimit) {
      return res.status(403).json({
        success: false,
        error: `Invoice limit reached for ${business.subscriptionPlan} plan. Please upgrade your subscription.`,
        limit: business.invoiceLimit,
        currentCount: business.invoiceCountCurrentMonth
      });
    }
    
    // Create invoice
    const result = await invoiceService.createInvoice(business.id, req.body);
    
    return res.status(201).json(result);
    
  } catch (error) {
    console.error('Create invoice error:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('required') ||
        error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to create invoice'
    });
  }
}

/**
 * GET /api/invoices
 * Get all invoices
 */
async function getInvoices(req, res) {
  try {
    const userId = req.user.userId;
    
    // Get user's business
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No active business found'
      });
    }
    
    // Parse query params
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      search: req.query.search,
      invoiceType: req.query.invoiceType,
      customerId: req.query.customerId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      filedInGstr1: req.query.filedInGstr1
    };
    
    const result = await invoiceService.getInvoices(business.id, options);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Get invoices error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices'
    });
  }
}

/**
 * GET /api/invoices/:id
 * Get invoice by ID
 */
async function getInvoiceById(req, res) {
  try {
    const userId = req.user.userId;
    const invoiceId = req.params.id;
    
    // Get user's business
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No active business found'
      });
    }
    
    const result = await invoiceService.getInvoiceById(invoiceId, business.id);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Get invoice error:', error);
    
    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice'
    });
  }
}

/**
 * PUT /api/invoices/:id
 * Update invoice
 */
async function updateInvoice(req, res) {
  try {
    const userId = req.user.userId;
    const invoiceId = req.params.id;
    
    // Get user's business
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No active business found'
      });
    }
    
    const result = await invoiceService.updateInvoice(invoiceId, business.id, req.body);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Update invoice error:', error);
    
    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Cannot update')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to update invoice'
    });
  }
}

/**
 * DELETE /api/invoices/:id
 * Delete invoice
 */
async function deleteInvoice(req, res) {
  try {
    const userId = req.user.userId;
    const invoiceId = req.params.id;
    
    // Get user's business
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No active business found'
      });
    }
    
    const result = await invoiceService.deleteInvoice(invoiceId, business.id);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Delete invoice error:', error);
    
    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to delete invoice'
    });
  }
}

/**
 * GET /api/invoices/stats
 * Get invoice statistics
 */
async function getInvoiceStats(req, res) {
  try {
    const userId = req.user.userId;
    
    // Get user's business
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No active business found'
      });
    }
    
    const options = {
      month: parseInt(req.query.month),
      year: parseInt(req.query.year)
    };
    
    const result = await invoiceService.getInvoiceStats(business.id, options);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Get invoice stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
}

/**
 * POST /api/invoices/:id/generate-pdf
 * Generate PDF for an invoice
 */
async function generateInvoicePDF(req, res) {
  try {
    const userId = req.user.userId;
    const invoiceId = req.params.id;
    
    // Get user's business
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No active business found'
      });
    }
    
    // Generate PDF
    const pdfPath = await pdfService.generateInvoicePDF(invoiceId, business.id);
    
    return res.status(200).json({
      success: true,
      message: 'Invoice PDF generated successfully',
      pdfPath,
      invoiceId
    });
    
  } catch (error) {
    console.error('Generate PDF error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to generate PDF'
    });
  }
}

/**
 * GET /api/invoices/:id/download-pdf
 * Download PDF for an invoice
 */
async function downloadInvoicePDF(req, res) {
  try {
    const userId = req.user.userId;
    const invoiceId = req.params.id;
    
    // Get user's business
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No active business found'
      });
    }
    
    // Get PDF path
    const pdfPath = await pdfService.getInvoicePDFPath(invoiceId, business.id);
    
    // Send file
    return res.download(pdfPath);
    
  } catch (error) {
    console.error('Download PDF error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to download PDF'
    });
  }
}

/**
 * POST /api/invoices/:id/send-email
 * Send invoice via email
 */
async function sendInvoiceEmail(req, res) {
  try {
    const userId = req.user.userId;
    const invoiceId = req.params.id;
    const { to, subject, message } = req.body;
    
    // Get user's business
    const prisma = require('../config/database');
    const business = await prisma.business.findFirst({
      where: { userId, isActive: true }
    });
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No active business found'
      });
    }
    
    // Send email
    const result = await emailService.sendInvoiceEmail(invoiceId, business.id, {
      to,
      subject,
      message
    });
    
    return res.status(200).json({
      success: true,
      message: 'Invoice email sent successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Send email error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to send email'
    });
  }
}

/**
 * POST /api/invoices/test-email
 * Test email configuration
 */
async function testEmailConfig(req, res) {
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }
    
    const result = await emailService.sendTestEmail(to);
    
    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Test email error:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to send test email'
    });
  }
}

/**
 * GET /api/invoices/verify-email-config
 * Verify email configuration
 */
async function verifyEmailConfig(req, res) {
  try {
    const result = await emailService.verifyEmailConfig();
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Verify email config error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify email configuration'
    });
  }
}

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats,
  generateInvoicePDF,
  downloadInvoicePDF,
  sendInvoiceEmail,
  testEmailConfig,
  verifyEmailConfig
};
