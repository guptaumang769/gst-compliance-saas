/**
 * Customer Service
 * Week 3-4: Customer Management
 * 
 * Handles business logic for customer operations:
 * - Create customer with GSTIN validation
 * - List customers
 * - Update customer
 * - Delete customer (soft delete)
 * - Search customers
 */

const prisma = require('../config/database');
const { validateGSTIN, extractStateCode } = require('../utils/gstValidation');

/**
 * Create a new customer
 * ✅ GST Integration: Validates GSTIN for B2B customers
 * 
 * @param {string} businessId - Business ID
 * @param {Object} customerData - Customer data
 * @returns {Object} Created customer
 */
async function createCustomer(businessId, customerData) {
  const {
    customerName,
    gstin,
    pan,
    billingAddress,
    shippingAddress,
    city,
    state,
    pincode,
    email,
    phone,
    contactPerson,
    customerType = 'b2b'
  } = customerData;
  
  try {
    // Validate required fields
    if (!customerName || !billingAddress || !city || !state || !pincode) {
      throw new Error('Missing required fields: customerName, billingAddress, city, state, pincode');
    }
    
    // Validate customer type
    const validTypes = ['b2b', 'b2c', 'export', 'sez'];
    if (!validTypes.includes(customerType)) {
      throw new Error(`Invalid customer type. Must be one of: ${validTypes.join(', ')}`);
    }
    
    let stateCode = null;
    
    // ✅ CRITICAL: Validate GSTIN for B2B and SEZ customers
    if (customerType === 'b2b' || customerType === 'sez') {
      if (!gstin) {
        throw new Error(`GSTIN is required for ${customerType.toUpperCase()} customers`);
      }
      
      const gstinValidation = validateGSTIN(gstin);
      if (!gstinValidation.valid) {
        throw new Error(`Invalid GSTIN: ${gstinValidation.message}`);
      }
      
      // Extract state code from GSTIN
      stateCode = extractStateCode(gstin);
      
      // Check if customer with same GSTIN already exists for this business
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          businessId,
          gstin,
          isActive: true
        }
      });
      
      if (existingCustomer) {
        throw new Error('Customer with this GSTIN already exists');
      }
    }
    
    // Export customers don't need GSTIN
    if (customerType === 'export') {
      // For export, state can be "Export" or specific country
      stateCode = '96'; // Export state code
    }
    
    // Create customer
    const customer = await prisma.customer.create({
      data: {
        businessId,
        customerName,
        gstin: gstin || null,
        pan: pan || null,
        billingAddress,
        shippingAddress: shippingAddress || billingAddress, // Default to billing address
        city,
        state,
        stateCode,
        pincode,
        email: email || null,
        phone: phone || null,
        contactPerson: contactPerson || null,
        customerType,
        isActive: true
      }
    });
    
    return {
      success: true,
      message: 'Customer created successfully',
      customer
    };
    
  } catch (error) {
    console.error('Create customer error:', error);
    throw error;
  }
}

/**
 * Get all customers for a business
 * 
 * @param {string} businessId - Business ID
 * @param {Object} options - Query options (pagination, filters)
 * @returns {Object} List of customers
 */
async function getCustomers(businessId, options = {}) {
  const {
    page = 1,
    limit = 50,
    search,
    customerType,
    isActive = true
  } = options;
  
  try {
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where = {
      businessId,
      isActive
    };
    
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { gstin: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ];
    }
    
    if (customerType) {
      where.customerType = customerType;
    }
    
    // Get customers with count
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);
    
    return {
      success: true,
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
    
  } catch (error) {
    console.error('Get customers error:', error);
    throw error;
  }
}

/**
 * Get customer by ID
 * 
 * @param {string} customerId - Customer ID
 * @param {string} businessId - Business ID (for authorization)
 * @returns {Object} Customer details
 */
async function getCustomerById(customerId, businessId) {
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId,
        isActive: true
      },
      include: {
        _count: {
          select: { invoices: true }
        }
      }
    });
    
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    return {
      success: true,
      customer
    };
    
  } catch (error) {
    console.error('Get customer error:', error);
    throw error;
  }
}

/**
 * Update customer
 * 
 * @param {string} customerId - Customer ID
 * @param {string} businessId - Business ID (for authorization)
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated customer
 */
async function updateCustomer(customerId, businessId, updateData) {
  try {
    // Check if customer exists and belongs to this business
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId,
        isActive: true
      }
    });
    
    if (!existingCustomer) {
      throw new Error('Customer not found');
    }
    
    // If updating GSTIN, validate it
    if (updateData.gstin && updateData.gstin !== existingCustomer.gstin) {
      const gstinValidation = validateGSTIN(updateData.gstin);
      if (!gstinValidation.valid) {
        throw new Error(`Invalid GSTIN: ${gstinValidation.message}`);
      }
      
      // Check if new GSTIN is already used by another customer
      const duplicateCustomer = await prisma.customer.findFirst({
        where: {
          businessId,
          gstin: updateData.gstin,
          id: { not: customerId },
          isActive: true
        }
      });
      
      if (duplicateCustomer) {
        throw new Error('Another customer with this GSTIN already exists');
      }
      
      // Update state code if GSTIN changed
      updateData.stateCode = extractStateCode(updateData.gstin);
    }
    
    // Update customer
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData
    });
    
    return {
      success: true,
      message: 'Customer updated successfully',
      customer
    };
    
  } catch (error) {
    console.error('Update customer error:', error);
    throw error;
  }
}

/**
 * Delete customer (soft delete)
 * 
 * @param {string} customerId - Customer ID
 * @param {string} businessId - Business ID (for authorization)
 * @returns {Object} Success message
 */
async function deleteCustomer(customerId, businessId) {
  try {
    // Check if customer exists
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId,
        isActive: true
      },
      include: {
        _count: {
          select: { invoices: true }
        }
      }
    });
    
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    // Check if customer has invoices
    if (customer._count.invoices > 0) {
      throw new Error(`Cannot delete customer with ${customer._count.invoices} invoices. Please archive instead.`);
    }
    
    // Soft delete
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    });
    
    return {
      success: true,
      message: 'Customer deleted successfully'
    };
    
  } catch (error) {
    console.error('Delete customer error:', error);
    throw error;
  }
}

/**
 * Get customer statistics
 * 
 * @param {string} businessId - Business ID
 * @returns {Object} Customer statistics
 */
async function getCustomerStats(businessId) {
  try {
    const [total, b2bCount, b2cCount, exportCount] = await Promise.all([
      prisma.customer.count({
        where: { businessId, isActive: true }
      }),
      prisma.customer.count({
        where: { businessId, customerType: 'b2b', isActive: true }
      }),
      prisma.customer.count({
        where: { businessId, customerType: 'b2c', isActive: true }
      }),
      prisma.customer.count({
        where: { businessId, customerType: 'export', isActive: true }
      })
    ]);
    
    return {
      success: true,
      stats: {
        total,
        b2b: b2bCount,
        b2c: b2cCount,
        export: exportCount,
        sez: total - b2bCount - b2cCount - exportCount
      }
    };
    
  } catch (error) {
    console.error('Get customer stats error:', error);
    throw error;
  }
}

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerStats
};
