/**
 * Invoice Service
 * Week 3-4: Invoice Management
 * 
 * Handles business logic for invoice operations:
 * - Create invoice with GST calculation
 * - List invoices
 * - Update invoice
 * - Delete invoice
 * - Generate invoice number
 * - Calculate GST automatically
 */

const prisma = require('../config/database');
const { calculateInvoiceGST } = require('./gstCalculator');
const { generateInvoiceNumber } = require('../utils/invoiceNumberGenerator');

/**
 * Create a new invoice with automatic GST calculation
 * ✅ GST Integration: Auto-calculates CGST/SGST/IGST based on states
 * 
 * @param {string} businessId - Business ID
 * @param {Object} invoiceData - Invoice data
 * @returns {Object} Created invoice
 */
async function createInvoice(businessId, invoiceData) {
  const {
    customerId,
    invoiceDate,
    items,
    discountAmount = 0,
    notes,
    termsAndConditions,
    reverseCharge = false
  } = invoiceData;
  
  try {
    // Validate required fields
    if (!customerId || !invoiceDate || !items || items.length === 0) {
      throw new Error('Missing required fields: customerId, invoiceDate, items');
    }
    
    // Get business details
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });
    
    if (!business) {
      throw new Error('Business not found');
    }
    
    // Get customer details
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, businessId, isActive: true }
    });
    
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    // Determine invoice type based on customer type
    const invoiceType = customer.customerType === 'b2c' 
      ? (parseFloat(invoiceData.totalAmount || 0) >= 250000 ? 'b2c_large' : 'b2c_small')
      : customer.customerType;
    
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(businessId);
    
    // ============================================
    // CRITICAL: Calculate GST for all items
    // ============================================
    const gstCalculation = calculateInvoiceGST({
      items,
      sellerStateCode: business.stateCode,
      buyerStateCode: customer.stateCode || business.stateCode,
      invoiceType,
      discountAmount
    });
    
    // Create invoice with items in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // Create invoice
      const newInvoice = await tx.invoice.create({
        data: {
          businessId,
          customerId,
          invoiceNumber,
          invoiceDate: new Date(invoiceDate),
          invoiceType,
          
          // Financial details
          subtotal: gstCalculation.subtotal,
          discountAmount: gstCalculation.discountAmount,
          taxableAmount: gstCalculation.taxableAmount,
          
          // GST breakdown
          cgstAmount: gstCalculation.cgstAmount,
          sgstAmount: gstCalculation.sgstAmount,
          igstAmount: gstCalculation.igstAmount,
          cessAmount: gstCalculation.cessAmount,
          totalTaxAmount: gstCalculation.totalTaxAmount,
          
          // Total
          totalAmount: gstCalculation.totalAmount,
          roundOffAmount: gstCalculation.roundOffAmount,
          
          // State information
          sellerState: business.state,
          sellerStateCode: business.stateCode,
          buyerState: customer.state,
          buyerStateCode: customer.stateCode,
          
          // Place of supply (buyer's state for most cases)
          placeOfSupply: customer.state,
          reverseCharge,
          notes,
          termsAndConditions,
          
          // GSTR filing status
          filedInGstr1: false,
          gstr1FilingMonth: null,
          
          isActive: true
        }
      });
      
      // Create invoice items
      for (const calcItem of gstCalculation.items) {
        await tx.invoiceItem.create({
          data: {
            invoiceId: newInvoice.id,
            itemName: calcItem.itemName,
            description: calcItem.description || null,
            hsnCode: calcItem.hsnCode || null,
            sacCode: calcItem.sacCode || null,
            quantity: calcItem.quantity,
            unit: calcItem.unit || 'NOS',
            unitPrice: calcItem.unitPrice,
            discountPercent: calcItem.discountPercent || 0,
            discountAmount: calcItem.discountAmount || 0,
            taxableAmount: calcItem.taxableAmount,
            gstRate: calcItem.gstRate,
            cgstRate: calcItem.cgstRate,
            cgstAmount: calcItem.cgstAmount,
            sgstRate: calcItem.sgstRate,
            sgstAmount: calcItem.sgstAmount,
            igstRate: calcItem.igstRate,
            igstAmount: calcItem.igstAmount,
            cessRate: calcItem.cessRate || 0,
            cessAmount: calcItem.cessAmount || 0,
            totalAmount: calcItem.totalAmount
          }
        });
      }
      
      // Update business invoice count for current month
      await tx.business.update({
        where: { id: businessId },
        data: {
          invoiceCountCurrentMonth: {
            increment: 1
          }
        }
      });
      
      return newInvoice;
    });
    
    // Return invoice with items
    const invoiceWithItems = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        items: true,
        customer: {
          select: {
            customerName: true,
            gstin: true,
            billingAddress: true,
            city: true,
            state: true,
            pincode: true,
            email: true,
            phone: true
          }
        }
      }
    });
    
    return {
      success: true,
      message: 'Invoice created successfully',
      invoice: invoiceWithItems
    };
    
  } catch (error) {
    console.error('Create invoice error:', error);
    throw error;
  }
}

/**
 * Get all invoices for a business
 * 
 * @param {string} businessId - Business ID
 * @param {Object} options - Query options
 * @returns {Object} List of invoices
 */
async function getInvoices(businessId, options = {}) {
  const {
    page = 1,
    limit = 50,
    search,
    invoiceType,
    customerId,
    startDate,
    endDate,
    filedInGstr1
  } = options;
  
  try {
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where = {
      businessId,
      isActive: true
    };
    
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (invoiceType) {
      where.invoiceType = invoiceType;
    }
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) {
        where.invoiceDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.invoiceDate.lte = new Date(endDate);
      }
    }
    
    if (filedInGstr1 !== undefined) {
      where.filedInGstr1 = filedInGstr1 === 'true';
    }
    
    // Get invoices with count
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              customerName: true,
              gstin: true,
              customerType: true
            }
          },
          _count: {
            select: { items: true }
          }
        },
        orderBy: { invoiceDate: 'desc' }
      }),
      prisma.invoice.count({ where })
    ]);
    
    return {
      success: true,
      invoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
    
  } catch (error) {
    console.error('Get invoices error:', error);
    throw error;
  }
}

/**
 * Get invoice by ID with all details
 * 
 * @param {string} invoiceId - Invoice ID
 * @param {string} businessId - Business ID (for authorization)
 * @returns {Object} Invoice details
 */
async function getInvoiceById(invoiceId, businessId) {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        businessId,
        isActive: true
      },
      include: {
        items: true,
        customer: true,
        business: {
          select: {
            businessName: true,
            tradeName: true,
            gstin: true,
            pan: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            pincode: true,
            email: true,
            phone: true,
            logoUrl: true
          }
        }
      }
    });
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    return {
      success: true,
      invoice
    };
    
  } catch (error) {
    console.error('Get invoice error:', error);
    throw error;
  }
}

/**
 * Update invoice (only if not filed in GSTR-1)
 * 
 * @param {string} invoiceId - Invoice ID
 * @param {string} businessId - Business ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated invoice
 */
async function updateInvoice(invoiceId, businessId, updateData) {
  try {
    // Check if invoice exists and not filed
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        businessId,
        isActive: true
      }
    });
    
    if (!existingInvoice) {
      throw new Error('Invoice not found');
    }
    
    if (existingInvoice.filedInGstr1) {
      throw new Error('Cannot update invoice that has been filed in GSTR-1');
    }
    
    // If items are being updated, recalculate GST
    if (updateData.items) {
      const business = await prisma.business.findUnique({
        where: { id: businessId }
      });
      
      const customer = await prisma.customer.findFirst({
        where: { id: existingInvoice.customerId }
      });
      
      const gstCalculation = calculateInvoiceGST({
        items: updateData.items,
        sellerStateCode: business.stateCode,
        buyerStateCode: customer.stateCode || business.stateCode,
        invoiceType: existingInvoice.invoiceType,
        discountAmount: updateData.discountAmount || existingInvoice.discountAmount
      });
      
      // Update invoice with new calculations
      updateData.subtotal = gstCalculation.subtotal;
      updateData.taxableAmount = gstCalculation.taxableAmount;
      updateData.cgstAmount = gstCalculation.cgstAmount;
      updateData.sgstAmount = gstCalculation.sgstAmount;
      updateData.igstAmount = gstCalculation.igstAmount;
      updateData.cessAmount = gstCalculation.cessAmount;
      updateData.totalTaxAmount = gstCalculation.totalTaxAmount;
      updateData.totalAmount = gstCalculation.totalAmount;
      updateData.roundOffAmount = gstCalculation.roundOffAmount;
      
      // Delete old items and create new ones
      await prisma.$transaction(async (tx) => {
        // Delete old items
        await tx.invoiceItem.deleteMany({
          where: { invoiceId }
        });
        
        // Create new items
        for (const calcItem of gstCalculation.items) {
          await tx.invoiceItem.create({
            data: {
              invoiceId,
              ...calcItem
            }
          });
        }
        
        // Update invoice
        await tx.invoice.update({
          where: { id: invoiceId },
          data: updateData
        });
      });
    } else {
      // Simple update without items change
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: updateData
      });
    }
    
    // Return updated invoice
    return getInvoiceById(invoiceId, businessId);
    
  } catch (error) {
    console.error('Update invoice error:', error);
    throw error;
  }
}

/**
 * Delete invoice (soft delete, only if not filed)
 * 
 * @param {string} invoiceId - Invoice ID
 * @param {string} businessId - Business ID
 * @returns {Object} Success message
 */
async function deleteInvoice(invoiceId, businessId) {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        businessId,
        isActive: true
      }
    });
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    if (invoice.filedInGstr1) {
      throw new Error('Cannot delete invoice that has been filed in GSTR-1');
    }
    
    // Soft delete
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    });
    
    return {
      success: true,
      message: 'Invoice deleted successfully'
    };
    
  } catch (error) {
    console.error('Delete invoice error:', error);
    throw error;
  }
}

/**
 * Get invoice statistics
 * 
 * @param {string} businessId - Business ID
 * @param {Object} options - Filter options
 * @returns {Object} Invoice statistics
 */
async function getInvoiceStats(businessId, options = {}) {
  const { month, year } = options;
  
  try {
    const where = {
      businessId,
      isActive: true
    };
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      where.invoiceDate = {
        gte: startDate,
        lte: endDate
      };
    }
    
    const [
      totalInvoices,
      totalAmount,
      totalTaxAmount,
      invoicesByType
    ] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.aggregate({
        where,
        _sum: { totalAmount: true }
      }),
      prisma.invoice.aggregate({
        where,
        _sum: { totalTaxAmount: true }
      }),
      prisma.invoice.groupBy({
        by: ['invoiceType'],
        where,
        _count: true,
        _sum: {
          totalAmount: true
        }
      })
    ]);
    
    return {
      success: true,
      stats: {
        totalInvoices,
        totalAmount: totalAmount._sum.totalAmount || 0,
        totalTaxAmount: totalTaxAmount._sum.totalTaxAmount || 0,
        byType: invoicesByType
      }
    };
    
  } catch (error) {
    console.error('Get invoice stats error:', error);
    throw error;
  }
}

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats
};
