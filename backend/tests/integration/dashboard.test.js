/**
 * Dashboard Test Suite
 * Tests for dashboard metrics and analytics APIs
 * 
 * Run: node src/test-dashboard.js
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
// DASHBOARD TESTS
// ============================================

async function testGetQuickStats() {
  log('📊 Test 1: Get Quick Stats', 'blue');
  try {
    const response = await api.get('/api/dashboard/quick-stats');
    
    if (response.status === 200) {
      log('✅ Quick stats retrieved successfully', 'green');
      const { currentMonth, counts, alerts } = response.data.data;
      
      log('\n  Current Month:', 'blue');
      log(`    Revenue: ₹${currentMonth.revenue}`, 'green');
      log(`    Expenses: ₹${currentMonth.expenses}`, 'green');
      log(`    Tax Liability: ₹${currentMonth.taxLiability}`, 'green');
      log(`    ITC Available: ₹${currentMonth.itcAvailable}`, 'green');
      log(`    Net Tax Payable: ₹${currentMonth.netTaxPayable}`, 'green');
      
      log('\n  Counts:', 'blue');
      log(`    Customers: ${counts.totalCustomers}`, 'green');
      log(`    Suppliers: ${counts.totalSuppliers}`, 'green');
      log(`    Invoices: ${counts.invoicesThisMonth}`, 'green');
      log(`    Purchases: ${counts.purchasesThisMonth}`, 'green');
      
      log('\n  Alerts:', 'blue');
      log(`    Upcoming Deadlines: ${alerts.upcomingDeadlines}`, 'green');
      
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetDashboardOverview() {
  log('\n📊 Test 2: Get Dashboard Overview (Current Month)', 'blue');
  try {
    const currentDate = new Date();
    const response = await api.get('/api/dashboard/overview', {
      params: {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
      }
    });
    
    if (response.status === 200) {
      log('✅ Dashboard overview retrieved successfully', 'green');
      const { period, sales, purchases, tax } = response.data.data;
      
      log(`\n  Period: ${period.monthName} ${period.year}`, 'blue');
      
      log('\n  Sales:', 'blue');
      log(`    Total Revenue: ₹${sales.totalRevenue}`, 'green');
      log(`    Taxable Amount: ₹${sales.taxableAmount}`, 'green');
      log(`    Total Tax: ₹${sales.totalTax}`, 'green');
      log(`      CGST: ₹${sales.cgst}`, 'green');
      log(`      SGST: ₹${sales.sgst}`, 'green');
      log(`      IGST: ₹${sales.igst}`, 'green');
      log(`    Invoice Count: ${sales.invoiceCount}`, 'green');
      
      log('\n  Purchases:', 'blue');
      log(`    Total Expenditure: ₹${purchases.totalExpenditure}`, 'green');
      log(`    Total ITC: ₹${purchases.totalItc}`, 'green');
      log(`      CGST: ₹${purchases.cgst}`, 'green');
      log(`      SGST: ₹${purchases.sgst}`, 'green');
      log(`      IGST: ₹${purchases.igst}`, 'green');
      log(`    Purchase Count: ${purchases.purchaseCount}`, 'green');
      
      log('\n  Tax Summary:', 'blue');
      log(`    Output Tax (Sales): ₹${tax.outputTax}`, 'green');
      log(`    Input Tax Credit: ₹${tax.inputTaxCredit}`, 'green');
      log(`    Net Tax Payable: ₹${tax.netTaxPayable}`, tax.netTaxPayable > 0 ? 'yellow' : 'green');
      if (tax.refundDue > 0) {
        log(`    Refund Due: ₹${tax.refundDue}`, 'green');
      }
      
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetTopCustomers() {
  log('\n📊 Test 3: Get Top Customers', 'blue');
  try {
    const response = await api.get('/api/dashboard/top-customers', {
      params: { limit: 5 }
    });
    
    if (response.status === 200) {
      log('✅ Top customers retrieved successfully', 'green');
      log(`   Found: ${response.data.data.length} customers\n`, 'green');
      
      response.data.data.forEach((item, index) => {
        log(`   ${index + 1}. ${item.customer.customerName}`, 'blue');
        log(`      Revenue: ₹${item.totalRevenue}`, 'green');
        log(`      Tax: ₹${item.totalTax}`, 'green');
        log(`      Invoices: ${item.invoiceCount}`, 'green');
      });
      
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetTopSuppliers() {
  log('\n📊 Test 4: Get Top Suppliers', 'blue');
  try {
    const response = await api.get('/api/dashboard/top-suppliers', {
      params: { limit: 5 }
    });
    
    if (response.status === 200) {
      log('✅ Top suppliers retrieved successfully', 'green');
      log(`   Found: ${response.data.data.length} suppliers\n`, 'green');
      
      response.data.data.forEach((item, index) => {
        log(`   ${index + 1}. ${item.supplier.supplierName}`, 'blue');
        log(`      Expenditure: ₹${item.totalExpenditure}`, 'green');
        log(`      ITC: ₹${item.totalItc}`, 'green');
        log(`      Purchases: ${item.purchaseCount}`, 'green');
      });
      
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetRevenueTrend() {
  log('\n📊 Test 5: Get Revenue Trend (Last 6 Months)', 'blue');
  try {
    const response = await api.get('/api/dashboard/revenue-trend');
    
    if (response.status === 200) {
      log('✅ Revenue trend retrieved successfully', 'green');
      log(`   Data points: ${response.data.data.length}\n`, 'green');
      
      response.data.data.forEach((item) => {
        log(`   ${item.monthName} ${item.year}: ₹${item.revenue} (Tax: ₹${item.tax})`, 'green');
      });
      
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetGstDeadlines() {
  log('\n📊 Test 6: Get GST Filing Deadlines', 'blue');
  try {
    const response = await api.get('/api/dashboard/deadlines');
    
    if (response.status === 200) {
      log('✅ GST deadlines retrieved successfully', 'green');
      log(`   Upcoming deadlines: ${response.data.data.length}\n`, 'green');
      
      response.data.data.forEach((deadline) => {
        const priorityColor = deadline.priority === 'high' ? 'red' : 
                             deadline.priority === 'medium' ? 'yellow' : 'green';
        log(`   ${deadline.returnType}`, 'blue');
        log(`     For Period: ${deadline.forPeriod}`, 'green');
        log(`     Due Date: ${deadline.dueDate}`, priorityColor);
        log(`     Days Remaining: ${deadline.daysRemaining}`, priorityColor);
        log(`     Priority: ${deadline.priority.toUpperCase()}`, priorityColor);
        if (deadline.isOverdue) {
          log(`     ⚠️  OVERDUE!`, 'red');
        }
      });
      
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetOverviewPreviousMonth() {
  log('\n📊 Test 7: Get Overview for Previous Month', 'blue');
  try {
    const currentDate = new Date();
    const prevMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
    const prevYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    
    const response = await api.get('/api/dashboard/overview', {
      params: {
        month: prevMonth,
        year: prevYear
      }
    });
    
    if (response.status === 200) {
      log('✅ Previous month overview retrieved successfully', 'green');
      const { period, tax } = response.data.data;
      log(`   Period: ${period.monthName} ${period.year}`, 'green');
      log(`   Net Tax Payable: ₹${tax.netTaxPayable}`, 'green');
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
  log('  GST SaaS - Dashboard Test Suite', 'blue');
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
    { name: 'Quick Stats', fn: testGetQuickStats },
    { name: 'Dashboard Overview', fn: testGetDashboardOverview },
    { name: 'Top Customers', fn: testGetTopCustomers },
    { name: 'Top Suppliers', fn: testGetTopSuppliers },
    { name: 'Revenue Trend', fn: testGetRevenueTrend },
    { name: 'GST Deadlines', fn: testGetGstDeadlines },
    { name: 'Previous Month Overview', fn: testGetOverviewPreviousMonth }
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
