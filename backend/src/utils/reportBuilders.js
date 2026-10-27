/**
 * Report Builders (pure, no DB)
 *
 * Row/summary building functions for the reports API. Kept dependency-free so
 * they can be unit tested without a live database. Every builder returns the
 * shape { rows: [...], totals: {...} }.
 */

function num(v) {
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Sales register: one row per sales invoice.
 */
function buildSalesRegister(invoices) {
  const rows = (invoices || []).map((inv) => ({
    date: formatDate(inv.invoiceDate),
    invoiceNumber: inv.invoiceNumber,
    customer: inv.customer ? inv.customer.customerName : '',
    taxable: round2(num(inv.taxableAmount)),
    cgst: round2(num(inv.cgstAmount)),
    sgst: round2(num(inv.sgstAmount)),
    igst: round2(num(inv.igstAmount)),
    cess: round2(num(inv.cessAmount)),
    total: round2(num(inv.totalAmount))
  }));

  const totals = rows.reduce(
    (acc, r) => {
      acc.taxable = round2(acc.taxable + r.taxable);
      acc.cgst = round2(acc.cgst + r.cgst);
      acc.sgst = round2(acc.sgst + r.sgst);
      acc.igst = round2(acc.igst + r.igst);
      acc.cess = round2(acc.cess + r.cess);
      acc.total = round2(acc.total + r.total);
      return acc;
    },
    { count: rows.length, taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, total: 0 }
  );

  return { rows, totals };
}

/**
 * Purchase register: one row per purchase, incl. ITC-eligible amount.
 */
function buildPurchaseRegister(purchases) {
  const rows = (purchases || []).map((p) => {
    const totalTax = num(p.cgstAmount) + num(p.sgstAmount) + num(p.igstAmount) + num(p.cessAmount);
    const itcEligible = p.isItcEligible
      ? round2(num(p.itcAmount) > 0 ? num(p.itcAmount) : totalTax)
      : 0;
    return {
      date: formatDate(p.supplierInvoiceDate),
      invoiceNumber: p.supplierInvoiceNumber,
      supplier: p.supplier ? p.supplier.supplierName : '',
      taxable: round2(num(p.taxableAmount)),
      cgst: round2(num(p.cgstAmount)),
      sgst: round2(num(p.sgstAmount)),
      igst: round2(num(p.igstAmount)),
      cess: round2(num(p.cessAmount)),
      total: round2(num(p.totalAmount)),
      itcEligible
    };
  });

  const totals = rows.reduce(
    (acc, r) => {
      acc.taxable = round2(acc.taxable + r.taxable);
      acc.cgst = round2(acc.cgst + r.cgst);
      acc.sgst = round2(acc.sgst + r.sgst);
      acc.igst = round2(acc.igst + r.igst);
      acc.cess = round2(acc.cess + r.cess);
      acc.total = round2(acc.total + r.total);
      acc.itcEligible = round2(acc.itcEligible + r.itcEligible);
      return acc;
    },
    { count: rows.length, taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, total: 0, itcEligible: 0 }
  );

  return { rows, totals };
}

/**
 * Tax-rate summary for sales: grouped by GST rate.
 */
function buildTaxRateSummary(items) {
  const map = new Map();

  for (const item of items || []) {
    const rate = num(item.gstRate);
    const tax = num(item.cgstAmount) + num(item.sgstAmount) + num(item.igstAmount) + num(item.cessAmount);
    if (!map.has(rate)) {
      map.set(rate, { gstRate: rate, taxable: 0, tax: 0, count: 0 });
    }
    const entry = map.get(rate);
    entry.taxable = round2(entry.taxable + num(item.taxableAmount));
    entry.tax = round2(entry.tax + tax);
    entry.count += 1;
  }

  const rows = Array.from(map.values()).sort((a, b) => a.gstRate - b.gstRate);
  const totals = rows.reduce(
    (acc, r) => {
      acc.taxable = round2(acc.taxable + r.taxable);
      acc.tax = round2(acc.tax + r.tax);
      acc.count += r.count;
      return acc;
    },
    { taxable: 0, tax: 0, count: 0 }
  );

  return { rows, totals };
}

/**
 * HSN/SAC summary for sales: grouped by HSN or SAC code.
 */
function buildHsnSummary(items) {
  const map = new Map();

  for (const item of items || []) {
    const hsnSac = item.hsnCode || item.sacCode || 'N/A';
    const tax = num(item.cgstAmount) + num(item.sgstAmount) + num(item.igstAmount) + num(item.cessAmount);
    if (!map.has(hsnSac)) {
      map.set(hsnSac, { hsnSac, qty: 0, taxable: 0, tax: 0 });
    }
    const entry = map.get(hsnSac);
    entry.qty = round2(entry.qty + num(item.quantity));
    entry.taxable = round2(entry.taxable + num(item.taxableAmount));
    entry.tax = round2(entry.tax + tax);
  }

  const rows = Array.from(map.values());
  const totals = rows.reduce(
    (acc, r) => {
      acc.qty = round2(acc.qty + r.qty);
      acc.taxable = round2(acc.taxable + r.taxable);
      acc.tax = round2(acc.tax + r.tax);
      return acc;
    },
    { qty: 0, taxable: 0, tax: 0 }
  );

  return { rows, totals };
}

/**
 * ITC analysis: available (from eligible purchases) vs proxy-utilized
 * (capped at output liability from sales) vs balance, per tax head.
 */
function buildItcAnalysis(purchases, invoices) {
  const heads = ['cgst', 'sgst', 'igst', 'cess'];
  const fieldByHead = {
    cgst: 'cgstAmount',
    sgst: 'sgstAmount',
    igst: 'igstAmount',
    cess: 'cessAmount'
  };

  const available = { cgst: 0, sgst: 0, igst: 0, cess: 0 };
  for (const p of purchases || []) {
    if (!p.isItcEligible) continue;
    for (const head of heads) {
      available[head] = round2(available[head] + num(p[fieldByHead[head]]));
    }
  }

  const liability = { cgst: 0, sgst: 0, igst: 0, cess: 0 };
  for (const inv of invoices || []) {
    for (const head of heads) {
      liability[head] = round2(liability[head] + num(inv[fieldByHead[head]]));
    }
  }

  const rows = heads.map((head) => {
    const avail = round2(available[head]);
    const utilized = round2(Math.min(avail, liability[head])); // proxy
    const balance = round2(avail - utilized);
    return { taxHead: head.toUpperCase(), available: avail, utilized, balance };
  });

  const totals = rows.reduce(
    (acc, r) => {
      acc.available = round2(acc.available + r.available);
      acc.utilized = round2(acc.utilized + r.utilized);
      acc.balance = round2(acc.balance + r.balance);
      return acc;
    },
    { available: 0, utilized: 0, balance: 0 }
  );

  return { rows, totals };
}

// CSV column definitions per report (used for ?format=csv)
const CSV_COLUMNS = {
  'sales-register': [
    { key: 'date', header: 'Date' },
    { key: 'invoiceNumber', header: 'Invoice Number' },
    { key: 'customer', header: 'Customer' },
    { key: 'taxable', header: 'Taxable' },
    { key: 'cgst', header: 'CGST' },
    { key: 'sgst', header: 'SGST' },
    { key: 'igst', header: 'IGST' },
    { key: 'cess', header: 'Cess' },
    { key: 'total', header: 'Total' }
  ],
  'purchase-register': [
    { key: 'date', header: 'Date' },
    { key: 'invoiceNumber', header: 'Invoice Number' },
    { key: 'supplier', header: 'Supplier' },
    { key: 'taxable', header: 'Taxable' },
    { key: 'cgst', header: 'CGST' },
    { key: 'sgst', header: 'SGST' },
    { key: 'igst', header: 'IGST' },
    { key: 'cess', header: 'Cess' },
    { key: 'total', header: 'Total' },
    { key: 'itcEligible', header: 'ITC Eligible' }
  ],
  'tax-rate-summary': [
    { key: 'gstRate', header: 'GST Rate (%)' },
    { key: 'taxable', header: 'Taxable' },
    { key: 'tax', header: 'Tax' },
    { key: 'count', header: 'Count' }
  ],
  'hsn-summary': [
    { key: 'hsnSac', header: 'HSN/SAC' },
    { key: 'qty', header: 'Quantity' },
    { key: 'taxable', header: 'Taxable' },
    { key: 'tax', header: 'Tax' }
  ],
  'itc-analysis': [
    { key: 'taxHead', header: 'Tax Head' },
    { key: 'available', header: 'Available' },
    { key: 'utilized', header: 'Utilized (proxy)' },
    { key: 'balance', header: 'Balance' }
  ]
};

module.exports = {
  num,
  round2,
  formatDate,
  buildSalesRegister,
  buildPurchaseRegister,
  buildTaxRateSummary,
  buildHsnSummary,
  buildItcAnalysis,
  CSV_COLUMNS
};
