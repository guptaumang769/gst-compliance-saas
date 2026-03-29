/**
 * Purchase Service
 * Handles business logic for purchase invoices and Input Tax Credit (ITC)
 * 
 * Key Concepts:
 * - Purchase Invoice: Invoice received from supplier (expense)
 * - ITC (Input Tax Credit): GST paid on purchases can be claimed back
 * - ITC Eligibility: Not all purchases are eligible for ITC (e.g., personal use, blocked credits)
 * 
 * ITC Calculation Formula:
 * - ITC Amount = CGST + SGST + IGST (on eligible purchases)
 * - Net Tax Payable = Output Tax (Sales) - ITC (Purchases)
 */

const prisma = require('../config/database');
const gstCalculator = require('./gstCalculator');
const { validateGSTIN } = require('../utils/gstValidation');

/**
 * Create a new purchase invoice
 * @param {Object} purchaseData - Purchase invoice data
 * @returns {Promise<Object>} - Created purchase with items
 */
async function createPurchase(purchaseData) {
  const {
    businessId,
    supplierId,
    supplierInvoiceNumber,
    supplierInvoiceDate,
    purchaseType = 'goods', // goods, services, capital_goods, import
    items = [],
    notes,
    reverseCharge = false,
    isItcEligible = true,
    placeOfSupply
  } = purchaseData;

  // Validation
  if (!businessId || !supplierId || !supplierInvoiceNumber || !supplierInvoiceDate || !items || items.length === 0) {
    throw new Error('Missing required fields: businessId, supplierId, supplierInvoiceNumber, supplierInvoiceDate, items');
  }

  // Fetch business and supplier details
  const business = await prisma.business.findFirst({
    where: { id: businessId, isActive: true }
  });

  if (!business) {
    throw new Error('Business not found');
  }

  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, businessId, isActive: true }
  });

  if (!supplier) {
    throw new Error('Supplier not found');
  }

  // Check for duplicate purchase invoice
  const existingPurchase = await prisma.purchase.findFirst({
    where: {
      businessId,
      supplierId,
      supplierInvoiceNumber,
      isActive: true
    }
  });

  if (existingPurchase) {
    throw new Error(`Purchase invoice ${supplierInvoiceNumber} from this supplier already exists`);
  }

  // Calculate GST for each item
  const calculatedItems = items.map((item) => {
    const {
      itemName,
      description,
      hsnCode,
      sacCode,
      quantity,
      unit = 'NOS',
      unitPrice,
      gstRate,
      cessRate = 0,
      discount = 0,
      isItcEligible: itemItcEligible = true
    } = item;

    // Validate item data
    if (!itemName || !quantity || !unitPrice || gstRate === undefined) {
      throw new Error(`Missing required item fields: itemName, quantity, unitPrice, gstRate`);
    }

    // Calculate taxable amount with discount
    const itemSubtotal = parseFloat(quantity) * parseFloat(unitPrice);
    const discountPercent = parseFloat(discount) || 0;
    const itemDiscountAmount = (itemSubtotal * discountPercent) / 100;
    const taxableAmount = itemSubtotal - itemDiscountAmount;

    // Validate taxable amount
    if (!taxableAmount || taxableAmount <= 0) {
      throw new Error(`Invalid taxable amount for item "${itemName}": quantity=${quantity}, unitPrice=${unitPrice}`);
    }

    // Determine supply type (intra-state or inter-state)
    const buyerStateCode = business.stateCode;
    const supplierStateCode = supplier.stateCode;
    
    // For unregistered suppliers without GSTIN, fall back to supplier's state
    // or buyer's state code for GST calculation (treated as intra-state)
    const effectiveSupplierStateCode = supplierStateCode || buyerStateCode;
    
    if (!buyerStateCode) {
      throw new Error('Business does not have a state code. Ensure business has a valid GSTIN.');
    }

    const transactionType = gstCalculator.getTransactionType(effectiveSupplierStateCode, buyerStateCode);

    // Calculate GST for this item
    const gstResult = gstCalculator.calculateItemGST({
      taxableAmount,
      gstRate: parseFloat(gstRate),
      sellerStateCode: effectiveSupplierStateCode,
      buyerStateCode,
      invoiceType: 'b2b',
      cessRate: parseFloat(cessRate) || 0
    });

    // Calculate ITC for this item
    const itcAmount = itemItcEligible && isItcEligible ? gstResult.totalTaxAmount : 0;

    return {
      itemName,
      description: description || null,
      hsnCode: hsnCode || null,
      sacCode: sacCode || null,
      quantity: parseFloat(quantity),
      unit,
      unitPrice: parseFloat(unitPrice),
      discountPercent,
      discountAmount: itemDiscountAmount,
      taxableAmount,
      gstRate: parseFloat(gstRate),
      cgstRate: gstResult.cgstRate,
      cgstAmount: gstResult.cgstAmount,
      sgstRate: gstResult.sgstRate,
      sgstAmount: gstResult.sgstAmount,
      igstRate: gstResult.igstRate,
      igstAmount: gstResult.igstAmount,
      cessRate: parseFloat(cessRate),
      cessAmount: gstResult.cessAmount,
      isItcEligible: itemItcEligible && isItcEligible,
      itcAmount,
      totalAmount: gstResult.totalAmount
    };
  });

  // Calculate purchase totals
  const grossSubtotal = calculatedItems.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice)), 0);
  const totalDiscountAmount = calculatedItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
  const subtotal = grossSubtotal - totalDiscountAmount; // taxable amount after discounts
  const totalTaxAmount = calculatedItems.reduce((sum, item) => sum + item.cgstAmount + item.sgstAmount + item.igstAmount + item.cessAmount, 0);
  const totalAmount = calculatedItems.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalItcAmount = calculatedItems.reduce((sum, item) => sum + item.itcAmount, 0);

  // Aggregate GST amounts
  const cgstAmount = calculatedItems.reduce((sum, item) => sum + item.cgstAmount, 0);
  const sgstAmount = calculatedItems.reduce((sum, item) => sum + item.sgstAmount, 0);
  const igstAmount = calculatedItems.reduce((sum, item) => sum + item.igstAmount, 0);
  const cessAmount = calculatedItems.reduce((sum, item) => sum + item.cessAmount, 0);

  // Create purchase invoice with items (transaction)
  const purchase = await prisma.$transaction(async (tx) => {
    const newPurchase = await tx.purchase.create({
      data: {
        businessId,
        supplierId,
        supplierInvoiceNumber,
        supplierInvoiceDate: new Date(supplierInvoiceDate),
        purchaseType,
        subtotal: grossSubtotal,
        discountAmount: totalDiscountAmount,
        taxableAmount: subtotal,
        cgstAmount,
        sgstAmount,
        igstAmount,
        cessAmount,
        totalTaxAmount,
        totalAmount,
        supplierState: supplier.state,
        supplierStateCode: supplier.stateCode || business.stateCode || '',
        buyerState: business.state,
        buyerStateCode: business.stateCode,
        isItcEligible,
        itcClaimType: isItcEligible ? 'full' : 'none',
        itcAmount: totalItcAmount,
        placeOfSupply: placeOfSupply || business.state,
        reverseCharge,
        notes: notes || null,
        filedInGstr2: false,
        matchedInGstr2a: false,
        isPaid: false
      }
    });

    // Create purchase items
    const createdItems = await Promise.all(
      calculatedItems.map((item) =>
        tx.purchaseItem.create({
          data: {
            purchaseId: newPurchase.id,
            ...item
          }
        })
      )
    );

    return { ...newPurchase, items: createdItems };
  });

  return purchase;
}

/**
 * Get all purchases for a business
 * @param {string} businessId - Business ID
 * @param {Object} filters - Optional filters (supplierId, startDate, endDate, purchaseType)
 * @returns {Promise<Array>} - List of purchases
 */
async function getPurchases(businessId, filters = {}) {
  const { supplierId, startDate, endDate, purchaseType, isItcEligible, search, status, page = 1, limit = 50 } = filters;

  const where = {
    businessId,
    isActive: true
  };

  if (supplierId) {
    where.supplierId = supplierId;
  }

  if (purchaseType) {
    where.purchaseType = purchaseType;
  }

  if (isItcEligible !== undefined) {
    where.isItcEligible = isItcEligible === 'true' || isItcEligible === true;
  }

  if (startDate || endDate) {
    where.supplierInvoiceDate = {};
    if (startDate) {
      where.supplierInvoiceDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.supplierInvoiceDate.lte = new Date(endDate);
    }
  }

  // Search by supplier name or invoice number
  if (search) {
    where.OR = [
      { supplierInvoiceNumber: { contains: search, mode: 'insensitive' } },
      { supplier: { supplierName: { contains: search, mode: 'insensitive' } } }
    ];
  }

  // Filter by payment status
  if (status) {
    switch (status.toLowerCase()) {
      case 'paid':
        where.isPaid = true;
        break;
      case 'pending':
        where.isPaid = false;
        break;
    }
  }

  const skip = (page - 1) * limit;

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            supplierName: true,
            gstin: true,
            state: true,
            stateCode: true
          }
        },
        items: true
      },
      orderBy: { supplierInvoiceDate: 'desc' },
      skip,
      take: limit
    }),
    prisma.purchase.count({ where })
  ]);

  return {
    purchases,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get a single purchase by ID
 * @param {string} purchaseId - Purchase ID
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} - Purchase details
 */
async function getPurchaseById(purchaseId, businessId) {
  const purchase = await prisma.purchase.findFirst({
    where: {
      id: purchaseId,
      businessId,
      isActive: true
    },
    include: {
      supplier: true,
      items: true
    }
  });

  if (!purchase) {
    throw new Error('Purchase not found');
  }

  return purchase;
}

/**
 * Update a purchase invoice
 * @param {string} purchaseId - Purchase ID
 * @param {string} businessId - Business ID
 * @param {Object} updateData - Updated data
 * @returns {Promise<Object>} - Updated purchase
 */
async function updatePurchase(purchaseId, businessId, updateData) {
  const purchase = await getPurchaseById(purchaseId, businessId);

  // Check if already filed in GSTR-2
  if (purchase.filedInGstr2) {
    throw new Error('Cannot update purchase: already filed in GSTR-2');
  }

  const { notes, isPaid, paymentDate, paymentMethod, isItcEligible, itcClaimType, items, reverseCharge } = updateData;

  // If items are being updated, recalculate GST
  if (items && items.length > 0) {
    const business = await prisma.business.findFirst({
      where: { id: businessId, isActive: true }
    });

    const supplier = await prisma.supplier.findFirst({
      where: { id: purchase.supplierId, businessId, isActive: true }
    });

    if (!business || !supplier) {
      throw new Error('Business or supplier not found');
    }

    const buyerStateCode = business.stateCode;
    const effectiveSupplierStateCode = supplier.stateCode || buyerStateCode;

    // Recalculate GST for each item
    const calculatedItems = items.map((item) => {
      const itemName = item.itemName || item.description;
      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unitPrice);
      const gstRate = parseFloat(item.gstRate);
      const cessRate = parseFloat(item.cessRate || 0);
      const discountPercent = parseFloat(item.discount || item.discountPercent || 0);
      const itemSubtotal = quantity * unitPrice;
      const itemDiscountAmount = (itemSubtotal * discountPercent) / 100;
      const taxableAmount = itemSubtotal - itemDiscountAmount;

      const gstResult = gstCalculator.calculateItemGST({
        taxableAmount,
        gstRate,
        sellerStateCode: effectiveSupplierStateCode,
        buyerStateCode,
        invoiceType: 'b2b',
        cessRate
      });

      const itcAmount = (isItcEligible !== undefined ? isItcEligible : purchase.isItcEligible) 
        ? gstResult.totalTaxAmount : 0;

      return {
        itemName,
        description: item.description || null,
        hsnCode: item.hsnCode || null,
        sacCode: item.sacCode || null,
        quantity,
        unit: item.unit || 'NOS',
        unitPrice,
        discountPercent,
        discountAmount: itemDiscountAmount,
        taxableAmount,
        gstRate,
        cgstRate: gstResult.cgstRate,
        cgstAmount: gstResult.cgstAmount,
        sgstRate: gstResult.sgstRate,
        sgstAmount: gstResult.sgstAmount,
        igstRate: gstResult.igstRate,
        igstAmount: gstResult.igstAmount,
        cessRate,
        cessAmount: gstResult.cessAmount,
        isItcEligible: isItcEligible !== undefined ? isItcEligible : purchase.isItcEligible,
        itcAmount,
        totalAmount: gstResult.totalAmount
      };
    });

    // Recalculate totals
    const updGrossSubtotal = calculatedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const updTotalDiscount = calculatedItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const updTaxableAmount = updGrossSubtotal - updTotalDiscount;
    const totalTaxAmount = calculatedItems.reduce((sum, item) => sum + item.cgstAmount + item.sgstAmount + item.igstAmount + item.cessAmount, 0);
    const totalAmount = calculatedItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalItcAmount = calculatedItems.reduce((sum, item) => sum + item.itcAmount, 0);
    const cgstAmount = calculatedItems.reduce((sum, item) => sum + item.cgstAmount, 0);
    const sgstAmount = calculatedItems.reduce((sum, item) => sum + item.sgstAmount, 0);
    const igstAmount = calculatedItems.reduce((sum, item) => sum + item.igstAmount, 0);
    const cessAmount = calculatedItems.reduce((sum, item) => sum + item.cessAmount, 0);

    // Transaction: delete old items, create new, update purchase
    const updatedPurchase = await prisma.$transaction(async (tx) => {
      // Delete old items
      await tx.purchaseItem.deleteMany({
        where: { purchaseId }
      });

      // Create new items
      for (const calcItem of calculatedItems) {
        await tx.purchaseItem.create({
          data: {
            purchaseId,
            ...calcItem
          }
        });
      }

      // Update purchase totals
      return tx.purchase.update({
        where: { id: purchaseId },
        data: {
          supplierInvoiceNumber: updateData.supplierInvoiceNumber || purchase.supplierInvoiceNumber,
          supplierInvoiceDate: updateData.supplierInvoiceDate ? new Date(updateData.supplierInvoiceDate) : purchase.supplierInvoiceDate,
          subtotal: updGrossSubtotal,
          discountAmount: updTotalDiscount,
          taxableAmount: updTaxableAmount,
          cgstAmount,
          sgstAmount,
          igstAmount,
          cessAmount,
          totalTaxAmount,
          totalAmount,
          itcAmount: totalItcAmount,
          notes: notes !== undefined ? notes : purchase.notes,
          isPaid: isPaid !== undefined ? isPaid : purchase.isPaid,
          isItcEligible: isItcEligible !== undefined ? isItcEligible : purchase.isItcEligible,
          reverseCharge: reverseCharge !== undefined ? reverseCharge : purchase.reverseCharge,
        },
        include: {
          supplier: true,
          items: true
        }
      });
    });

    return updatedPurchase;
  }

  // Simple update (no items change)
  const updatedPurchase = await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      notes: notes !== undefined ? notes : purchase.notes,
      isPaid: isPaid !== undefined ? isPaid : purchase.isPaid,
      paymentDate: paymentDate !== undefined ? (paymentDate ? new Date(paymentDate) : null) : purchase.paymentDate,
      paymentMethod: paymentMethod !== undefined ? paymentMethod : purchase.paymentMethod,
      isItcEligible: isItcEligible !== undefined ? isItcEligible : purchase.isItcEligible,
      itcClaimType: itcClaimType !== undefined ? itcClaimType : purchase.itcClaimType,
      itcAmount: isItcEligible !== undefined && !isItcEligible ? 0 : purchase.itcAmount,
      reverseCharge: reverseCharge !== undefined ? reverseCharge : purchase.reverseCharge
    },
    include: {
      supplier: true,
      items: true
    }
  });

  return updatedPurchase;
}

/**
 * Delete a purchase (soft delete)
 * @param {string} purchaseId - Purchase ID
 * @param {string} businessId - Business ID
 * @returns {Promise<void>}
 */
async function deletePurchase(purchaseId, businessId) {
  const purchase = await getPurchaseById(purchaseId, businessId);

  // Check if already filed
  if (purchase.filedInGstr2) {
    throw new Error('Cannot delete purchase: already filed in GSTR-2');
  }

  await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      isActive: false,
      deletedAt: new Date()
    }
  });
}

/**
 * Get purchase statistics for a business
 * @param {string} businessId - Business ID
 * @param {Object} filters - Optional filters (startDate, endDate)
 * @returns {Promise<Object>} - Purchase statistics
 */
async function getPurchaseStats(businessId, filters = {}) {
  const { startDate, endDate, month, year } = filters;

  const where = {
    businessId,
    isActive: true
  };

  // Date filtering
  if (month && year) {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    where.supplierInvoiceDate = {
      gte: monthStart,
      lte: monthEnd
    };
  } else if (startDate || endDate) {
    where.supplierInvoiceDate = {};
    if (startDate) {
      where.supplierInvoiceDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.supplierInvoiceDate.lte = new Date(endDate);
    }
  }

  // Get aggregated statistics
  const [totalPurchases, totalPurchaseAmount, totalItcAvailable, itcEligiblePurchases] = await Promise.all([
    prisma.purchase.count({ where }),
    prisma.purchase.aggregate({
      where,
      _sum: { totalAmount: true }
    }),
    prisma.purchase.aggregate({
      where: { ...where, isItcEligible: true },
      _sum: { itcAmount: true }
    }),
    prisma.purchase.count({
      where: { ...where, isItcEligible: true }
    })
  ]);

  // Get purchase type breakdown
  const purchasesByType = await prisma.purchase.groupBy({
    by: ['purchaseType'],
    where,
    _sum: {
      totalAmount: true,
      itcAmount: true
    },
    _count: true
  });

  return {
    totalPurchases,
    totalPurchaseAmount: totalPurchaseAmount._sum.totalAmount || 0,
    totalItcAvailable: totalItcAvailable._sum.itcAmount || 0,
    itcEligiblePurchases,
    purchasesByType: purchasesByType.map((item) => ({
      purchaseType: item.purchaseType,
      count: item._count,
      totalAmount: item._sum.totalAmount || 0,
      itcAmount: item._sum.itcAmount || 0
    }))
  };
}

/**
 * Calculate total ITC available for a period
 * Used for GSTR-3B return
 * @param {string} businessId - Business ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (YYYY)
 * @returns {Promise<Object>} - ITC breakdown
 */
async function calculateItcForPeriod(businessId, month, year) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  const where = {
    businessId,
    isActive: true,
    isItcEligible: true,
    supplierInvoiceDate: {
      gte: monthStart,
      lte: monthEnd
    }
  };

  // Get ITC breakdown by tax type
  const purchases = await prisma.purchase.findMany({
    where,
    select: {
      id: true,
      cgstAmount: true,
      sgstAmount: true,
      igstAmount: true,
      cessAmount: true,
      itcAmount: true,
      purchaseType: true
    }
  });

  const itcBreakdown = {
    totalItc: 0,
    cgstItc: 0,
    sgstItc: 0,
    igstItc: 0,
    cessItc: 0,
    byPurchaseType: {}
  };

  purchases.forEach((purchase) => {
    itcBreakdown.totalItc += parseFloat(purchase.itcAmount);
    itcBreakdown.cgstItc += parseFloat(purchase.cgstAmount);
    itcBreakdown.sgstItc += parseFloat(purchase.sgstAmount);
    itcBreakdown.igstItc += parseFloat(purchase.igstAmount);
    itcBreakdown.cessItc += parseFloat(purchase.cessAmount);

    // Group by purchase type
    if (!itcBreakdown.byPurchaseType[purchase.purchaseType]) {
      itcBreakdown.byPurchaseType[purchase.purchaseType] = {
        totalItc: 0,
        count: 0
      };
    }
    itcBreakdown.byPurchaseType[purchase.purchaseType].totalItc += parseFloat(purchase.itcAmount);
    itcBreakdown.byPurchaseType[purchase.purchaseType].count += 1;
  });

  return {
    month,
    year,
    period: `${year}-${String(month).padStart(2, '0')}`,
    itcBreakdown,
    purchaseCount: purchases.length
  };
}

module.exports = {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  getPurchaseStats,
  calculateItcForPeriod
};
