/**
 * GST Calculator Service
 * CRITICAL MODULE - Core GST calculation logic
 * Week 3-4: Invoice Management
 * 
 * This service handles:
 * 1. CGST/SGST vs IGST determination (based on state)
 * 2. Tax amount calculations
 * 3. Invoice totals
 * 4. Support for multiple tax rates
 * 
 * GST Rules:
 * - Intra-state transaction (same state): CGST + SGST (split 50-50)
 * - Inter-state transaction (different states): IGST (full rate)
 * - Export: IGST 0%
 * - SEZ: IGST 0% (with LUT/bond)
 */

/**
 * Valid GST rates in India (2026 Streamlined Structure)
 * 
 * Rate Slabs:
 * - 0%: Exempt/Nil-rated (fresh vegetables, milk, bread, health/life insurance)
 * - 0.25%: Precious stones and diamonds
 * - 3%: Gold and precious metals
 * - 5%: Essentials (packaged food, medicines, spices, small household items)
 * - 18%: Standard/Default (electronics, software, banking, telecom, construction/cement)
 * - 40%: Luxury/Sin (high-end cars, tobacco, aerated drinks, gambling)
 * 
 * Note: 12% and 28% rates were abolished in 2025-26 reforms
 */
const VALID_GST_RATES = [0, 0.25, 3, 5, 18, 40];

/**
 * Calculate GST for a single line item
 * This is the CORE CALCULATION function
 * 
 * @param {Object} params - Calculation parameters
 * @param {number} params.taxableAmount - Amount before tax
 * @param {number} params.gstRate - GST rate (0, 0.25, 3, 5, 18, 40)
 * @param {string} params.sellerStateCode - Seller's state code (from GSTIN)
 * @param {string} params.buyerStateCode - Buyer's state code (from GSTIN)
 * @param {string} params.invoiceType - b2b, b2c_large, b2c_small, export, sez
 * @param {number} params.cessRate - Cess rate (optional, default 0)
 * @returns {Object} GST breakdown
 */
function calculateItemGST(params) {
  const {
    taxableAmount,
    gstRate,
    sellerStateCode,
    buyerStateCode,
    invoiceType = 'b2b',
    cessRate = 0
  } = params;
  
  // Validate inputs
  if (taxableAmount === undefined || taxableAmount === null || isNaN(taxableAmount) || taxableAmount <= 0) {
    throw new Error('Taxable amount must be a positive number');
  }
  
  if (!VALID_GST_RATES.includes(gstRate)) {
    throw new Error(`Invalid GST rate: ${gstRate}%. Valid rates (2026): ${VALID_GST_RATES.join(', ')}%`);
  }
  
  if (!sellerStateCode) {
    throw new Error('Seller state code is required');
  }
  
  // Convert to numbers for calculation
  const amount = parseFloat(taxableAmount);
  const rate = parseFloat(gstRate);
  const cess = parseFloat(cessRate);
  
  // Calculate total GST amount
  const totalGstAmount = (amount * rate) / 100;
  const cessAmount = (amount * cess) / 100;
  
  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;
  
  // ============================================
  // CRITICAL GST LOGIC: Determine CGST/SGST vs IGST
  // ============================================
  
  // Case 1: Export or SEZ - IGST 0%
  if (invoiceType === 'export' || invoiceType === 'sez') {
    igstRate = 0;
    igstAmount = 0;
  }
  // Case 2: Intra-state (same state) - CGST + SGST
  else if (sellerStateCode === buyerStateCode) {
    cgstRate = rate / 2;
    sgstRate = rate / 2;
    cgstAmount = totalGstAmount / 2;
    sgstAmount = totalGstAmount / 2;
    igstRate = 0;
    igstAmount = 0;
  }
  // Case 3: Inter-state (different states) - IGST
  else {
    cgstRate = 0;
    cgstAmount = 0;
    sgstRate = 0;
    sgstAmount = 0;
    igstRate = rate;
    igstAmount = totalGstAmount;
  }
  
  // Calculate total amount
  const totalTaxAmount = cgstAmount + sgstAmount + igstAmount + cessAmount;
  const totalAmount = amount + totalTaxAmount;
  
  return {
    taxableAmount: roundTo2Decimals(amount),
    gstRate: rate,
    
    // CGST
    cgstRate: roundTo2Decimals(cgstRate),
    cgstAmount: roundTo2Decimals(cgstAmount),
    
    // SGST
    sgstRate: roundTo2Decimals(sgstRate),
    sgstAmount: roundTo2Decimals(sgstAmount),
    
    // IGST
    igstRate: roundTo2Decimals(igstRate),
    igstAmount: roundTo2Decimals(igstAmount),
    
    // Cess
    cessRate: roundTo2Decimals(cess),
    cessAmount: roundTo2Decimals(cessAmount),
    
    // Totals
    totalTaxAmount: roundTo2Decimals(totalTaxAmount),
    totalAmount: roundTo2Decimals(totalAmount),
    
    // Tax type for reference
    taxType: igstAmount > 0 ? 'IGST' : (cgstAmount > 0 ? 'CGST+SGST' : 'NONE')
  };
}

/**
 * Calculate GST for an entire invoice with multiple line items
 * 
 * @param {Object} params - Invoice parameters
 * @param {Array} params.items - Array of invoice items
 * @param {string} params.sellerStateCode - Seller's state code
 * @param {string} params.buyerStateCode - Buyer's state code
 * @param {string} params.invoiceType - Invoice type
 * @param {number} params.discountAmount - Invoice-level discount (optional)
 * @returns {Object} Invoice totals with GST breakdown
 */
function calculateInvoiceGST(params) {
  const {
    items,
    sellerStateCode,
    buyerStateCode,
    invoiceType = 'b2b',
    discountAmount = 0
  } = params;
  
  if (!items || items.length === 0) {
    throw new Error('Invoice must have at least one item');
  }
  
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCess = 0;
  
  const calculatedItems = [];
  
  // Calculate GST for each item
  for (const item of items) {
    // Calculate item subtotal (quantity * unit price)
    const itemSubtotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
    
    // Apply item-level discount if any
    const itemDiscountAmount = item.discountAmount || 0;
    const itemTaxableAmount = itemSubtotal - itemDiscountAmount;
    
    // Calculate GST for this item
    const itemGst = calculateItemGST({
      taxableAmount: itemTaxableAmount,
      gstRate: item.gstRate,
      sellerStateCode,
      buyerStateCode,
      invoiceType,
      cessRate: item.cessRate || 0
    });
    
    // Add to totals
    subtotal += itemSubtotal;
    totalCgst += itemGst.cgstAmount;
    totalSgst += itemGst.sgstAmount;
    totalIgst += itemGst.igstAmount;
    totalCess += itemGst.cessAmount;
    
    // Store calculated item
    calculatedItems.push({
      ...item,
      subtotal: itemSubtotal,
      taxableAmount: itemTaxableAmount,
      ...itemGst
    });
  }
  
  // Apply invoice-level discount
  const invoiceDiscountAmount = parseFloat(discountAmount);
  const taxableAmount = subtotal - invoiceDiscountAmount;
  
  // Calculate totals
  const totalTaxAmount = totalCgst + totalSgst + totalIgst + totalCess;
  const totalAmount = taxableAmount + totalTaxAmount;
  
  // Round off to nearest rupee (optional)
  const roundedTotal = Math.round(totalAmount);
  const roundOffAmount = roundedTotal - totalAmount;
  
  return {
    items: calculatedItems,
    
    // Subtotals
    subtotal: roundTo2Decimals(subtotal),
    discountAmount: roundTo2Decimals(invoiceDiscountAmount),
    taxableAmount: roundTo2Decimals(taxableAmount),
    
    // GST Breakdown
    cgstAmount: roundTo2Decimals(totalCgst),
    sgstAmount: roundTo2Decimals(totalSgst),
    igstAmount: roundTo2Decimals(totalIgst),
    cessAmount: roundTo2Decimals(totalCess),
    totalTaxAmount: roundTo2Decimals(totalTaxAmount),
    
    // Final totals
    totalAmount: roundTo2Decimals(totalAmount),
    roundOffAmount: roundTo2Decimals(roundOffAmount),
    finalAmount: roundedTotal,
    
    // Tax type
    taxType: totalIgst > 0 ? 'IGST' : (totalCgst > 0 ? 'CGST+SGST' : 'NONE')
  };
}

/**
 * Validate if transaction is intra-state or inter-state
 * 
 * @param {string} sellerStateCode - Seller's state code
 * @param {string} buyerStateCode - Buyer's state code
 * @returns {Object} Transaction type info
 */
function getTransactionType(sellerStateCode, buyerStateCode) {
  if (!sellerStateCode || !buyerStateCode) {
    return {
      type: 'unknown',
      isIntraState: false,
      isInterState: false,
      taxType: 'unknown'
    };
  }
  
  const isIntraState = sellerStateCode === buyerStateCode;
  
  return {
    type: isIntraState ? 'intra-state' : 'inter-state',
    isIntraState,
    isInterState: !isIntraState,
    taxType: isIntraState ? 'CGST+SGST' : 'IGST',
    sellerStateCode,
    buyerStateCode
  };
}

/**
 * Validate GST rate
 * 
 * @param {number} rate - GST rate to validate
 * @returns {boolean} True if valid
 */
function isValidGSTRate(rate) {
  return VALID_GST_RATES.includes(parseFloat(rate));
}

/**
 * Get applicable GST rate for HSN/SAC code
 * This is a simplified version - in production, this would query a database
 * 
 * @param {string} hsnCode - HSN code
 * @param {string} sacCode - SAC code
 * @returns {number} GST rate
 */
function getApplicableGSTRate(hsnCode, sacCode) {
  // TODO: Implement HSN/SAC to GST rate mapping
  // For now, return default rates based on common categories
  
  if (hsnCode) {
    // Common HSN codes and their rates
    const hsnRates = {
      '1001': 0,    // Wheat (0%)
      '1006': 0,    // Rice (0%)
      '0401': 0,    // Milk (0%)
      '6204': 12,   // Women's clothing (12%)
      '8517': 18,   // Mobile phones (18%)
      '8703': 28,   // Cars (28%)
    };
    
    const prefix = hsnCode.substring(0, 4);
    return hsnRates[prefix] || 18; // Default 18%
  }
  
  if (sacCode) {
    // Common SAC codes and their rates
    const sacRates = {
      '9963': 18,   // Restaurant services (18%)
      '9973': 18,   // Professional services (18%)
      '9982': 12,   // Transport services (12%)
    };
    
    const prefix = sacCode.substring(0, 4);
    return sacRates[prefix] || 18; // Default 18%
  }
  
  return 18; // Default rate
}

/**
 * Round to 2 decimal places
 * 
 * @param {number} value - Value to round
 * @returns {number} Rounded value
 */
function roundTo2Decimals(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate reverse charge applicability
 * 
 * @param {Object} params - Parameters
 * @returns {boolean} True if reverse charge applies
 */
function isReverseChargeApplicable(params) {
  const { supplierType, recipientType, goodsOrServices } = params;
  
  // Simplified reverse charge logic
  // In production, this would be more complex
  
  // Reverse charge applies when:
  // 1. Unregistered supplier to registered recipient
  // 2. GTA services
  // 3. Legal services
  // 4. Director services
  // etc.
  
  if (supplierType === 'unregistered' && recipientType === 'registered') {
    return true;
  }
  
  return false;
}

module.exports = {
  calculateItemGST,
  calculateInvoiceGST,
  getTransactionType,
  isValidGSTRate,
  getApplicableGSTRate,
  isReverseChargeApplicable,
  VALID_GST_RATES
};
