/**
 * Invoice Number Generator
 * Week 3-4: Invoice Management
 * 
 * Generates unique invoice numbers for a business
 * Format: INV-YYYYMM-NNNN
 * Example: INV-202601-0001
 */

const prisma = require('../config/database');

/**
 * Generate next invoice number for a business
 * 
 * @param {string} businessId - Business ID
 * @returns {Promise<string>} Generated invoice number
 */
async function generateInvoiceNumber(businessId) {
  try {
    // Get current year and month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;
    
    // Find the last invoice for this business in current month
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        businessId,
        invoiceNumber: {
          startsWith: `INV-${yearMonth}-`
        }
      },
      orderBy: {
        invoiceNumber: 'desc'
      }
    });
    
    let sequenceNumber = 1;
    
    if (lastInvoice) {
      // Extract sequence number from last invoice
      // Example: INV-202601-0042 -> 0042
      const parts = lastInvoice.invoiceNumber.split('-');
      const lastSequence = parseInt(parts[2]);
      sequenceNumber = lastSequence + 1;
    }
    
    // Format sequence number with leading zeros (4 digits)
    const formattedSequence = String(sequenceNumber).padStart(4, '0');
    
    // Generate invoice number
    const invoiceNumber = `INV-${yearMonth}-${formattedSequence}`;
    
    return invoiceNumber;
    
  } catch (error) {
    console.error('Generate invoice number error:', error);
    throw new Error('Failed to generate invoice number');
  }
}

/**
 * Validate invoice number format
 * 
 * @param {string} invoiceNumber - Invoice number to validate
 * @returns {boolean} True if valid
 */
function validateInvoiceNumber(invoiceNumber) {
  // Format: INV-YYYYMM-NNNN
  const regex = /^INV-\d{6}-\d{4}$/;
  return regex.test(invoiceNumber);
}

/**
 * Parse invoice number to extract components
 * 
 * @param {string} invoiceNumber - Invoice number
 * @returns {Object} Parsed components
 */
function parseInvoiceNumber(invoiceNumber) {
  if (!validateInvoiceNumber(invoiceNumber)) {
    throw new Error('Invalid invoice number format');
  }
  
  const parts = invoiceNumber.split('-');
  const yearMonth = parts[1];
  const sequence = parseInt(parts[2]);
  
  return {
    prefix: 'INV',
    year: parseInt(yearMonth.substring(0, 4)),
    month: parseInt(yearMonth.substring(4, 6)),
    sequence,
    full: invoiceNumber
  };
}

module.exports = {
  generateInvoiceNumber,
  validateInvoiceNumber,
  parseInvoiceNumber
};
