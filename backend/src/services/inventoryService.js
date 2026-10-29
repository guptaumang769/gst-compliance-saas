/**
 * Inventory Service (Phase 3: Inventory)
 *
 * Tracks per-product stock (stockQty) with a stock-movement ledger. Adjustments
 * update Product.stockQty and record a StockMovement. All responses { success }.
 */

const prisma = require('../config/database');

const VALID_MOVEMENT_TYPES = ['IN', 'OUT', 'ADJUST'];

/**
 * List inventory items (active products with stock fields).
 */
async function getInventory(businessId, options = {}) {
  const where = { businessId, isActive: true };
  if (options.search) {
    where.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { hsnSac: { contains: options.search, mode: 'insensitive' } }
    ];
  }

  const items = await prisma.product.findMany({
    where,
    orderBy: { name: 'asc' }
  });

  return { success: true, items };
}

/**
 * Adjust stock for a product and record a movement.
 * IN increments, OUT decrements, ADJUST sets an absolute quantity.
 */
async function adjustStock(businessId, { productId, type, qty, reason, refType, refId } = {}) {
  if (!productId) throw new Error('Missing required field: productId');
  const movementType = String(type || '').toUpperCase();
  if (!VALID_MOVEMENT_TYPES.includes(movementType)) {
    throw new Error(`Invalid type. Must be one of: ${VALID_MOVEMENT_TYPES.join(', ')}`);
  }
  const quantity = Number(qty);
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error('Invalid qty. Must be a non-negative number');
  }

  const product = await prisma.product.findFirst({ where: { id: productId, businessId, isActive: true } });
  if (!product) throw new Error('Product not found');

  let stockUpdate;
  if (movementType === 'IN') {
    stockUpdate = { increment: quantity };
  } else if (movementType === 'OUT') {
    stockUpdate = { decrement: quantity };
  } else {
    stockUpdate = { set: quantity };
  }

  const [updatedProduct, movement] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { stockQty: stockUpdate }
    }),
    prisma.stockMovement.create({
      data: {
        businessId,
        productId,
        type: movementType,
        qty: quantity,
        reason: reason || null,
        refType: refType || null,
        refId: refId || null
      }
    })
  ]);

  return {
    success: true,
    message: 'Stock adjusted successfully',
    product: updatedProduct,
    movement
  };
}

/**
 * List stock movements, optionally filtered by product.
 */
async function getMovements(businessId, options = {}) {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 100;
  const skip = (page - 1) * limit;

  const where = { businessId };
  if (options.productId) where.productId = options.productId;

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { id: true, name: true, unit: true } } }
    }),
    prisma.stockMovement.count({ where })
  ]);

  return {
    success: true,
    movements,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
}

/**
 * Products whose stock is at or below the reorder level.
 */
async function getLowStock(businessId) {
  const products = await prisma.product.findMany({
    where: { businessId, isActive: true },
    orderBy: { name: 'asc' }
  });

  const items = products.filter((p) => Number(p.stockQty) <= Number(p.reorderLevel));
  return { success: true, items };
}

module.exports = {
  VALID_MOVEMENT_TYPES,
  getInventory,
  adjustStock,
  getMovements,
  getLowStock
};
