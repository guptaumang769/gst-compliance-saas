/**
 * GSTR-3B Service
 * Generates GSTR-3B (Summary Return) - Monthly tax liability return
 * 
 * GSTR-3B is a summary return where taxpayer declares:
 * 1. Output Tax Liability (from sales)
 * 2. Input Tax Credit (ITC) available (from purchases)
 * 3. Net Tax Payable = Output Tax - ITC
 * 4. Interest & Late Fees (if any)
 * 
 * Due Date: 20th of next month
 * 
 * Structure:
 * - Table 3.1: Outward taxable supplies
 * - Table 4: ITC Available (from purchases)
 * - Table 5: ITC Reversal/Reclaim
 * - Table 6: Net ITC Available
 * - Table 6.1: Payment of tax
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generate GSTR-3B return for a specific period
 * @param {string} businessId - Business ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (YYYY)
 * @returns {Promise<Object>} - GSTR-3B return data
 */
async function generateGSTR3B(businessId, month, year) {
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

  // Get sales data (outward supplies)
  const salesData = await getOutwardSupplies(businessId, periodStart, periodEnd);

  // Get purchase data (ITC)
  const purchaseData = await getInputTaxCredit(businessId, periodStart, periodEnd);

  // Calculate net tax payable
  const taxPayable = calculateTaxPayable(salesData, purchaseData);

  // Check for late filing (simple check - can be enhanced)
  const today = new Date();
  const dueDate = new Date(year, month, 20); // 20th of next month
  const isLateFile = today > dueDate;
  const lateFees = isLateFile ? calculateLateFees(today, dueDate) : 0;

  // Prepare complete GSTR-3B data
  const gstr3bData = {
    gstin: business.gstin,
    fp: filingPeriod, // Filing Period
    
    // Section 3.1: Outward Taxable Supplies
    sup_details: {
      osup_det: {
        // Outward taxable supplies (other than zero rated, nil rated and exempted)
        txval: salesData.taxableValue,
        iamt: salesData.igst,
        camt: salesData.cgst,
        samt: salesData.sgst,
        csamt: salesData.cess
      },
      osup_zero: {
        // Outward taxable supplies (zero rated)
        txval: salesData.zeroRatedValue,
        iamt: 0,
        camt: 0,
        samt: 0,
        csamt: 0
      },
      osup_nil_exmp: {
        // Other outward supplies (nil rated, exempted)
        txval: salesData.exemptedValue,
        iamt: 0,
        camt: 0,
        samt: 0,
        csamt: 0
      },
      isup_rev: {
        // Inward supplies liable to reverse charge
        txval: salesData.reverseChargeValue,
        iamt: salesData.reverseChargeIGST,
        camt: salesData.reverseChargeCGST,
        samt: salesData.reverseChargeSGST,
        csamt: salesData.reverseChargeCess
      },
      osup_nongst: {
        // Non-GST outward supplies
        txval: 0,
        iamt: 0,
        camt: 0,
        samt: 0,
        csamt: 0
      }
    },

    // Section 4: ITC Available
    itc_elg: {
      itc_avl: [
        {
          ty: 'IMPG', // Import of goods
          iamt: purchaseData.itc.importGoods.igst,
          camt: 0,
          samt: 0,
          csamt: 0
        },
        {
          ty: 'IMPS', // Import of services
          iamt: purchaseData.itc.importServices.igst,
          camt: 0,
          samt: 0,
          csamt: 0
        },
        {
          ty: 'ISRC', // ITC on Reverse Charge
          iamt: purchaseData.itc.reverseCharge.igst,
          camt: purchaseData.itc.reverseCharge.cgst,
          samt: purchaseData.itc.reverseCharge.sgst,
          csamt: purchaseData.itc.reverseCharge.cess
        },
        {
          ty: 'ISD', // ITC received from ISD
          iamt: 0,
          camt: 0,
          samt: 0,
          csamt: 0
        },
        {
          ty: 'OTH', // All other ITC
          iamt: purchaseData.itc.other.igst,
          camt: purchaseData.itc.other.cgst,
          samt: purchaseData.itc.other.sgst,
          csamt: purchaseData.itc.other.cess
        }
      ]
    },

    // Section 5: ITC Reversal/Reclaim
    itc_rev: {
      // Simplified - in real scenario, track reversals separately
      iamt: 0,
      camt: 0,
      samt: 0,
      csamt: 0
    },

    // Section 6: Net ITC Available
    inward_sup: {
      isup_details: [
        {
          ty: 'GST',
          inter: purchaseData.totalITC.igst,
          intra: purchaseData.totalITC.cgst + purchaseData.totalITC.sgst
        }
      ]
    },

    // Section 6.1: Interest & Late Fees
    intr_ltfee: {
      intr: {
        iamt: 0,
        camt: 0,
        samt: 0,
        csamt: 0
      },
      ltfee: {
        iamt: isLateFile ? lateFees : 0,
        camt: isLateFile ? lateFees : 0,
        samt: isLateFile ? lateFees : 0,
        csamt: 0
      }
    },

    // Tax Payable Summary
    tax_payable: {
      igst: taxPayable.igst,
      cgst: taxPayable.cgst,
      sgst: taxPayable.sgst,
      cess: taxPayable.cess,
      total: taxPayable.total
    }
  };

  // Save or update GSTR-3B return
  const gstr3bReturn = await saveGSTR3B(businessId, filingPeriod, year, gstr3bData, taxPayable);

  return {
    returnId: gstr3bReturn.id,
    businessName: business.businessName,
    gstin: business.gstin,
    filingPeriod,
    status: gstr3bReturn.status,
    generatedAt: gstr3bReturn.generatedAt,
    summary: {
      outputTax: salesData.totalTax,
      itcAvailable: purchaseData.totalITC.total,
      netTaxPayable: taxPayable.total,
      lateFees: isLateFile ? lateFees * 3 : 0, // CGST + SGST + IGST
      totalPayable: taxPayable.total + (isLateFile ? lateFees * 3 : 0)
    },
    data: gstr3bData
  };
}

/**
 * Get outward supplies (sales) for the period
 */
async function getOutwardSupplies(businessId, periodStart, periodEnd) {
  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      isActive: true,
      invoiceDate: {
        gte: periodStart,
        lte: periodEnd
      }
    }
  });

  let taxableValue = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let cess = 0;
  let zeroRatedValue = 0; // Exports
  let exemptedValue = 0; // Nil rated
  let reverseChargeValue = 0;
  let reverseChargeCGST = 0;
  let reverseChargeSGST = 0;
  let reverseChargeIGST = 0;
  let reverseChargeCess = 0;

  for (const invoice of invoices) {
    const taxable = parseFloat(invoice.taxableAmount);
    const c = parseFloat(invoice.cgstAmount);
    const s = parseFloat(invoice.sgstAmount);
    const i = parseFloat(invoice.igstAmount);
    const cs = parseFloat(invoice.cessAmount);

    if (invoice.invoiceType === 'export' || invoice.invoiceType === 'sez') {
      // Zero rated supplies
      zeroRatedValue += taxable;
    } else if (invoice.reverseCharge) {
      // Reverse charge supplies
      reverseChargeValue += taxable;
      reverseChargeCGST += c;
      reverseChargeSGST += s;
      reverseChargeIGST += i;
      reverseChargeCess += cs;
    } else {
      // Regular taxable supplies
      taxableValue += taxable;
      cgst += c;
      sgst += s;
      igst += i;
      cess += cs;
    }
  }

  const totalTax = cgst + sgst + igst + cess + reverseChargeCGST + reverseChargeSGST + reverseChargeIGST + reverseChargeCess;

  return {
    taxableValue: parseFloat(taxableValue.toFixed(2)),
    cgst: parseFloat(cgst.toFixed(2)),
    sgst: parseFloat(sgst.toFixed(2)),
    igst: parseFloat(igst.toFixed(2)),
    cess: parseFloat(cess.toFixed(2)),
    zeroRatedValue: parseFloat(zeroRatedValue.toFixed(2)),
    exemptedValue: parseFloat(exemptedValue.toFixed(2)),
    reverseChargeValue: parseFloat(reverseChargeValue.toFixed(2)),
    reverseChargeCGST: parseFloat(reverseChargeCGST.toFixed(2)),
    reverseChargeSGST: parseFloat(reverseChargeSGST.toFixed(2)),
    reverseChargeIGST: parseFloat(reverseChargeIGST.toFixed(2)),
    reverseChargeCess: parseFloat(reverseChargeCess.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2))
  };
}

/**
 * Get Input Tax Credit (ITC) from purchases
 */
async function getInputTaxCredit(businessId, periodStart, periodEnd) {
  const purchases = await prisma.purchase.findMany({
    where: {
      businessId,
      isActive: true,
      isItcEligible: true,
      supplierInvoiceDate: {
        gte: periodStart,
        lte: periodEnd
      }
    }
  });

  // Categorize ITC
  const itc = {
    importGoods: { igst: 0, cgst: 0, sgst: 0, cess: 0 },
    importServices: { igst: 0, cgst: 0, sgst: 0, cess: 0 },
    reverseCharge: { igst: 0, cgst: 0, sgst: 0, cess: 0 },
    other: { igst: 0, cgst: 0, sgst: 0, cess: 0 }
  };

  for (const purchase of purchases) {
    const i = parseFloat(purchase.igstAmount);
    const c = parseFloat(purchase.cgstAmount);
    const s = parseFloat(purchase.sgstAmount);
    const cs = parseFloat(purchase.cessAmount);

    if (purchase.purchaseType === 'import') {
      // Import of goods
      itc.importGoods.igst += i;
      itc.importGoods.cgst += c;
      itc.importGoods.sgst += s;
      itc.importGoods.cess += cs;
    } else if (purchase.reverseCharge) {
      // Reverse charge purchases
      itc.reverseCharge.igst += i;
      itc.reverseCharge.cgst += c;
      itc.reverseCharge.sgst += s;
      itc.reverseCharge.cess += cs;
    } else {
      // All other ITC
      itc.other.igst += i;
      itc.other.cgst += c;
      itc.other.sgst += s;
      itc.other.cess += cs;
    }
  }

  // Round all amounts
  Object.keys(itc).forEach(key => {
    itc[key].igst = parseFloat(itc[key].igst.toFixed(2));
    itc[key].cgst = parseFloat(itc[key].cgst.toFixed(2));
    itc[key].sgst = parseFloat(itc[key].sgst.toFixed(2));
    itc[key].cess = parseFloat(itc[key].cess.toFixed(2));
  });

  // Calculate total ITC
  const totalITC = {
    igst: itc.importGoods.igst + itc.importServices.igst + itc.reverseCharge.igst + itc.other.igst,
    cgst: itc.importGoods.cgst + itc.importServices.cgst + itc.reverseCharge.cgst + itc.other.cgst,
    sgst: itc.importGoods.sgst + itc.importServices.sgst + itc.reverseCharge.sgst + itc.other.sgst,
    cess: itc.importGoods.cess + itc.importServices.cess + itc.reverseCharge.cess + itc.other.cess,
    total: 0
  };

  totalITC.total = totalITC.igst + totalITC.cgst + totalITC.sgst + totalITC.cess;
  totalITC.total = parseFloat(totalITC.total.toFixed(2));

  return {
    itc,
    totalITC
  };
}

/**
 * Calculate net tax payable
 * Tax Payable = Output Tax - ITC
 */
function calculateTaxPayable(salesData, purchaseData) {
  const outputTax = {
    igst: salesData.igst + salesData.reverseChargeIGST,
    cgst: salesData.cgst + salesData.reverseChargeCGST,
    sgst: salesData.sgst + salesData.reverseChargeSGST,
    cess: salesData.cess + salesData.reverseChargeCess
  };

  const itc = purchaseData.totalITC;

  // Net tax = Output tax - ITC
  // Note: Cross-utilization rules apply (IGST can be used for CGST/SGST)
  let igstPayable = outputTax.igst - itc.igst;
  let cgstPayable = outputTax.cgst - itc.cgst;
  let sgstPayable = outputTax.sgst - itc.sgst;
  let cessPayable = outputTax.cess - itc.cess;

  // If IGST ITC is excess, use it for CGST/SGST
  if (igstPayable < 0) {
    const excessIGST = Math.abs(igstPayable);
    igstPayable = 0;

    // Use excess IGST for CGST
    if (cgstPayable > 0) {
      const usedForCGST = Math.min(cgstPayable, excessIGST);
      cgstPayable -= usedForCGST;
    }

    // Use remaining excess IGST for SGST
    if (sgstPayable > 0) {
      const usedForSGST = Math.min(sgstPayable, excessIGST);
      sgstPayable -= usedForSGST;
    }
  }

  // Ensure no negative values
  igstPayable = Math.max(0, igstPayable);
  cgstPayable = Math.max(0, cgstPayable);
  sgstPayable = Math.max(0, sgstPayable);
  cessPayable = Math.max(0, cessPayable);

  const total = igstPayable + cgstPayable + sgstPayable + cessPayable;

  return {
    igst: parseFloat(igstPayable.toFixed(2)),
    cgst: parseFloat(cgstPayable.toFixed(2)),
    sgst: parseFloat(sgstPayable.toFixed(2)),
    cess: parseFloat(cessPayable.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
}

/**
 * Calculate late fees
 * ₹50/day per act (CGST + SGST) if return is late
 * Max: ₹5,000 per act
 */
function calculateLateFees(filedDate, dueDate) {
  const daysLate = Math.ceil((filedDate - dueDate) / (1000 * 60 * 60 * 24));
  if (daysLate <= 0) return 0;

  const feePerDay = 50; // ₹50 per day per act
  const calculatedFee = daysLate * feePerDay;
  const maxFee = 5000; // Maximum ₹5,000 per act

  return Math.min(calculatedFee, maxFee);
}

/**
 * Save or update GSTR-3B return in database
 */
async function saveGSTR3B(businessId, filingPeriod, year, gstr3bData, taxPayable) {
  const existingReturn = await prisma.gSTReturn.findFirst({
    where: {
      businessId,
      returnType: 'gstr3b',
      filingPeriod
    }
  });

  const returnData = {
    returnType: 'gstr3b',
    filingPeriod,
    financialYear: `${year}-${year + 1}`,
    returnData: gstr3bData,
    totalTaxLiability: gstr3bData.sup_details.osup_det.iamt + 
                       gstr3bData.sup_details.osup_det.camt + 
                       gstr3bData.sup_details.osup_det.samt + 
                       gstr3bData.sup_details.osup_det.csamt,
    totalItc: gstr3bData.itc_elg.itc_avl.reduce((sum, item) => 
      sum + (item.iamt || 0) + (item.camt || 0) + (item.samt || 0) + (item.csamt || 0), 0
    ),
    netTaxPayable: taxPayable.total,
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
 * Get GSTR-3B return for a period
 */
async function getGSTR3B(businessId, month, year) {
  const filingPeriod = `${year}-${String(month).padStart(2, '0')}`;
  
  const gstr3bReturn = await prisma.gSTReturn.findFirst({
    where: {
      businessId,
      returnType: 'gstr3b',
      filingPeriod
    }
  });

  if (!gstr3bReturn) {
    throw new Error(`GSTR-3B not found for period ${filingPeriod}. Please generate it first.`);
  }

  return gstr3bReturn;
}

/**
 * Export GSTR-3B as JSON
 */
function exportGSTR3BToJSON(gstr3bData) {
  return JSON.stringify(gstr3bData, null, 2);
}

module.exports = {
  generateGSTR3B,
  getGSTR3B,
  exportGSTR3BToJSON
};
