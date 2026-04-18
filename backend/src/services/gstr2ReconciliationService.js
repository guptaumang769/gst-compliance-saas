/**
 * GSTR-2A/2B Reconciliation Service
 * 
 * GSTR-2A: Auto-drafted statement of inward supplies from supplier's GSTR-1
 * GSTR-2B: Auto-generated ITC statement (monthly), legally valid for ITC claims
 * 
 * Key Reconciliation Features:
 * 1. Import GSTR-2A/2B data (manual entry or JSON upload)
 * 2. Auto-match with purchase records in books
 * 3. Identify mismatches (amount, date, invoice number)
 * 4. Generate reconciliation reports
 * 5. Track ITC eligibility based on GSTR-2B
 */

const prisma = require('../config/database');

// Tolerance for amount matching (in INR) - minor rounding differences
const AMOUNT_TOLERANCE = 1.0;

/**
 * Import GSTR-2A/2B data manually (single entry)
 */
async function importSingleEntry(businessId, entryData) {
  const {
    filingPeriod,
    financialYear,
    dataSource = 'manual',
    supplierGstin,
    supplierName,
    supplierInvoiceNumber,
    supplierInvoiceDate,
    invoiceType = 'R',
    taxableAmount,
    cgstAmount = 0,
    sgstAmount = 0,
    igstAmount = 0,
    cessAmount = 0,
    placeOfSupply,
    reverseCharge = false,
    itcAvailability = 'available'
  } = entryData;

  // Validation
  if (!filingPeriod || !supplierGstin || !supplierInvoiceNumber || !supplierInvoiceDate || !taxableAmount) {
    throw new Error('Missing required fields: filingPeriod, supplierGstin, supplierInvoiceNumber, supplierInvoiceDate, taxableAmount');
  }

  const totalTaxAmount = parseFloat(cgstAmount) + parseFloat(sgstAmount) + parseFloat(igstAmount) + parseFloat(cessAmount);
  const totalAmount = parseFloat(taxableAmount) + totalTaxAmount;
  const itcAmount = itcAvailability === 'available' ? totalTaxAmount : 0;

  // Calculate financial year if not provided
  const effectiveFinancialYear = financialYear || calculateFinancialYear(filingPeriod);

  // Check for duplicate
  const existing = await prisma.gSTR2Reconciliation.findFirst({
    where: {
      businessId,
      supplierGstin,
      supplierInvoiceNumber,
      filingPeriod
    }
  });

  if (existing) {
    throw new Error(`Entry already exists for invoice ${supplierInvoiceNumber} from ${supplierGstin} for period ${filingPeriod}`);
  }

  const entry = await prisma.gSTR2Reconciliation.create({
    data: {
      businessId,
      filingPeriod,
      financialYear: effectiveFinancialYear,
      dataSource,
      supplierGstin,
      supplierName,
      supplierInvoiceNumber,
      supplierInvoiceDate: new Date(supplierInvoiceDate),
      invoiceType,
      taxableAmount: parseFloat(taxableAmount),
      cgstAmount: parseFloat(cgstAmount),
      sgstAmount: parseFloat(sgstAmount),
      igstAmount: parseFloat(igstAmount),
      cessAmount: parseFloat(cessAmount),
      totalTaxAmount,
      totalAmount,
      placeOfSupply,
      reverseCharge,
      itcAvailability,
      itcAmount,
      reconciliationStatus: 'pending'
    }
  });

  return entry;
}

/**
 * Import multiple GSTR-2A/2B entries (bulk import from JSON)
 */
async function importBulkEntries(businessId, filingPeriod, dataSource, entries) {
  const results = {
    imported: 0,
    skipped: 0,
    errors: []
  };

  const financialYear = calculateFinancialYear(filingPeriod);

  for (const entry of entries) {
    try {
      // Check for duplicate
      const existing = await prisma.gSTR2Reconciliation.findFirst({
        where: {
          businessId,
          supplierGstin: entry.supplierGstin || entry.ctin,
          supplierInvoiceNumber: entry.supplierInvoiceNumber || entry.inum,
          filingPeriod
        }
      });

      if (existing) {
        results.skipped++;
        continue;
      }

      // Map GST Portal JSON format to our schema
      const mappedEntry = mapGSTPortalEntry(entry, dataSource);
      
      const totalTaxAmount = parseFloat(mappedEntry.cgstAmount || 0) + 
                             parseFloat(mappedEntry.sgstAmount || 0) + 
                             parseFloat(mappedEntry.igstAmount || 0) + 
                             parseFloat(mappedEntry.cessAmount || 0);
      const totalAmount = parseFloat(mappedEntry.taxableAmount) + totalTaxAmount;
      const itcAmount = mappedEntry.itcAvailability === 'available' ? totalTaxAmount : 0;

      await prisma.gSTR2Reconciliation.create({
        data: {
          businessId,
          filingPeriod,
          financialYear,
          dataSource,
          supplierGstin: mappedEntry.supplierGstin,
          supplierName: mappedEntry.supplierName,
          supplierInvoiceNumber: mappedEntry.supplierInvoiceNumber,
          supplierInvoiceDate: new Date(mappedEntry.supplierInvoiceDate),
          invoiceType: mappedEntry.invoiceType || 'R',
          taxableAmount: parseFloat(mappedEntry.taxableAmount),
          cgstAmount: parseFloat(mappedEntry.cgstAmount || 0),
          sgstAmount: parseFloat(mappedEntry.sgstAmount || 0),
          igstAmount: parseFloat(mappedEntry.igstAmount || 0),
          cessAmount: parseFloat(mappedEntry.cessAmount || 0),
          totalTaxAmount,
          totalAmount,
          placeOfSupply: mappedEntry.placeOfSupply,
          reverseCharge: mappedEntry.reverseCharge || false,
          itcAvailability: mappedEntry.itcAvailability || 'available',
          itcAmount,
          reconciliationStatus: 'pending'
        }
      });

      results.imported++;
    } catch (err) {
      results.errors.push({
        entry: entry.supplierInvoiceNumber || entry.inum || 'unknown',
        error: err.message
      });
    }
  }

  return results;
}

/**
 * Map GST Portal JSON format to our schema
 * GST Portal uses abbreviated field names
 */
function mapGSTPortalEntry(entry, dataSource) {
  // GSTR-2A/2B format from GST Portal
  return {
    supplierGstin: entry.ctin || entry.supplierGstin,
    supplierName: entry.trdnm || entry.supplierName,
    supplierInvoiceNumber: entry.inum || entry.supplierInvoiceNumber,
    supplierInvoiceDate: entry.idt || entry.supplierInvoiceDate,
    invoiceType: entry.inv_typ || entry.invoiceType || 'R',
    taxableAmount: entry.val || entry.txval || entry.taxableAmount || 0,
    cgstAmount: entry.camt || entry.cgstAmount || 0,
    sgstAmount: entry.samt || entry.sgstAmount || 0,
    igstAmount: entry.iamt || entry.igstAmount || 0,
    cessAmount: entry.csamt || entry.cessAmount || 0,
    placeOfSupply: entry.pos || entry.placeOfSupply,
    reverseCharge: entry.rchrg === 'Y' || entry.reverseCharge === true,
    itcAvailability: dataSource === 'gstr2b' 
      ? (entry.itc_elg === 'Y' ? 'available' : 'not_available')
      : 'available'
  };
}

/**
 * Run reconciliation for a filing period
 * Matches GSTR-2A/2B entries with purchase records in books
 */
async function runReconciliation(businessId, filingPeriod) {
  // Get all pending GSTR-2A/2B entries for the period
  const gstr2Entries = await prisma.gSTR2Reconciliation.findMany({
    where: {
      businessId,
      filingPeriod,
      reconciliationStatus: 'pending'
    }
  });

  if (gstr2Entries.length === 0) {
    return { message: 'No pending entries to reconcile', matched: 0, mismatched: 0, unmatched: 0 };
  }

  // Get date range for the period
  const [year, month] = filingPeriod.split('-').map(Number);
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);

  // Get all purchases for the period (with some buffer for invoice date differences)
  const bufferDays = 30;
  const searchStart = new Date(periodStart);
  searchStart.setDate(searchStart.getDate() - bufferDays);
  const searchEnd = new Date(periodEnd);
  searchEnd.setDate(searchEnd.getDate() + bufferDays);

  const purchases = await prisma.purchase.findMany({
    where: {
      businessId,
      isActive: true,
      supplierInvoiceDate: {
        gte: searchStart,
        lte: searchEnd
      }
    },
    include: {
      supplier: true
    }
  });

  const results = {
    matched: 0,
    mismatched: 0,
    unmatched: 0,
    details: []
  };

  for (const gstr2Entry of gstr2Entries) {
    const matchResult = await findMatchingPurchase(gstr2Entry, purchases);

    if (matchResult.status === 'matched') {
      await prisma.gSTR2Reconciliation.update({
        where: { id: gstr2Entry.id },
        data: {
          reconciliationStatus: 'matched',
          matchedPurchaseId: matchResult.purchaseId,
          mismatchType: null,
          mismatchDetails: null,
          taxableAmountDiff: 0,
          taxAmountDiff: 0
        }
      });
      
      // Update purchase as matched
      await prisma.purchase.update({
        where: { id: matchResult.purchaseId },
        data: { matchedInGstr2a: true }
      });

      results.matched++;
      results.details.push({
        gstr2EntryId: gstr2Entry.id,
        status: 'matched',
        purchaseId: matchResult.purchaseId
      });
    } else if (matchResult.status === 'mismatched') {
      await prisma.gSTR2Reconciliation.update({
        where: { id: gstr2Entry.id },
        data: {
          reconciliationStatus: 'mismatched',
          matchedPurchaseId: matchResult.purchaseId,
          mismatchType: matchResult.mismatchType,
          mismatchDetails: matchResult.mismatchDetails,
          taxableAmountDiff: matchResult.taxableAmountDiff || 0,
          taxAmountDiff: matchResult.taxAmountDiff || 0
        }
      });

      results.mismatched++;
      results.details.push({
        gstr2EntryId: gstr2Entry.id,
        status: 'mismatched',
        purchaseId: matchResult.purchaseId,
        mismatchType: matchResult.mismatchType,
        mismatchDetails: matchResult.mismatchDetails
      });
    } else {
      await prisma.gSTR2Reconciliation.update({
        where: { id: gstr2Entry.id },
        data: {
          reconciliationStatus: 'unmatched',
          matchedPurchaseId: null
        }
      });

      results.unmatched++;
      results.details.push({
        gstr2EntryId: gstr2Entry.id,
        status: 'unmatched',
        supplierGstin: gstr2Entry.supplierGstin,
        invoiceNumber: gstr2Entry.supplierInvoiceNumber
      });
    }
  }

  return results;
}

/**
 * Find matching purchase for a GSTR-2A/2B entry
 */
async function findMatchingPurchase(gstr2Entry, purchases) {
  // Try to find exact match first (GSTIN + Invoice Number)
  let matchingPurchases = purchases.filter(p => 
    p.supplier?.gstin?.toUpperCase() === gstr2Entry.supplierGstin.toUpperCase() &&
    normalizeInvoiceNumber(p.supplierInvoiceNumber) === normalizeInvoiceNumber(gstr2Entry.supplierInvoiceNumber)
  );

  if (matchingPurchases.length === 0) {
    // Try fuzzy match on invoice number
    matchingPurchases = purchases.filter(p => 
      p.supplier?.gstin?.toUpperCase() === gstr2Entry.supplierGstin.toUpperCase() &&
      fuzzyMatchInvoiceNumber(p.supplierInvoiceNumber, gstr2Entry.supplierInvoiceNumber)
    );
  }

  if (matchingPurchases.length === 0) {
    return { status: 'unmatched' };
  }

  // Take the first match
  const purchase = matchingPurchases[0];

  // Check for amount mismatches
  const mismatches = [];
  const mismatchDetails = {};

  const gstr2TaxableAmount = parseFloat(gstr2Entry.taxableAmount);
  const purchaseTaxableAmount = parseFloat(purchase.taxableAmount);
  const taxableAmountDiff = Math.abs(gstr2TaxableAmount - purchaseTaxableAmount);

  if (taxableAmountDiff > AMOUNT_TOLERANCE) {
    mismatches.push('amount');
    mismatchDetails.taxableAmount = {
      gstr2a: gstr2TaxableAmount,
      books: purchaseTaxableAmount,
      difference: taxableAmountDiff
    };
  }

  const gstr2TaxAmount = parseFloat(gstr2Entry.totalTaxAmount);
  const purchaseTaxAmount = parseFloat(purchase.totalTaxAmount);
  const taxAmountDiff = Math.abs(gstr2TaxAmount - purchaseTaxAmount);

  if (taxAmountDiff > AMOUNT_TOLERANCE) {
    mismatches.push('tax_amount');
    mismatchDetails.taxAmount = {
      gstr2a: gstr2TaxAmount,
      books: purchaseTaxAmount,
      difference: taxAmountDiff
    };
  }

  // Check date mismatch (more than 30 days difference)
  const gstr2Date = new Date(gstr2Entry.supplierInvoiceDate);
  const purchaseDate = new Date(purchase.supplierInvoiceDate);
  const dateDiff = Math.abs((gstr2Date - purchaseDate) / (1000 * 60 * 60 * 24));

  if (dateDiff > 30) {
    mismatches.push('date');
    mismatchDetails.date = {
      gstr2a: gstr2Date.toISOString().split('T')[0],
      books: purchaseDate.toISOString().split('T')[0],
      differenceInDays: Math.round(dateDiff)
    };
  }

  if (mismatches.length > 0) {
    return {
      status: 'mismatched',
      purchaseId: purchase.id,
      mismatchType: mismatches.join(','),
      mismatchDetails,
      taxableAmountDiff,
      taxAmountDiff
    };
  }

  return {
    status: 'matched',
    purchaseId: purchase.id
  };
}

/**
 * Normalize invoice number for comparison
 */
function normalizeInvoiceNumber(invoiceNumber) {
  if (!invoiceNumber) return '';
  return invoiceNumber
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ''); // Remove special characters
}

/**
 * Fuzzy match invoice numbers (handles minor variations)
 */
function fuzzyMatchInvoiceNumber(num1, num2) {
  const normalized1 = normalizeInvoiceNumber(num1);
  const normalized2 = normalizeInvoiceNumber(num2);
  
  if (normalized1 === normalized2) return true;
  
  // Check if one contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return true;
  }
  
  return false;
}

/**
 * Get reconciliation summary for a period
 */
async function getReconciliationSummary(businessId, filingPeriod) {
  const entries = await prisma.gSTR2Reconciliation.findMany({
    where: { businessId, filingPeriod },
    include: {
      matchedPurchase: {
        include: {
          supplier: true
        }
      }
    }
  });

  const summary = {
    totalEntries: entries.length,
    matched: 0,
    mismatched: 0,
    unmatched: 0,
    pending: 0,
    totalGstr2TaxableValue: 0,
    totalGstr2Tax: 0,
    totalGstr2ItcAvailable: 0,
    totalBooksTaxableValue: 0,
    totalBooksTax: 0,
    totalBooksItc: 0,
    taxableValueDifference: 0,
    taxDifference: 0,
    entriesByStatus: {}
  };

  for (const entry of entries) {
    summary[entry.reconciliationStatus]++;
    summary.totalGstr2TaxableValue += parseFloat(entry.taxableAmount);
    summary.totalGstr2Tax += parseFloat(entry.totalTaxAmount);
    
    if (entry.itcAvailability === 'available') {
      summary.totalGstr2ItcAvailable += parseFloat(entry.itcAmount);
    }

    if (entry.matchedPurchase) {
      summary.totalBooksTaxableValue += parseFloat(entry.matchedPurchase.taxableAmount);
      summary.totalBooksTax += parseFloat(entry.matchedPurchase.totalTaxAmount);
      if (entry.matchedPurchase.isItcEligible) {
        summary.totalBooksItc += parseFloat(entry.matchedPurchase.itcAmount);
      }
    }
  }

  summary.taxableValueDifference = summary.totalGstr2TaxableValue - summary.totalBooksTaxableValue;
  summary.taxDifference = summary.totalGstr2Tax - summary.totalBooksTax;

  return summary;
}

/**
 * Get all reconciliation entries with filters
 */
async function getReconciliationEntries(businessId, filters = {}) {
  const { filingPeriod, status, supplierGstin, search, page = 1, limit = 50 } = filters;

  const where = { businessId };

  if (filingPeriod) {
    where.filingPeriod = filingPeriod;
  }

  if (status) {
    where.reconciliationStatus = status;
  }

  if (supplierGstin) {
    where.supplierGstin = { contains: supplierGstin, mode: 'insensitive' };
  }

  if (search) {
    where.OR = [
      { supplierGstin: { contains: search, mode: 'insensitive' } },
      { supplierName: { contains: search, mode: 'insensitive' } },
      { supplierInvoiceNumber: { contains: search, mode: 'insensitive' } }
    ];
  }

  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    prisma.gSTR2Reconciliation.findMany({
      where,
      include: {
        matchedPurchase: {
          include: {
            supplier: true
          }
        }
      },
      orderBy: [
        { reconciliationStatus: 'asc' },
        { supplierInvoiceDate: 'desc' }
      ],
      skip,
      take: limit
    }),
    prisma.gSTR2Reconciliation.count({ where })
  ]);

  return {
    entries,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get purchases not in GSTR-2A/2B (in books but not reported by supplier)
 */
async function getPurchasesNotInGstr2(businessId, filingPeriod) {
  const [year, month] = filingPeriod.split('-').map(Number);
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);

  // Get purchases in the period that are not matched
  const unmatchedPurchases = await prisma.purchase.findMany({
    where: {
      businessId,
      isActive: true,
      supplierInvoiceDate: {
        gte: periodStart,
        lte: periodEnd
      },
      matchedInGstr2a: false
    },
    include: {
      supplier: true
    }
  });

  return unmatchedPurchases;
}

/**
 * Update reconciliation entry action
 */
async function updateReconciliationAction(entryId, businessId, actionData) {
  const { actionTaken, actionNotes } = actionData;

  const entry = await prisma.gSTR2Reconciliation.findFirst({
    where: { id: entryId, businessId }
  });

  if (!entry) {
    throw new Error('Reconciliation entry not found');
  }

  return prisma.gSTR2Reconciliation.update({
    where: { id: entryId },
    data: {
      actionTaken,
      actionNotes,
      actionTakenAt: new Date()
    },
    include: {
      matchedPurchase: {
        include: { supplier: true }
      }
    }
  });
}

/**
 * Delete a reconciliation entry
 */
async function deleteReconciliationEntry(entryId, businessId) {
  const entry = await prisma.gSTR2Reconciliation.findFirst({
    where: { id: entryId, businessId }
  });

  if (!entry) {
    throw new Error('Reconciliation entry not found');
  }

  // If matched, update the purchase
  if (entry.matchedPurchaseId) {
    await prisma.purchase.update({
      where: { id: entry.matchedPurchaseId },
      data: { matchedInGstr2a: false }
    });
  }

  await prisma.gSTR2Reconciliation.delete({
    where: { id: entryId }
  });
}

/**
 * Get available filing periods for reconciliation
 */
async function getAvailablePeriods(businessId) {
  const periods = await prisma.gSTR2Reconciliation.findMany({
    where: { businessId },
    select: { filingPeriod: true },
    distinct: ['filingPeriod'],
    orderBy: { filingPeriod: 'desc' }
  });

  return periods.map(p => p.filingPeriod);
}

/**
 * Calculate financial year from filing period
 */
function calculateFinancialYear(filingPeriod) {
  const [year, month] = filingPeriod.split('-').map(Number);
  
  // Financial year starts in April
  // April 2025 to March 2026 = FY 2025-2026
  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Generate ITC report from GSTR-2B data
 */
async function generateItcReport(businessId, filingPeriod) {
  const entries = await prisma.gSTR2Reconciliation.findMany({
    where: {
      businessId,
      filingPeriod,
      dataSource: 'gstr2b'
    }
  });

  const report = {
    filingPeriod,
    totalInvoices: entries.length,
    itcAvailable: {
      count: 0,
      taxableValue: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      cess: 0,
      totalItc: 0
    },
    itcNotAvailable: {
      count: 0,
      taxableValue: 0,
      totalTax: 0
    },
    itcIneligible: {
      count: 0,
      taxableValue: 0,
      totalTax: 0
    },
    reverseCharge: {
      count: 0,
      taxableValue: 0,
      totalTax: 0
    }
  };

  for (const entry of entries) {
    if (entry.reverseCharge) {
      report.reverseCharge.count++;
      report.reverseCharge.taxableValue += parseFloat(entry.taxableAmount);
      report.reverseCharge.totalTax += parseFloat(entry.totalTaxAmount);
    }

    switch (entry.itcAvailability) {
      case 'available':
        report.itcAvailable.count++;
        report.itcAvailable.taxableValue += parseFloat(entry.taxableAmount);
        report.itcAvailable.cgst += parseFloat(entry.cgstAmount);
        report.itcAvailable.sgst += parseFloat(entry.sgstAmount);
        report.itcAvailable.igst += parseFloat(entry.igstAmount);
        report.itcAvailable.cess += parseFloat(entry.cessAmount);
        report.itcAvailable.totalItc += parseFloat(entry.itcAmount);
        break;
      case 'not_available':
        report.itcNotAvailable.count++;
        report.itcNotAvailable.taxableValue += parseFloat(entry.taxableAmount);
        report.itcNotAvailable.totalTax += parseFloat(entry.totalTaxAmount);
        break;
      case 'ineligible':
        report.itcIneligible.count++;
        report.itcIneligible.taxableValue += parseFloat(entry.taxableAmount);
        report.itcIneligible.totalTax += parseFloat(entry.totalTaxAmount);
        break;
    }
  }

  return report;
}

module.exports = {
  importSingleEntry,
  importBulkEntries,
  runReconciliation,
  getReconciliationSummary,
  getReconciliationEntries,
  getPurchasesNotInGstr2,
  updateReconciliationAction,
  deleteReconciliationEntry,
  getAvailablePeriods,
  generateItcReport
};
