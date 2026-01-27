/**
 * GSTR-1 Service
 * Generates GSTR-1 (Statement of Outward Supplies) - Monthly/Quarterly Sales Return
 * 
 * GSTR-1 Structure:
 * - B2B: Business-to-Business supplies (with recipient GSTIN)
 * - B2CL: B2C Large invoices (invoice value > ₹2.5 lakh)
 * - B2CS: B2C Small invoices (aggregated by state + rate)
 * - CDNR: Credit/Debit Notes (Registered)
 * - CDNUR: Credit/Debit Notes (Unregistered)
 * - EXP: Exports
 * - HSN: HSN Summary (compulsory for turnover > ₹5 crore)
 * 
 * Filing Frequency:
 * - Monthly: Turnover > ₹5 crore (due 11th of next month)
 * - Quarterly: Turnover ≤ ₹5 crore (due 13th of month following quarter)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generate GSTR-1 return for a specific period
 * @param {string} businessId - Business ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (YYYY)
 * @returns {Promise<Object>} - GSTR-1 return data
 */
async function generateGSTR1(businessId, month, year) {
  // Validate inputs
  if (!businessId || !month || !year) {
    throw new Error('Missing required parameters: businessId, month, year');
  }

  if (month < 1 || month > 12) {
    throw new Error('Month must be between 1 and 12');
  }

  // Get business details
  const business = await prisma.business.findFirst({
    where: { id: businessId, isActive: true }
  });

  if (!business) {
    throw new Error('Business not found');
  }

  // Calculate period dates
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);
  const filingPeriod = `${year}-${String(month).padStart(2, '0')}`;

  // Get all invoices for the period
  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      isActive: true,
      invoiceDate: {
        gte: periodStart,
        lte: periodEnd
      }
    },
    include: {
      customer: true,
      items: true
    },
    orderBy: { invoiceDate: 'asc' }
  });

  // Generate GSTR-1 sections
  const b2b = await generateB2B(invoices, business);
  const b2cl = await generateB2CL(invoices, business);
  const b2cs = await generateB2CS(invoices, business);
  const exp = await generateEXP(invoices, business);
  const hsn = await generateHSN(invoices, business);

  // Calculate summary
  const summary = calculateSummary(invoices);

  // Prepare complete GSTR-1 data
  const gstr1Data = {
    gstin: business.gstin,
    fp: filingPeriod, // Filing Period
    gt: summary.grossTurnover, // Gross Turnover
    cur_gt: summary.grossTurnover, // Current period turnover
    
    // Main sections
    b2b: b2b.data,
    b2cl: b2cl.data,
    b2cs: b2cs.data,
    exp: exp.data,
    hsn: hsn.data,
    
    // Summary counters
    summary: {
      totalInvoices: invoices.length,
      b2bInvoices: b2b.count,
      b2clInvoices: b2cl.count,
      b2csInvoices: b2cs.count,
      exportInvoices: exp.count,
      totalTaxableValue: summary.totalTaxableValue,
      totalCGST: summary.totalCGST,
      totalSGST: summary.totalSGST,
      totalIGST: summary.totalIGST,
      totalCess: summary.totalCess,
      totalTax: summary.totalTax,
      totalInvoiceValue: summary.totalInvoiceValue
    }
  };

  // Save or update GSTR-1 return
  const gstr1Return = await saveGSTR1(businessId, filingPeriod, year, gstr1Data);

  return {
    returnId: gstr1Return.id,
    businessName: business.businessName,
    gstin: business.gstin,
    filingPeriod,
    status: gstr1Return.status,
    generatedAt: gstr1Return.generatedAt,
    data: gstr1Data
  };
}

/**
 * Generate B2B section (Business-to-Business supplies)
 * Format: Customer-wise invoices with GSTIN
 */
async function generateB2B(invoices, business) {
  const b2bInvoices = invoices.filter(inv => 
    inv.invoiceType === 'b2b' && 
    inv.customer?.gstin
  );

  // Group by customer GSTIN
  const customerGroups = {};
  
  for (const invoice of b2bInvoices) {
    const ctin = invoice.customer.gstin;
    
    if (!customerGroups[ctin]) {
      customerGroups[ctin] = {
        ctin, // Customer/Recipient GSTIN
        cname: invoice.customer.customerName, // Not mandatory but useful
        inv: []
      };
    }

    // Invoice details
    const invoiceData = {
      inum: invoice.invoiceNumber, // Invoice Number
      idt: formatDate(invoice.invoiceDate), // Invoice Date
      val: parseFloat(invoice.totalAmount), // Invoice Value
      pos: invoice.buyerStateCode || invoice.customer.stateCode, // Place of Supply
      rchrg: invoice.reverseCharge ? 'Y' : 'N', // Reverse Charge
      inv_typ: 'R', // Regular invoice
      
      // Item details (rate-wise)
      itms: groupItemsByRate(invoice.items)
    };

    customerGroups[ctin].inv.push(invoiceData);
  }

  return {
    data: Object.values(customerGroups),
    count: b2bInvoices.length
  };
}

/**
 * Generate B2CL section (B2C Large - invoice value > ₹2.5 lakh)
 */
async function generateB2CL(invoices, business) {
  const b2clInvoices = invoices.filter(inv => 
    (inv.invoiceType === 'b2c' || inv.invoiceType === 'b2c_large') &&
    parseFloat(inv.totalAmount) > 250000 && // > ₹2.5 lakh
    !inv.customer?.gstin
  );

  const b2clData = b2clInvoices.map(invoice => ({
    pos: invoice.buyerStateCode || business.stateCode, // Place of Supply
    inv: [{
      inum: invoice.invoiceNumber,
      idt: formatDate(invoice.invoiceDate),
      val: parseFloat(invoice.totalAmount),
      
      // Item details
      itms: groupItemsByRate(invoice.items)
    }]
  }));

  return {
    data: b2clData,
    count: b2clInvoices.length
  };
}

/**
 * Generate B2CS section (B2C Small - aggregated)
 * Grouped by: Place of Supply + Tax Rate
 */
async function generateB2CS(invoices, business) {
  const b2csInvoices = invoices.filter(inv => 
    (inv.invoiceType === 'b2c' || inv.invoiceType === 'b2c_small') &&
    parseFloat(inv.totalAmount) <= 250000 && // ≤ ₹2.5 lakh
    !inv.customer?.gstin
  );

  // Aggregate by state + rate
  const aggregates = {};

  for (const invoice of b2csInvoices) {
    const pos = invoice.buyerStateCode || business.stateCode;
    const supplyType = invoice.sellerStateCode === pos ? 'Intra' : 'Inter';

    for (const item of invoice.items) {
      const rate = parseFloat(item.gstRate);
      const key = `${pos}_${rate}_${supplyType}`;

      if (!aggregates[key]) {
        aggregates[key] = {
          pos,
          sply_ty: supplyType === 'Intra' ? 'INTRA' : 'INTER',
          rt: rate,
          txval: 0,
          iamt: 0, // IGST
          camt: 0, // CGST
          samt: 0, // SGST
          csamt: 0 // Cess
        };
      }

      aggregates[key].txval += parseFloat(item.taxableAmount);
      aggregates[key].iamt += parseFloat(item.igstAmount);
      aggregates[key].camt += parseFloat(item.cgstAmount);
      aggregates[key].samt += parseFloat(item.sgstAmount);
      aggregates[key].csamt += parseFloat(item.cessAmount);
    }
  }

  // Round all amounts
  Object.values(aggregates).forEach(agg => {
    agg.txval = parseFloat(agg.txval.toFixed(2));
    agg.iamt = parseFloat(agg.iamt.toFixed(2));
    agg.camt = parseFloat(agg.camt.toFixed(2));
    agg.samt = parseFloat(agg.samt.toFixed(2));
    agg.csamt = parseFloat(agg.csamt.toFixed(2));
  });

  return {
    data: Object.values(aggregates),
    count: b2csInvoices.length
  };
}

/**
 * Generate EXP section (Exports)
 */
async function generateEXP(invoices, business) {
  const exportInvoices = invoices.filter(inv => 
    inv.invoiceType === 'export' || inv.invoiceType === 'sez'
  );

  const expData = exportInvoices.map(invoice => ({
    exp_typ: invoice.invoiceType === 'sez' ? 'WPAY' : 'WOPAY', // With/Without Payment
    inv: [{
      inum: invoice.invoiceNumber,
      idt: formatDate(invoice.invoiceDate),
      val: parseFloat(invoice.totalAmount),
      sbpcode: '', // Shipping Bill Port Code (optional)
      sbnum: '', // Shipping Bill Number (optional)
      sbdt: '', // Shipping Bill Date (optional)
      
      // Item details
      itms: groupItemsByRate(invoice.items)
    }]
  }));

  return {
    data: expData,
    count: exportInvoices.length
  };
}

/**
 * Generate HSN Summary
 * Required for businesses with turnover > ₹5 crore
 */
async function generateHSN(invoices, business) {
  const hsnAggregates = {};

  for (const invoice of invoices) {
    for (const item of invoice.items) {
      const hsn = item.hsnCode || item.sacCode || 'NA';
      const rate = parseFloat(item.gstRate);
      const key = `${hsn}_${rate}`;

      if (!hsnAggregates[key]) {
        hsnAggregates[key] = {
          num: 1, // Serial Number (will be set later)
          hsn_sc: hsn, // HSN/SAC Code
          desc: item.itemName, // Description
          uqc: item.unit || 'NOS', // Unit Quantity Code
          qty: 0, // Total Quantity
          val: 0, // Taxable Value
          txval: 0, // Taxable Value
          rt: rate, // GST Rate
          iamt: 0, // IGST
          camt: 0, // CGST
          samt: 0, // SGST
          csamt: 0 // Cess
        };
      }

      hsnAggregates[key].qty += parseFloat(item.quantity);
      hsnAggregates[key].val += parseFloat(item.taxableAmount);
      hsnAggregates[key].txval += parseFloat(item.taxableAmount);
      hsnAggregates[key].iamt += parseFloat(item.igstAmount);
      hsnAggregates[key].camt += parseFloat(item.cgstAmount);
      hsnAggregates[key].samt += parseFloat(item.sgstAmount);
      hsnAggregates[key].csamt += parseFloat(item.cessAmount);
    }
  }

  // Convert to array and assign serial numbers
  const hsnData = Object.values(hsnAggregates).map((item, index) => ({
    ...item,
    num: index + 1,
    qty: parseFloat(item.qty.toFixed(2)),
    val: parseFloat(item.val.toFixed(2)),
    txval: parseFloat(item.txval.toFixed(2)),
    iamt: parseFloat(item.iamt.toFixed(2)),
    camt: parseFloat(item.camt.toFixed(2)),
    samt: parseFloat(item.samt.toFixed(2)),
    csamt: parseFloat(item.csamt.toFixed(2))
  }));

  return {
    data: { data: hsnData },
    count: hsnData.length
  };
}

/**
 * Group invoice items by tax rate
 */
function groupItemsByRate(items) {
  const rateGroups = {};

  for (const item of items) {
    const rate = parseFloat(item.gstRate);
    
    if (!rateGroups[rate]) {
      rateGroups[rate] = {
        num: Object.keys(rateGroups).length + 1,
        itm_det: {
          rt: rate,
          txval: 0,
          iamt: 0,
          camt: 0,
          samt: 0,
          csamt: 0
        }
      };
    }

    rateGroups[rate].itm_det.txval += parseFloat(item.taxableAmount);
    rateGroups[rate].itm_det.iamt += parseFloat(item.igstAmount);
    rateGroups[rate].itm_det.camt += parseFloat(item.cgstAmount);
    rateGroups[rate].itm_det.samt += parseFloat(item.sgstAmount);
    rateGroups[rate].itm_det.csamt += parseFloat(item.cessAmount);
  }

  // Round all amounts
  return Object.values(rateGroups).map(group => ({
    ...group,
    itm_det: {
      ...group.itm_det,
      txval: parseFloat(group.itm_det.txval.toFixed(2)),
      iamt: parseFloat(group.itm_det.iamt.toFixed(2)),
      camt: parseFloat(group.itm_det.camt.toFixed(2)),
      samt: parseFloat(group.itm_det.samt.toFixed(2)),
      csamt: parseFloat(group.itm_det.csamt.toFixed(2))
    }
  }));
}

/**
 * Calculate summary totals
 */
function calculateSummary(invoices) {
  let totalTaxableValue = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;
  let totalCess = 0;
  let totalInvoiceValue = 0;

  for (const invoice of invoices) {
    totalTaxableValue += parseFloat(invoice.taxableAmount);
    totalCGST += parseFloat(invoice.cgstAmount);
    totalSGST += parseFloat(invoice.sgstAmount);
    totalIGST += parseFloat(invoice.igstAmount);
    totalCess += parseFloat(invoice.cessAmount);
    totalInvoiceValue += parseFloat(invoice.totalAmount);
  }

  const totalTax = totalCGST + totalSGST + totalIGST + totalCess;
  const grossTurnover = totalInvoiceValue;

  return {
    totalTaxableValue: parseFloat(totalTaxableValue.toFixed(2)),
    totalCGST: parseFloat(totalCGST.toFixed(2)),
    totalSGST: parseFloat(totalSGST.toFixed(2)),
    totalIGST: parseFloat(totalIGST.toFixed(2)),
    totalCess: parseFloat(totalCess.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2)),
    totalInvoiceValue: parseFloat(totalInvoiceValue.toFixed(2)),
    grossTurnover: parseFloat(grossTurnover.toFixed(2))
  };
}

/**
 * Save or update GSTR-1 return in database
 */
async function saveGSTR1(businessId, filingPeriod, year, gstr1Data) {
  const existingReturn = await prisma.gSTReturn.findFirst({
    where: {
      businessId,
      returnType: 'gstr1',
      filingPeriod
    }
  });

  const returnData = {
    returnType: 'gstr1',
    filingPeriod,
    financialYear: `${year}-${year + 1}`,
    returnData: gstr1Data,
    totalTaxLiability: gstr1Data.summary.totalTax,
    status: 'generated',
    generatedAt: new Date(),
    isValid: true
  };

  if (existingReturn) {
    return await prisma.gSTReturn.update({
      where: { id: existingReturn.id },
      data: returnData
    });
  } else {
    return await prisma.gSTReturn.create({
      data: {
        businessId,
        ...returnData
      }
    });
  }
}

/**
 * Get GSTR-1 return for a period
 */
async function getGSTR1(businessId, month, year) {
  const filingPeriod = `${year}-${String(month).padStart(2, '0')}`;
  
  const gstr1Return = await prisma.gSTReturn.findFirst({
    where: {
      businessId,
      returnType: 'gstr1',
      filingPeriod
    }
  });

  if (!gstr1Return) {
    throw new Error(`GSTR-1 not found for period ${filingPeriod}. Please generate it first.`);
  }

  return gstr1Return;
}

/**
 * Export GSTR-1 as JSON
 */
function exportGSTR1ToJSON(gstr1Data) {
  return JSON.stringify(gstr1Data, null, 2);
}

/**
 * Helper: Format date for GST Portal (DD-MM-YYYY)
 */
function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

module.exports = {
  generateGSTR1,
  getGSTR1,
  exportGSTR1ToJSON
};
