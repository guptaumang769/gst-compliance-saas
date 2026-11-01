/**
 * GST Returns Test Suite (GSTR-1 & GSTR-3B)
 * Tests for GST return generation
 * 
 * Run: node src/test-gstr-returns.js
 * Requires: Backend server running + test data (invoices & purchases)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let authToken = '';

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
  addressLine1: '123 Test Street',
  addressLine2: 'Andheri West',
  city: 'Mumbai',
  pincode: '400058',
  businessType: 'Private Limited',
  phone: '9876543210',
  businessEmail: 'business@testcompany.com'
};

// Color codes
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

// Helper for authenticated requests
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
// GSTR-1 TESTS
// ============================================

async function testGenerateGSTR1() {
  log('📄 Test 1: Generate GSTR-1 (Sales Return)', 'blue');
  try {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const response = await api.post('/api/gstr1/generate', {
      month,
      year
    });

    if (response.status === 200) {
      log('✅ GSTR-1 generated successfully', 'green');
      const { data } = response.data;
      
      log(`\n  Return ID: ${data.returnId}`, 'green');
      log(`  Filing Period: ${data.filingPeriod}`, 'green');
      log(`  Status: ${data.status}`, 'green');
      
      log('\n  Summary:', 'magenta');
      log(`    Total Invoices: ${data.data.summary.totalInvoices}`, 'green');
      log(`    B2B Invoices: ${data.data.summary.b2bInvoices}`, 'green');
      log(`    B2CL Invoices: ${data.data.summary.b2clInvoices}`, 'green');
      log(`    B2CS Invoices: ${data.data.summary.b2csInvoices}`, 'green');
      log(`    Export Invoices: ${data.data.summary.exportInvoices}`, 'green');
      
      log('\n  Tax Summary:', 'magenta');
      log(`    Taxable Value: ₹${data.data.summary.totalTaxableValue}`, 'green');
      log(`    CGST: ₹${data.data.summary.totalCGST}`, 'green');
      log(`    SGST: ₹${data.data.summary.totalSGST}`, 'green');
      log(`    IGST: ₹${data.data.summary.totalIGST}`, 'green');
      log(`    Total Tax: ₹${data.data.summary.totalTax}`, 'green');
      log(`    Gross Turnover: ₹${data.data.summary.totalInvoiceValue}`, 'green');
      
      // Verify B2B section structure
      if (data.data.b2b && data.data.b2b.length > 0) {
        log(`\n  B2B Section: ${data.data.b2b.length} customer(s)`, 'green');
        const firstB2B = data.data.b2b[0];
        log(`    Customer GSTIN: ${firstB2B.ctin}`, 'green');
        log(`    Invoices: ${firstB2B.inv.length}`, 'green');
      }
      
      // Verify HSN summary
      if (data.data.hsn && data.data.hsn.data) {
        log(`\n  HSN Summary: ${data.data.hsn.data.length} HSN codes`, 'green');
      }
      
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    if (error.response?.data) {
      log(`   Details: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return false;
  }
}

async function testGetGSTR1() {
  log('\n📄 Test 2: Get Generated GSTR-1', 'blue');
  try {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const response = await api.get(`/api/gstr1/${year}/${month}`);

    if (response.status === 200) {
      log('✅ GSTR-1 retrieved successfully', 'green');
      log(`   Return ID: ${response.data.data.id}`, 'green');
      log(`   Filing Period: ${response.data.data.filingPeriod}`, 'green');
      log(`   Status: ${response.data.data.status}`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testExportGSTR1JSON() {
  log('\n📄 Test 3: Export GSTR-1 as JSON', 'blue');
  try {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const response = await api.get(`/api/gstr1/${year}/${month}/export/json`, {
      responseType: 'text'
    });

    if (response.status === 200) {
      log('✅ GSTR-1 JSON exported successfully', 'green');
      
      // Verify JSON is valid
      const jsonData = JSON.parse(response.data);
      log(`   GSTIN: ${jsonData.gstin}`, 'green');
      log(`   Filing Period: ${jsonData.fp}`, 'green');
      log(`   Gross Turnover: ₹${jsonData.gt}`, 'green');
      log(`   JSON Size: ${(response.data.length / 1024).toFixed(2)} KB`, 'green');
      
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// ============================================
// GSTR-3B TESTS
// ============================================

async function testGenerateGSTR3B() {
  log('\n📊 Test 4: Generate GSTR-3B (Summary Return)', 'blue');
  try {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const response = await api.post('/api/gstr3b/generate', {
      month,
      year
    });

    if (response.status === 200) {
      log('✅ GSTR-3B generated successfully', 'green');
      const { data } = response.data;
      
      log(`\n  Return ID: ${data.returnId}`, 'green');
      log(`  Filing Period: ${data.filingPeriod}`, 'green');
      log(`  Status: ${data.status}`, 'green');
      
      log('\n  Summary:', 'magenta');
      log(`    Output Tax (Sales): ₹${data.summary.outputTax}`, 'green');
      log(`    ITC Available (Purchases): ₹${data.summary.itcAvailable}`, 'green');
      log(`    Net Tax Payable: ₹${data.summary.netTaxPayable}`, data.summary.netTaxPayable > 0 ? 'yellow' : 'green');
      log(`    Late Fees: ₹${data.summary.lateFees}`, 'green');
      log(`    Total Payable: ₹${data.summary.totalPayable}`, data.summary.totalPayable > 0 ? 'yellow' : 'green');
      
      // Verify structure
      log('\n  Outward Supplies (Table 3.1):', 'magenta');
      const osup = data.data.sup_details.osup_det;
      log(`    Taxable Value: ₹${osup.txval}`, 'green');
      log(`    CGST: ₹${osup.camt}`, 'green');
      log(`    SGST: ₹${osup.samt}`, 'green');
      log(`    IGST: ₹${osup.iamt}`, 'green');
      
      log('\n  ITC Details (Table 4):', 'magenta');
      const itc = data.data.itc_elg.itc_avl;
      const totalITC = itc.reduce((sum, item) => 
        sum + (item.iamt || 0) + (item.camt || 0) + (item.samt || 0), 0
      );
      log(`    Total ITC: ₹${totalITC}`, 'green');
      
      log('\n  Tax Payable (Table 6.1):', 'magenta');
      log(`    CGST: ₹${data.data.tax_payable.cgst}`, 'green');
      log(`    SGST: ₹${data.data.tax_payable.sgst}`, 'green');
      log(`    IGST: ₹${data.data.tax_payable.igst}`, 'green');
      log(`    Total: ₹${data.data.tax_payable.total}`, data.data.tax_payable.total > 0 ? 'yellow' : 'green');
      
      // Key Business Insight
      if (data.summary.netTaxPayable > 0) {
        log(`\n  💰 You need to pay ₹${data.summary.netTaxPayable} to the government`, 'yellow');
      } else if (data.summary.netTaxPayable < 0) {
        log(`\n  💰 You are eligible for refund of ₹${Math.abs(data.summary.netTaxPayable)}`, 'green');
      } else {
        log(`\n  💰 No tax payable (Output Tax = ITC)`, 'green');
      }
      
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    if (error.response?.data) {
      log(`   Details: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return false;
  }
}

async function testGetGSTR3B() {
  log('\n📊 Test 5: Get Generated GSTR-3B', 'blue');
  try {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const response = await api.get(`/api/gstr3b/${year}/${month}`);

    if (response.status === 200) {
      log('✅ GSTR-3B retrieved successfully', 'green');
      log(`   Return ID: ${response.data.data.id}`, 'green');
      log(`   Filing Period: ${response.data.data.filingPeriod}`, 'green');
      log(`   Net Tax Payable: ₹${response.data.data.netTaxPayable}`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testExportGSTR3BJSON() {
  log('\n📊 Test 6: Export GSTR-3B as JSON', 'blue');
  try {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const response = await api.get(`/api/gstr3b/${year}/${month}/export/json`, {
      responseType: 'text'
    });

    if (response.status === 200) {
      log('✅ GSTR-3B JSON exported successfully', 'green');
      
      // Verify JSON is valid
      const jsonData = JSON.parse(response.data);
      log(`   GSTIN: ${jsonData.gstin}`, 'green');
      log(`   Filing Period: ${jsonData.fp}`, 'green');
      log(`   JSON Size: ${(response.data.length / 1024).toFixed(2)} KB`, 'green');
      
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
  log('  GST SaaS - GST Returns Test Suite', 'blue');
  log('  Testing GSTR-1 & GSTR-3B Generation', 'blue');
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
    { name: 'Generate GSTR-1', fn: testGenerateGSTR1 },
    { name: 'Get GSTR-1', fn: testGetGSTR1 },
    { name: 'Export GSTR-1 JSON', fn: testExportGSTR1JSON },
    { name: 'Generate GSTR-3B', fn: testGenerateGSTR3B },
    { name: 'Get GSTR-3B', fn: testGetGSTR3B },
    { name: 'Export GSTR-3B JSON', fn: testExportGSTR3BJSON }
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

  if (results.passed === results.total) {
    log('🎉 All tests passed! GST returns generation is working correctly!', 'green');
    log('\nNext steps:', 'magenta');
    log('  1. Review generated returns in the response', 'blue');
    log('  2. Download JSON files for GST Portal upload', 'blue');
    log('  3. File returns on GST Portal', 'blue');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test suite crashed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
