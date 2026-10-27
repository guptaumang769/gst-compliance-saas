/**
 * Prisma Seed Script
 * Populates the database with a demo business, an OWNER user with known
 * credentials, plus customers, suppliers, products and a handful of
 * invoices/purchases across the current and previous month so the dashboard,
 * reports and GST returns have data to work with.
 *
 * Idempotent: uses upserts / find-or-create so it can be run repeatedly.
 *
 * Run: `npm run seed` (from backend/) or `npx prisma db seed`.
 */

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { calculateInvoiceGST } = require('../src/services/gstCalculator');

const prisma = new PrismaClient();

// ─── Demo credentials ────────────────────────────────────────────────────
const DEMO_EMAIL = 'demo@gstsaas.test';
const DEMO_PASSWORD = 'Demo@1234';

// Fixed IDs keep the seed idempotent across runs.
const IDS = {
  user: 'seed-user-owner',
  business: 'seed-business-demo',
  customerB2BIntra: 'seed-customer-1',
  customerB2BInter: 'seed-customer-2',
  customerB2C: 'seed-customer-3',
  supplier1: 'seed-supplier-1',
  supplier2: 'seed-supplier-2',
  product1: 'seed-product-1',
  product2: 'seed-product-2',
  product3: 'seed-product-3',
  // Phase 3 demo rows
  eway1: 'seed-eway-1',
  eway2: 'seed-eway-2',
  tds1: 'seed-tds-1',
  tcs1: 'seed-tcs-1',
  movement1: 'seed-movement-1',
  movement2: 'seed-movement-2',
  bankStatement1: 'seed-bank-statement-1',
  bankTxn1: 'seed-bank-txn-1',
  bankTxn2: 'seed-bank-txn-2',
  bankTxn3: 'seed-bank-txn-3'
};

const SELLER_STATE = 'Maharashtra';
const SELLER_STATE_CODE = '27';

function monthDate(monthsAgo, day) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo, day, 10, 0, 0);
}

async function seedUserAndBusiness() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { role: 'OWNER', isActive: true, name: 'Demo Owner' },
    create: {
      id: IDS.user,
      email: DEMO_EMAIL,
      name: 'Demo Owner',
      passwordHash,
      emailVerified: true,
      role: 'OWNER',
      isActive: true
    }
  });

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 365);

  const business = await prisma.business.upsert({
    where: { gstin: '27AAPFU0939F1ZV' },
    update: { userId: user.id, isActive: true },
    create: {
      id: IDS.business,
      userId: user.id,
      businessName: 'Demo Traders Pvt Ltd',
      tradeName: 'Demo Traders',
      businessType: 'regular',
      gstin: '27AAPFU0939F1ZV',
      pan: 'AAPFU0939F',
      stateCode: SELLER_STATE_CODE,
      registrationDate: new Date('2020-04-01'),
      addressLine1: '101 Business Park',
      addressLine2: 'Andheri East',
      city: 'Mumbai',
      state: SELLER_STATE,
      pincode: '400069',
      email: 'accounts@demotraders.test',
      phone: '9876500000',
      filingFrequency: 'monthly',
      invoicePrefix: 'INV',
      invoiceNumberFormat: '{PREFIX}-{YYYY}{MM}-{SEQ}',
      invoiceNextNumber: 1,
      subscriptionPlan: 'professional',
      subscriptionStatus: 'active',
      subscriptionValidUntil: trialEnd,
      invoiceLimit: 1000,
      invoiceCountCurrentMonth: 0,
      isActive: true
    }
  });

  return { user, business };
}

async function seedCustomers(businessId) {
  const customers = [
    {
      id: IDS.customerB2BIntra,
      customerName: 'Sunrise Enterprises',
      gstin: '27AABCS1429B1Z1',
      pan: 'AABCS1429B',
      billingAddress: '22 Market Road, Pune',
      shippingAddress: '22 Market Road, Pune',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '411001',
      email: 'buyer@sunrise.test',
      phone: '9800000001',
      customerType: 'b2b'
    },
    {
      id: IDS.customerB2BInter,
      customerName: 'Bengaluru Tech LLP',
      gstin: '29AABCB2233C1Z5',
      pan: 'AABCB2233C',
      billingAddress: '9 MG Road, Bengaluru',
      shippingAddress: '9 MG Road, Bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      stateCode: '29',
      pincode: '560001',
      email: 'accounts@bengalurutech.test',
      phone: '9800000002',
      customerType: 'b2b'
    },
    {
      id: IDS.customerB2C,
      customerName: 'Walk-in Customer',
      billingAddress: 'Retail Counter, Mumbai',
      shippingAddress: 'Retail Counter, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: null,
      pincode: '400001',
      phone: '9800000003',
      customerType: 'b2c'
    }
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: { businessId, isActive: true },
      create: { ...c, businessId, isActive: true }
    });
  }
}

async function seedSuppliers(businessId) {
  const suppliers = [
    {
      id: IDS.supplier1,
      supplierName: 'Metro Wholesale Supplies',
      gstin: '27AAGCM1234K1Z8',
      pan: 'AAGCM1234K',
      billingAddress: '5 Industrial Estate, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '400001',
      email: 'sales@metrowholesale.test',
      phone: '9811100001',
      supplierType: 'registered'
    },
    {
      id: IDS.supplier2,
      supplierName: 'Delhi Components Co',
      gstin: '07AAECD5678L1Z2',
      pan: 'AAECD5678L',
      billingAddress: '14 Nehru Place, New Delhi',
      city: 'New Delhi',
      state: 'Delhi',
      stateCode: '07',
      pincode: '110019',
      email: 'sales@delhicomponents.test',
      phone: '9811100002',
      supplierType: 'registered'
    }
  ];

  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { id: s.id },
      update: { businessId, isActive: true },
      create: { ...s, businessId, isActive: true }
    });
  }
}

async function seedProducts(businessId) {
  const products = [
    {
      id: IDS.product1,
      name: 'Steel Water Bottle',
      type: 'GOODS',
      hsnSac: '9617',
      defaultGstRate: 18,
      defaultCessRate: 0,
      unit: 'NOS',
      sellingPrice: 450,
      description: '750ml insulated steel bottle',
      stockQty: 120,
      reorderLevel: 25
    },
    {
      id: IDS.product2,
      name: 'Cotton T-Shirt',
      type: 'GOODS',
      hsnSac: '6109',
      defaultGstRate: 5,
      defaultCessRate: 0,
      unit: 'NOS',
      sellingPrice: 299,
      description: 'Round-neck cotton t-shirt',
      stockQty: 8,
      reorderLevel: 20
    },
    {
      id: IDS.product3,
      name: 'Software Consulting',
      type: 'SERVICE',
      hsnSac: '9983',
      defaultGstRate: 18,
      defaultCessRate: 0,
      unit: 'HRS',
      sellingPrice: 2000,
      description: 'Hourly software consulting service',
      stockQty: 0,
      reorderLevel: 0
    }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: { businessId, isActive: true, stockQty: p.stockQty, reorderLevel: p.reorderLevel },
      create: { ...p, businessId, isActive: true }
    });
  }
}

async function createInvoiceIfMissing(business, customer, { invoiceNumber, date, items }) {
  const existing = await prisma.invoice.findFirst({
    where: { businessId: business.id, invoiceNumber }
  });
  if (existing) return existing;

  const invoiceType = customer.customerType === 'b2c' ? 'b2c_small' : customer.customerType;
  const buyerStateCode = customer.stateCode || business.stateCode;

  const calc = calculateInvoiceGST({
    items,
    sellerStateCode: business.stateCode,
    buyerStateCode,
    invoiceType,
    discountAmount: 0
  });

  return prisma.invoice.create({
    data: {
      businessId: business.id,
      customerId: customer.id,
      invoiceNumber,
      invoiceDate: date,
      invoiceType,
      subtotal: calc.subtotal,
      discountAmount: calc.discountAmount,
      taxableAmount: calc.taxableAmount,
      cgstAmount: calc.cgstAmount,
      sgstAmount: calc.sgstAmount,
      igstAmount: calc.igstAmount,
      cessAmount: calc.cessAmount,
      totalTaxAmount: calc.totalTaxAmount,
      totalAmount: calc.totalAmount,
      roundOffAmount: calc.roundOffAmount,
      sellerState: business.state,
      sellerStateCode: business.stateCode,
      buyerState: customer.state,
      buyerStateCode,
      placeOfSupply: customer.state,
      reverseCharge: false,
      isActive: true,
      items: {
        create: calc.items.map((it) => ({
          itemName: it.itemName,
          description: it.description || null,
          hsnCode: it.hsnCode || null,
          sacCode: it.sacCode || null,
          quantity: it.quantity,
          unit: it.unit || 'NOS',
          unitPrice: it.unitPrice,
          discountPercent: it.discountPercent || 0,
          discountAmount: it.discountAmount || 0,
          taxableAmount: it.taxableAmount,
          gstRate: it.gstRate,
          cgstRate: it.cgstRate,
          cgstAmount: it.cgstAmount,
          sgstRate: it.sgstRate,
          sgstAmount: it.sgstAmount,
          igstRate: it.igstRate,
          igstAmount: it.igstAmount,
          cessRate: it.cessRate || 0,
          cessAmount: it.cessAmount || 0,
          totalAmount: it.totalAmount
        }))
      }
    }
  });
}

async function seedInvoices(business, customers) {
  const [intra, inter, b2c] = customers;

  await createInvoiceIfMissing(business, intra, {
    invoiceNumber: 'INV-DEMO-0001',
    date: monthDate(1, 8),
    items: [
      { itemName: 'Steel Water Bottle', hsnCode: '9617', quantity: 10, unitPrice: 450, gstRate: 18 },
      { itemName: 'Cotton T-Shirt', hsnCode: '6109', quantity: 20, unitPrice: 299, gstRate: 5 }
    ]
  });

  await createInvoiceIfMissing(business, inter, {
    invoiceNumber: 'INV-DEMO-0002',
    date: monthDate(1, 20),
    items: [
      { itemName: 'Software Consulting', sacCode: '9983', hsnCode: null, quantity: 15, unitPrice: 2000, gstRate: 18 }
    ]
  });

  await createInvoiceIfMissing(business, b2c, {
    invoiceNumber: 'INV-DEMO-0003',
    date: monthDate(0, 5),
    items: [
      { itemName: 'Steel Water Bottle', hsnCode: '9617', quantity: 3, unitPrice: 450, gstRate: 18 }
    ]
  });

  await createInvoiceIfMissing(business, intra, {
    invoiceNumber: 'INV-DEMO-0004',
    date: monthDate(0, 15),
    items: [
      { itemName: 'Cotton T-Shirt', hsnCode: '6109', quantity: 50, unitPrice: 299, gstRate: 5 },
      { itemName: 'Steel Water Bottle', hsnCode: '9617', quantity: 12, unitPrice: 450, gstRate: 18 }
    ]
  });
}

async function createPurchaseIfMissing(business, supplier, { invoiceNumber, date, items, purchaseType = 'goods' }) {
  const existing = await prisma.purchase.findFirst({
    where: { businessId: business.id, supplierInvoiceNumber: invoiceNumber, supplierId: supplier.id }
  });
  if (existing) return existing;

  const buyerStateCode = business.stateCode;
  const calc = calculateInvoiceGST({
    items,
    sellerStateCode: supplier.stateCode || business.stateCode,
    buyerStateCode,
    invoiceType: 'b2b',
    discountAmount: 0
  });

  return prisma.purchase.create({
    data: {
      businessId: business.id,
      supplierId: supplier.id,
      supplierInvoiceNumber: invoiceNumber,
      supplierInvoiceDate: date,
      purchaseType,
      subtotal: calc.subtotal,
      discountAmount: calc.discountAmount,
      taxableAmount: calc.taxableAmount,
      cgstAmount: calc.cgstAmount,
      sgstAmount: calc.sgstAmount,
      igstAmount: calc.igstAmount,
      cessAmount: calc.cessAmount,
      totalTaxAmount: calc.totalTaxAmount,
      totalAmount: calc.totalAmount,
      supplierState: supplier.state,
      supplierStateCode: supplier.stateCode,
      buyerState: business.state,
      buyerStateCode,
      isItcEligible: true,
      itcClaimType: 'full',
      itcAmount: calc.totalTaxAmount,
      placeOfSupply: business.state,
      reverseCharge: false,
      isActive: true,
      items: {
        create: calc.items.map((it) => ({
          itemName: it.itemName,
          description: it.description || null,
          hsnCode: it.hsnCode || null,
          sacCode: it.sacCode || null,
          quantity: it.quantity,
          unit: it.unit || 'NOS',
          unitPrice: it.unitPrice,
          discountPercent: it.discountPercent || 0,
          discountAmount: it.discountAmount || 0,
          taxableAmount: it.taxableAmount,
          gstRate: it.gstRate,
          cgstRate: it.cgstRate,
          cgstAmount: it.cgstAmount,
          sgstRate: it.sgstRate,
          sgstAmount: it.sgstAmount,
          igstRate: it.igstRate,
          igstAmount: it.igstAmount,
          cessRate: it.cessRate || 0,
          cessAmount: it.cessAmount || 0,
          isItcEligible: true,
          itcAmount: it.totalTaxAmount - it.taxableAmount,
          totalAmount: it.totalAmount
        }))
      }
    }
  });
}

async function seedPurchases(business, suppliers) {
  const [metro, delhi] = suppliers;

  await createPurchaseIfMissing(business, metro, {
    invoiceNumber: 'BILL-M-1001',
    date: monthDate(1, 6),
    items: [
      { itemName: 'Steel blanks', hsnCode: '7208', quantity: 100, unitPrice: 120, gstRate: 18 }
    ]
  });

  await createPurchaseIfMissing(business, delhi, {
    invoiceNumber: 'BILL-D-2002',
    date: monthDate(0, 9),
    items: [
      { itemName: 'Cotton fabric', hsnCode: '5208', quantity: 200, unitPrice: 60, gstRate: 5 }
    ]
  });
}

async function seedEwayBills(business) {
  const ewayBills = [
    {
      id: IDS.eway1,
      docNumber: 'INV-DEMO-0001',
      docDate: monthDate(1, 8),
      fromPlace: 'Mumbai',
      fromState: 'Maharashtra',
      toPlace: 'Pune',
      toState: 'Maharashtra',
      distanceKm: 150,
      transportMode: 'ROAD',
      transporterName: 'BlueDart Logistics',
      vehicleNumber: 'MH12AB1234',
      value: 12500.0,
      status: 'DRAFT'
    },
    {
      id: IDS.eway2,
      docNumber: 'INV-DEMO-0002',
      docDate: monthDate(1, 20),
      fromPlace: 'Mumbai',
      fromState: 'Maharashtra',
      toPlace: 'Bengaluru',
      toState: 'Karnataka',
      distanceKm: 980,
      transportMode: 'ROAD',
      transporterName: 'VRL Transport',
      vehicleNumber: 'KA05CD6789',
      value: 35400.0,
      status: 'GENERATED',
      ewbNumber: '271234567890',
      validUpto: monthDate(1, 25)
    }
  ];

  for (const e of ewayBills) {
    await prisma.eWayBill.upsert({
      where: { id: e.id },
      update: { businessId: business.id, isActive: true },
      create: { ...e, businessId: business.id, isActive: true }
    });
  }
}

async function seedTdsTcs(business) {
  const entries = [
    {
      id: IDS.tds1,
      type: 'TDS',
      section: '194C',
      partyName: 'Contractor Services LLP',
      taxableAmount: 100000,
      rate: 2,
      amount: 2000,
      period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      note: 'TDS on contractor payment'
    },
    {
      id: IDS.tcs1,
      type: 'TCS',
      section: '206C',
      partyName: 'Scrap Buyer Co',
      taxableAmount: 50000,
      rate: 1,
      amount: 500,
      period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      note: 'TCS on scrap sale'
    }
  ];

  for (const t of entries) {
    await prisma.tdsTcsEntry.upsert({
      where: { id: t.id },
      update: { businessId: business.id, isActive: true },
      create: { ...t, businessId: business.id, isActive: true }
    });
  }
}

async function seedStockMovements(business) {
  const movements = [
    {
      id: IDS.movement1,
      productId: IDS.product1,
      type: 'IN',
      qty: 120,
      reason: 'Opening stock',
      refType: 'seed'
    },
    {
      id: IDS.movement2,
      productId: IDS.product2,
      type: 'OUT',
      qty: 12,
      reason: 'Demo sale',
      refType: 'seed'
    }
  ];

  for (const m of movements) {
    await prisma.stockMovement.upsert({
      where: { id: m.id },
      update: { businessId: business.id },
      create: { ...m, businessId: business.id }
    });
  }
}

async function seedBank(business) {
  await prisma.bankStatement.upsert({
    where: { id: IDS.bankStatement1 },
    update: { businessId: business.id },
    create: { id: IDS.bankStatement1, businessId: business.id, name: 'Demo Bank Statement (Current A/c)' }
  });

  const txns = [
    {
      id: IDS.bankTxn1,
      date: monthDate(0, 6),
      description: 'NEFT credit from Sunrise Enterprises',
      amount: 5310.0,
      type: 'CREDIT',
      status: 'UNMATCHED'
    },
    {
      id: IDS.bankTxn2,
      date: monthDate(0, 10),
      description: 'Payment to Metro Wholesale Supplies',
      amount: 14160.0,
      type: 'DEBIT',
      status: 'UNMATCHED'
    },
    {
      id: IDS.bankTxn3,
      date: monthDate(0, 12),
      description: 'Bank charges',
      amount: 118.0,
      type: 'DEBIT',
      status: 'IGNORED'
    }
  ];

  for (const t of txns) {
    await prisma.bankTransaction.upsert({
      where: { id: t.id },
      update: { businessId: business.id, statementId: IDS.bankStatement1 },
      create: { ...t, businessId: business.id, statementId: IDS.bankStatement1 }
    });
  }
}

async function main() {
  console.log('🌱 Seeding demo data...');

  const { business } = await seedUserAndBusiness();
  await seedCustomers(business.id);
  await seedSuppliers(business.id);
  await seedProducts(business.id);

  const customers = await prisma.customer.findMany({
    where: { id: { in: [IDS.customerB2BIntra, IDS.customerB2BInter, IDS.customerB2C] } }
  });
  // Preserve intra, inter, b2c order
  const orderedCustomers = [IDS.customerB2BIntra, IDS.customerB2BInter, IDS.customerB2C]
    .map((id) => customers.find((c) => c.id === id))
    .filter(Boolean);

  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: [IDS.supplier1, IDS.supplier2] } }
  });
  const orderedSuppliers = [IDS.supplier1, IDS.supplier2]
    .map((id) => suppliers.find((s) => s.id === id))
    .filter(Boolean);

  await seedInvoices(business, orderedCustomers);
  await seedPurchases(business, orderedSuppliers);

  // Phase 3 demo data (guarded via upsert on fixed IDs — idempotent).
  await seedEwayBills(business);
  await seedTdsTcs(business);
  await seedStockMovements(business);
  await seedBank(business);

  console.log('\n✅ Seed complete!');
  console.log('════════════════════════════════════════');
  console.log('   DEMO LOGIN CREDENTIALS');
  console.log('════════════════════════════════════════');
  console.log(`   Email:    ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log('════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
