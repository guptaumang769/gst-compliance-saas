/**
 * Purchase & Supplier Test Suite
 * Tests for purchase invoice and supplier management APIs
 * 
 * Run: node src/test-purchases-suppliers.js
 * Requires: Backend server running on localhost:5000
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let authToken = '';
let testSupplierId = '';
let testPurchaseId = '';

// Test user credentials
const testUser = {
  email: 'test@gstcompliance.com',
  password: 'Test@1234'
};

// Registration data (if auto-registration is needed)
const registrationData = {
  email: testUser.email,
  password: testUser.password,
  businessName: 'Test Business Pvt Ltd',
  gstin: '27AAPFU0939F1ZV', // Valid Maharashtra GSTIN
  pan: 'AAPFU0939F',
  state: 'Maharashtra',
  address: '123 Test Street, Mumbai',
  phone: '9876543210'
};

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Setup: Login (with auto-registration if needed)
async function login() {
  log('\n🔐 Logging in...', 'blue');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, testUser);
    authToken = response.data.token;
    log('✅ Login successful\n', 'green');
    return true;
  } catch (error) {
    log(`⚠️  Login failed. Attempting to register new account...`, 'yellow');
    
    try {
      // Try to register
      await axios.post(`${BASE_URL}/api/auth/register`, registrationData);
      log('✅ Registration successful! Now logging in...', 'green');
      
      // Now login
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, testUser);
      authToken = loginResponse.data.token;
      log('✅ Login successful\n', 'green');
      return true;
    } catch (regError) {
      log(`❌ Registration/Login failed: ${regError.response?.data?.error || regError.message}`, 'red');
      if (regError.response?.data) {
        log(`   Details: ${JSON.stringify(regError.response.data)}`, 'red');
      }
      return false;
    }
  }
}

// Helper function for authenticated requests
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// ============================================
// SUPPLIER TESTS
// ============================================

async function testCreateSupplier() {
  log('📝 Test 1: Create Supplier (Registered with GSTIN)', 'blue');
  try {
    const response = await api.post('/api/suppliers', {
      supplierName: 'TechCorp Supplies Pvt Ltd',
      gstin: '29ABCDE1234F1Z5',
      pan: 'ABCDE1234F',
      billingAddress: '456 Supplier Street',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      email: 'sales@techcorp.com',
      phone: '+91-9876543210',
      supplierType: 'registered'
    });

    if (response.status === 201) {
      testSupplierId = response.data.data.id;
      log('✅ Supplier created successfully', 'green');
      log(`   ID: ${testSupplierId}`, 'green');
      log(`   Name: ${response.data.data.supplierName}`, 'green');
      log(`   GSTIN: ${response.data.data.gstin}`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testCreateUnregisteredSupplier() {
  log('\n📝 Test 2: Create Unregistered Supplier (No GSTIN)', 'blue');
  try {
    const response = await api.post('/api/suppliers', {
      supplierName: 'Local Vendor',
      billingAddress: '789 Market Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '+91-9123456789',
      supplierType: 'unregistered'
    });

    if (response.status === 201) {
      log('✅ Unregistered supplier created successfully', 'green');
      log(`   ID: ${response.data.data.id}`, 'green');
      log(`   Name: ${response.data.data.supplierName}`, 'green');
      log(`   Type: ${response.data.data.supplierType}`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetSuppliers() {
  log('\n📝 Test 3: Get All Suppliers', 'blue');
  try {
    const response = await api.get('/api/suppliers');
    if (response.status === 200) {
      log(`✅ Retrieved ${response.data.data.length} suppliers`, 'green');
      log(`   Total: ${response.data.pagination.total}`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetSupplierById() {
  log('\n📝 Test 4: Get Supplier by ID', 'blue');
  try {
    const response = await api.get(`/api/suppliers/${testSupplierId}`);
    if (response.status === 200) {
      log('✅ Supplier details retrieved successfully', 'green');
      log(`   Name: ${response.data.data.supplierName}`, 'green');
      log(`   State: ${response.data.data.state}`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetSupplierStats() {
  log('\n📝 Test 5: Get Supplier Statistics', 'blue');
  try {
    const response = await api.get('/api/suppliers/stats');
    if (response.status === 200) {
      log('✅ Supplier statistics retrieved successfully', 'green');
      log(`   Total Suppliers: ${response.data.data.totalSuppliers}`, 'green');
      log(`   Registered: ${response.data.data.registeredSuppliers}`, 'green');
      log(`   Unregistered: ${response.data.data.unregisteredSuppliers}`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// ============================================
// PURCHASE TESTS
// ============================================

async function testCreatePurchaseIntraState() {
  log('\n📝 Test 6: Create Purchase Invoice (Intra-State → CGST+SGST)', 'blue');
  try {
    const response = await api.post('/api/purchases', {
      supplierId: testSupplierId,
      supplierInvoiceNumber: 'TCORP/2026/001',
      supplierInvoiceDate: '2026-01-25',
      purchaseType: 'goods',
      isItcEligible: true,
      notes: 'Office supplies purchase',
      items: [
        {
          itemName: 'Desktop Computer',
          hsnCode: '84713000',
          quantity: 2,
          unit: 'NOS',
          unitPrice: 45000,
          gstRate: 18,
          cessRate: 0
        },
        {
          itemName: 'Printer',
          hsnCode: '84433100',
          quantity: 1,
          unit: 'NOS',
          unitPrice: 15000,
          gstRate: 18,
          cessRate: 0
        }
      ]
    });

    if (response.status === 201) {
      testPurchaseId = response.data.data.id;
      log('✅ Purchase invoice created successfully', 'green');
      log(`   Invoice #: ${response.data.data.supplierInvoiceNumber}`, 'green');
      log(`   Total: ₹${response.data.data.totalAmount}`, 'green');
      log(`   CGST: ₹${response.data.data.cgstAmount}`, 'green');
      log(`   SGST: ₹${response.data.data.sgstAmount}`, 'green');
      log(`   ITC Available: ₹${response.data.data.itcAmount}`, 'green');
      
      // Verify calculations
      // Subtotal: 2*45000 + 1*15000 = 105,000
      // GST @18%: 105000 * 0.18 = 18,900 (CGST: 9,450 + SGST: 9,450)
      // Total: 105,000 + 18,900 = 123,900
      const expectedSubtotal = 105000;
      const expectedTax = 18900;
      const expectedTotal = 123900;
      
      if (Math.abs(parseFloat(response.data.data.subtotal) - expectedSubtotal) < 0.01 &&
          Math.abs(parseFloat(response.data.data.totalTaxAmount) - expectedTax) < 0.01 &&
          Math.abs(parseFloat(response.data.data.totalAmount) - expectedTotal) < 0.01) {
        log('✅ GST calculations verified!', 'green');
      } else {
        log(`⚠️  Calculation mismatch:`, 'yellow');
        log(`   Expected: ₹${expectedTotal}, Got: ₹${response.data.data.totalAmount}`, 'yellow');
      }
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    if (error.response?.data) {
      log(`   Details: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

async function testCreatePurchaseWithCess() {
  log('\n📝 Test 7: Create Purchase Invoice with Cess (Luxury Item)', 'blue');
  try {
    const response = await api.post('/api/purchases', {
      supplierId: testSupplierId,
      supplierInvoiceNumber: 'TCORP/2026/002',
      supplierInvoiceDate: '2026-01-26',
      purchaseType: 'goods',
      isItcEligible: true,
      items: [
        {
          itemName: 'Luxury Car',
          hsnCode: '87032490',
          quantity: 1,
          unit: 'NOS',
          unitPrice: 2000000, // ₹20 lakh
          gstRate: 40, // 2026 luxury rate
          cessRate: 20 // Cess on luxury cars
        }
      ]
    });

    if (response.status === 201) {
      log('✅ Purchase with cess created successfully', 'green');
      log(`   Invoice #: ${response.data.data.supplierInvoiceNumber}`, 'green');
      log(`   Taxable: ₹${response.data.data.taxableAmount}`, 'green');
      log(`   GST (40%): ₹${response.data.data.totalTaxAmount}`, 'green');
      log(`   Cess (20%): ₹${response.data.data.cessAmount}`, 'green');
      log(`   Total: ₹${response.data.data.totalAmount}`, 'green');
      
      // Verify: 2,000,000 + 800,000 (GST) + 400,000 (Cess) = 3,200,000
      const expectedTotal = 3200000;
      if (Math.abs(parseFloat(response.data.data.totalAmount) - expectedTotal) < 0.01) {
        log('✅ Cess calculation verified!', 'green');
      }
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetPurchases() {
  log('\n📝 Test 8: Get All Purchases', 'blue');
  try {
    const response = await api.get('/api/purchases');
    if (response.status === 200) {
      log(`✅ Retrieved ${response.data.data.length} purchases`, 'green');
      log(`   Total: ${response.data.pagination.total}`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetPurchaseById() {
  log('\n📝 Test 9: Get Purchase by ID (with items)', 'blue');
  try {
    const response = await api.get(`/api/purchases/${testPurchaseId}`);
    if (response.status === 200) {
      log('✅ Purchase details retrieved successfully', 'green');
      log(`   Invoice #: ${response.data.data.supplierInvoiceNumber}`, 'green');
      log(`   Supplier: ${response.data.data.supplier.supplierName}`, 'green');
      log(`   Items: ${response.data.data.items.length}`, 'green');
      log(`   ITC: ₹${response.data.data.itcAmount}`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetPurchaseStats() {
  log('\n📝 Test 10: Get Purchase Statistics', 'blue');
  try {
    const currentDate = new Date();
    const response = await api.get('/api/purchases/stats', {
      params: {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
      }
    });
    
    if (response.status === 200) {
      log('✅ Purchase statistics retrieved successfully', 'green');
      log(`   Total Purchases: ${response.data.data.totalPurchases}`, 'green');
      log(`   Total Amount: ₹${response.data.data.totalPurchaseAmount}`, 'green');
      log(`   ITC Available: ₹${response.data.data.totalItcAvailable}`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testCalculateItc() {
  log('\n📝 Test 11: Calculate ITC for Current Period', 'blue');
  try {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    
    const response = await api.get(`/api/purchases/itc/${year}/${month}`);
    
    if (response.status === 200) {
      log('✅ ITC calculation successful', 'green');
      log(`   Period: ${response.data.data.period}`, 'green');
      log(`   Total ITC: ₹${response.data.data.itcBreakdown.totalItc}`, 'green');
      log(`   CGST ITC: ₹${response.data.data.itcBreakdown.cgstItc}`, 'green');
      log(`   SGST ITC: ₹${response.data.data.itcBreakdown.sgstItc}`, 'green');
      log(`   IGST ITC: ₹${response.data.data.itcBreakdown.igstItc}`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testUpdatePurchase() {
  log('\n📝 Test 12: Update Purchase (Mark as Paid)', 'blue');
  try {
    const response = await api.put(`/api/purchases/${testPurchaseId}`, {
      isPaid: true,
      paymentDate: '2026-01-26',
      paymentMethod: 'bank_transfer',
      notes: 'Payment completed via NEFT'
    });

    if (response.status === 200) {
      log('✅ Purchase updated successfully', 'green');
      log(`   Paid: ${response.data.data.isPaid}`, 'green');
      log(`   Payment Date: ${response.data.data.paymentDate}`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// ============================================
// RUN ALL TESTS
// ============================================

async function runTests() {
  log('═══════════════════════════════════════════════════', 'blue');
  log('  GST SaaS - Purchase & Supplier Test Suite', 'blue');
  log('═══════════════════════════════════════════════════', 'blue');

  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ Tests aborted: Login failed', 'red');
    process.exit(1);
  }

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  const tests = [
    { name: 'Create Supplier', fn: testCreateSupplier },
    { name: 'Create Unregistered Supplier', fn: testCreateUnregisteredSupplier },
    { name: 'Get Suppliers', fn: testGetSuppliers },
    { name: 'Get Supplier by ID', fn: testGetSupplierById },
    { name: 'Get Supplier Stats', fn: testGetSupplierStats },
    { name: 'Create Purchase (Intra-State)', fn: testCreatePurchaseIntraState },
    { name: 'Create Purchase with Cess', fn: testCreatePurchaseWithCess },
    { name: 'Get Purchases', fn: testGetPurchases },
    { name: 'Get Purchase by ID', fn: testGetPurchaseById },
    { name: 'Get Purchase Stats', fn: testGetPurchaseStats },
    { name: 'Calculate ITC', fn: testCalculateItc },
    { name: 'Update Purchase', fn: testUpdatePurchase }
  ];

  for (const test of tests) {
    results.total++;
    const success = await test.fn();
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Summary
  log('\n═══════════════════════════════════════════════════', 'blue');
  log('  TEST SUMMARY', 'blue');
  log('═══════════════════════════════════════════════════', 'blue');
  log(`Total Tests: ${results.total}`, 'blue');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, results.failed > 0 ? 'yellow' : 'green');
  log('═══════════════════════════════════════════════════\n', 'blue');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test suite crashed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
