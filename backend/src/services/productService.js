/**
 * Product Service
 * Product / Service Master (Week: Product Master)
 *
 * Mirrors the customer CRUD pattern: create, list (search + pagination),
 * get by id, update and soft delete. Financial values are stored as Decimal.
 */

const prisma = require('../config/database');

const VALID_TYPES = ['GOODS', 'SERVICE'];

function normalizeType(type) {
  return String(type || 'GOODS').toUpperCase();
}

/**
 * Create a new product/service.
 *
 * @param {string} businessId
 * @param {Object} productData
 * @returns {Object} Created product
 */
async function createProduct(businessId, productData) {
  const {
    name,
    type = 'GOODS',
    hsnSac,
    defaultGstRate = 0,
    defaultCessRate = 0,
    unit,
    sellingPrice,
    description
  } = productData;

  try {
    if (!name) {
      throw new Error('Missing required field: name');
    }

    const normalizedType = normalizeType(type);
    if (!VALID_TYPES.includes(normalizedType)) {
      throw new Error(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`);
    }

    const product = await prisma.product.create({
      data: {
        businessId,
        name,
        type: normalizedType,
        hsnSac: hsnSac || null,
        defaultGstRate: defaultGstRate ?? 0,
        defaultCessRate: defaultCessRate ?? 0,
        unit: unit || null,
        sellingPrice: sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== ''
          ? sellingPrice
          : null,
        description: description || null,
        isActive: true
      }
    });

    return {
      success: true,
      message: 'Product created successfully',
      product
    };
  } catch (error) {
    console.error('Create product error:', error);
    throw error;
  }
}

/**
 * Get all products for a business (with search + pagination).
 *
 * @param {string} businessId
 * @param {Object} options
 * @returns {Object} List of products
 */
async function getProducts(businessId, options = {}) {
  const {
    page = 1,
    limit = 50,
    search,
    type,
    isActive = true
  } = options;

  try {
    const skip = (page - 1) * limit;

    const where = {
      businessId,
      isActive
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { hsnSac: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (type) {
      where.type = normalizeType(type);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    return {
      success: true,
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get products error:', error);
    throw error;
  }
}

/**
 * Get a product by ID.
 *
 * @param {string} productId
 * @param {string} businessId
 * @returns {Object} Product details
 */
async function getProductById(productId, businessId) {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessId,
        isActive: true
      }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return {
      success: true,
      product
    };
  } catch (error) {
    console.error('Get product error:', error);
    throw error;
  }
}

/**
 * Update a product.
 *
 * @param {string} productId
 * @param {string} businessId
 * @param {Object} updateData
 * @returns {Object} Updated product
 */
async function updateProduct(productId, businessId, updateData) {
  try {
    const existing = await prisma.product.findFirst({
      where: {
        id: productId,
        businessId,
        isActive: true
      }
    });

    if (!existing) {
      throw new Error('Product not found');
    }

    const sanitizedData = {};
    const allowedFields = [
      'name', 'hsnSac', 'defaultGstRate', 'defaultCessRate',
      'unit', 'sellingPrice', 'description'
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitizedData[field] = updateData[field] === '' ? null : updateData[field];
      }
    }

    if (updateData.type !== undefined) {
      const normalizedType = normalizeType(updateData.type);
      if (!VALID_TYPES.includes(normalizedType)) {
        throw new Error(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`);
      }
      sanitizedData.type = normalizedType;
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: sanitizedData
    });

    return {
      success: true,
      message: 'Product updated successfully',
      product
    };
  } catch (error) {
    console.error('Update product error:', error);
    throw error;
  }
}

/**
 * Soft-delete a product.
 *
 * @param {string} productId
 * @param {string} businessId
 * @returns {Object} Success message
 */
async function deleteProduct(productId, businessId) {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessId,
        isActive: true
      }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    });

    return {
      success: true,
      message: 'Product deleted successfully'
    };
  } catch (error) {
    console.error('Delete product error:', error);
    throw error;
  }
}

module.exports = {
  VALID_TYPES,
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
