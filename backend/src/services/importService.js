/**
 * Bulk CSV Import Service (Phase 3: Bulk CSV import)
 *
 * Parses uploaded CSV text and creates customers/suppliers/products, reusing the
 * existing create* services (so all validation stays consistent). Bad rows are
 * skipped and reported; valid rows are created. Also provides CSV templates.
 */

const { parseCsv } = require('../utils/csvParser');
const { toCSV } = require('../utils/csvSerializer');
const customerService = require('./customerService');
const supplierService = require('./supplierService');
const productService = require('./productService');

/**
 * Template column definitions + one example row for each entity.
 */
const TEMPLATES = {
  customers: {
    columns: [
      'customerName', 'gstin', 'pan', 'billingAddress', 'shippingAddress',
      'city', 'state', 'pincode', 'email', 'phone', 'contactPerson', 'customerType'
    ],
    example: {
      customerName: 'Sunrise Enterprises',
      gstin: '27AABCS1429B1Z1',
      pan: 'AABCS1429B',
      billingAddress: '22 Market Road, Pune',
      shippingAddress: '22 Market Road, Pune',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      email: 'buyer@sunrise.test',
      phone: '9800000001',
      contactPerson: 'Ramesh',
      customerType: 'b2b'
    }
  },
  suppliers: {
    columns: [
      'supplierName', 'gstin', 'pan', 'billingAddress', 'shippingAddress',
      'city', 'state', 'pincode', 'email', 'phone', 'contactPerson', 'supplierType'
    ],
    example: {
      supplierName: 'Metro Wholesale Supplies',
      gstin: '27AAGCM1234K1Z8',
      pan: 'AAGCM1234K',
      billingAddress: '5 Industrial Estate, Mumbai',
      shippingAddress: '5 Industrial Estate, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      email: 'sales@metro.test',
      phone: '9811100001',
      contactPerson: 'Suresh',
      supplierType: 'registered'
    }
  },
  products: {
    columns: [
      'name', 'type', 'hsnSac', 'defaultGstRate', 'defaultCessRate',
      'unit', 'sellingPrice', 'description'
    ],
    example: {
      name: 'Steel Water Bottle',
      type: 'GOODS',
      hsnSac: '9617',
      defaultGstRate: '18',
      defaultCessRate: '0',
      unit: 'NOS',
      sellingPrice: '450',
      description: '750ml insulated steel bottle'
    }
  }
};

/**
 * Build a CSV template string (header + one example row).
 */
function getTemplate(kind) {
  const def = TEMPLATES[kind];
  if (!def) throw new Error('Invalid template kind');
  const columns = def.columns.map((key) => ({ key, header: key }));
  return toCSV([def.example], columns);
}

/**
 * Generic importer: parses CSV then runs `createFn(row, lineNumber)` per row.
 */
async function importRows(csvText, createFn) {
  const rows = parseCsv(csvText);
  const result = { success: true, created: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i += 1) {
    const lineNumber = i + 2; // +1 for header, +1 for 1-based
    const row = rows[i];
    try {
      await createFn(row);
      result.created += 1;
    } catch (error) {
      result.skipped += 1;
      result.errors.push({ row: lineNumber, message: error.message || 'Failed to import row' });
    }
  }

  return result;
}

function cleanStr(value) {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  return s === '' ? undefined : s;
}

async function importCustomers(businessId, csvText) {
  return importRows(csvText, async (row) => {
    if (!cleanStr(row.customerName)) throw new Error('Missing required field: customerName');
    await customerService.createCustomer(businessId, {
      customerName: cleanStr(row.customerName),
      gstin: cleanStr(row.gstin),
      pan: cleanStr(row.pan),
      billingAddress: cleanStr(row.billingAddress),
      shippingAddress: cleanStr(row.shippingAddress),
      city: cleanStr(row.city),
      state: cleanStr(row.state),
      pincode: cleanStr(row.pincode),
      email: cleanStr(row.email),
      phone: cleanStr(row.phone),
      contactPerson: cleanStr(row.contactPerson),
      customerType: cleanStr(row.customerType) || 'b2b'
    });
  });
}

async function importSuppliers(businessId, csvText) {
  return importRows(csvText, async (row) => {
    if (!cleanStr(row.supplierName)) throw new Error('Missing required field: supplierName');
    await supplierService.createSupplier({
      businessId,
      supplierName: cleanStr(row.supplierName),
      gstin: cleanStr(row.gstin),
      pan: cleanStr(row.pan),
      billingAddress: cleanStr(row.billingAddress),
      shippingAddress: cleanStr(row.shippingAddress),
      city: cleanStr(row.city),
      state: cleanStr(row.state),
      pincode: cleanStr(row.pincode),
      email: cleanStr(row.email),
      phone: cleanStr(row.phone),
      contactPerson: cleanStr(row.contactPerson),
      supplierType: cleanStr(row.supplierType)
    });
  });
}

async function importProducts(businessId, csvText) {
  return importRows(csvText, async (row) => {
    if (!cleanStr(row.name)) throw new Error('Missing required field: name');
    const toNum = (v) => {
      const s = cleanStr(v);
      if (s === undefined) return undefined;
      const n = Number(s);
      if (!Number.isFinite(n)) throw new Error(`Invalid number: ${v}`);
      return n;
    };
    await productService.createProduct(businessId, {
      name: cleanStr(row.name),
      type: cleanStr(row.type) || 'GOODS',
      hsnSac: cleanStr(row.hsnSac),
      defaultGstRate: toNum(row.defaultGstRate) ?? 0,
      defaultCessRate: toNum(row.defaultCessRate) ?? 0,
      unit: cleanStr(row.unit),
      sellingPrice: toNum(row.sellingPrice),
      description: cleanStr(row.description)
    });
  });
}

module.exports = {
  TEMPLATES,
  getTemplate,
  importCustomers,
  importSuppliers,
  importProducts
};
