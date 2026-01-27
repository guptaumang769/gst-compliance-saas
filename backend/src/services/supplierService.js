/**
 * Supplier Service
 * Handles business logic for supplier management
 * 
 * Suppliers are vendors/sellers from whom the business purchases goods/services.
 * Similar to customers, but for purchase transactions.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { validateGSTIN } = require('../utils/gstValidation');

/**
 * Create a new supplier
 * @param {Object} supplierData - Supplier data
 * @returns {Promise<Object>} - Created supplier
 */
async function createSupplier(supplierData) {
  const {
    businessId,
    supplierName,
    gstin,
    pan,
    billingAddress,
    city,
    state,
    pincode,
    email,
    phone,
    supplierType = 'registered' // registered, unregistered, composition
  } = supplierData;

  // Validation
  if (!businessId || !supplierName || !billingAddress || !city || !state || !pincode) {
    throw new Error('Missing required fields: businessId, supplierName, billingAddress, city, state, pincode');
  }

  // Validate business exists
  const business = await prisma.business.findFirst({
    where: { id: businessId, isActive: true }
  });

  if (!business) {
    throw new Error('Business not found');
  }

  // If GSTIN provided, validate it
  let stateCode = null;
  if (gstin) {
    const gstinValidation = validateGSTIN(gstin);
    if (!gstinValidation.valid) {
      throw new Error(`Invalid GSTIN: ${gstinValidation.message}`);
    }
    stateCode = gstin.substring(0, 2);

    // Check for duplicate GSTIN
    const existingSupplier = await prisma.supplier.findFirst({
      where: { businessId, gstin, isActive: true }
    });

    if (existingSupplier) {
      throw new Error(`Supplier with GSTIN ${gstin} already exists`);
    }
  }

  // Create supplier
  const supplier = await prisma.supplier.create({
    data: {
      businessId,
      supplierName,
      gstin: gstin || null,
      pan: pan || null,
      billingAddress,
      city,
      state,
      stateCode,
      pincode,
      email: email || null,
      phone: phone || null,
      supplierType
    }
  });

  return supplier;
}

/**
 * Get all suppliers for a business
 * @param {string} businessId - Business ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} - List of suppliers with pagination
 */
async function getSuppliers(businessId, filters = {}) {
  const { supplierType, search, page = 1, limit = 50 } = filters;

  const where = {
    businessId,
    isActive: true
  };

  if (supplierType) {
    where.supplierType = supplierType;
  }

  if (search) {
    where.OR = [
      { supplierName: { contains: search, mode: 'insensitive' } },
      { gstin: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }

  const skip = (page - 1) * limit;

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { supplierName: 'asc' },
      skip,
      take: limit
    }),
    prisma.supplier.count({ where })
  ]);

  return {
    suppliers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get a single supplier by ID
 * @param {string} supplierId - Supplier ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Supplier details
 */
async function getSupplierById(supplierId, businessId) {
  const supplier = await prisma.supplier.findFirst({
    where: {
      id: supplierId,
      businessId,
      isActive: true
    },
    include: {
      _count: {
        select: { purchases: true }
      }
    }
  });

  if (!supplier) {
    throw new Error('Supplier not found');
  }

  return supplier;
}

/**
 * Update a supplier
 * @param {string} supplierId - Supplier ID
 * @param {string} businessId - Business ID
 * @param {Object} updateData - Updated supplier data
 * @returns {Promise<Object>} - Updated supplier
 */
async function updateSupplier(supplierId, businessId, updateData) {
  const supplier = await getSupplierById(supplierId, businessId);

  const {
    supplierName,
    gstin,
    pan,
    billingAddress,
    city,
    state,
    pincode,
    email,
    phone,
    supplierType
  } = updateData;

  // If GSTIN is being updated, validate it
  let stateCode = supplier.stateCode;
  if (gstin && gstin !== supplier.gstin) {
    const gstinValidation = validateGSTIN(gstin);
    if (!gstinValidation.valid) {
      throw new Error(`Invalid GSTIN: ${gstinValidation.message}`);
    }
    stateCode = gstin.substring(0, 2);

    // Check for duplicate GSTIN
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        businessId,
        gstin,
        isActive: true,
        id: { not: supplierId }
      }
    });

    if (existingSupplier) {
      throw new Error(`Another supplier with GSTIN ${gstin} already exists`);
    }
  }

  const updatedSupplier = await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      supplierName: supplierName || supplier.supplierName,
      gstin: gstin !== undefined ? gstin : supplier.gstin,
      pan: pan !== undefined ? pan : supplier.pan,
      billingAddress: billingAddress || supplier.billingAddress,
      city: city || supplier.city,
      state: state || supplier.state,
      stateCode: stateCode,
      pincode: pincode || supplier.pincode,
      email: email !== undefined ? email : supplier.email,
      phone: phone !== undefined ? phone : supplier.phone,
      supplierType: supplierType || supplier.supplierType
    }
  });

  return updatedSupplier;
}

/**
 * Delete a supplier (soft delete)
 * @param {string} supplierId - Supplier ID
 * @param {string} businessId - Business ID
 * @returns {Promise<void>}
 */
async function deleteSupplier(supplierId, businessId) {
  const supplier = await getSupplierById(supplierId, businessId);

  // Check if supplier has any purchases
  const purchaseCount = await prisma.purchase.count({
    where: { supplierId, isActive: true }
  });

  if (purchaseCount > 0) {
    throw new Error(`Cannot delete supplier: ${purchaseCount} purchase(s) exist. Deactivate instead.`);
  }

  await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      isActive: false,
      deletedAt: new Date()
    }
  });
}

/**
 * Get supplier statistics
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Supplier statistics
 */
async function getSupplierStats(businessId) {
  const [totalSuppliers, registeredSuppliers, unregisteredSuppliers] = await Promise.all([
    prisma.supplier.count({
      where: { businessId, isActive: true }
    }),
    prisma.supplier.count({
      where: { businessId, isActive: true, supplierType: 'registered' }
    }),
    prisma.supplier.count({
      where: { businessId, isActive: true, supplierType: 'unregistered' }
    })
  ]);

  return {
    totalSuppliers,
    registeredSuppliers,
    unregisteredSuppliers,
    compositionSuppliers: totalSuppliers - registeredSuppliers - unregisteredSuppliers
  };
}

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  getSupplierStats
};
