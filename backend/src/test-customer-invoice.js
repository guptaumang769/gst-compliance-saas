/**
 * Customer & Invoice API Test Suite
 * Week 3-4: Invoice Management
 * 
 * Tests:
 * 1. Customer CRUD operations
 * 2. Invoice creation with GST calculation
 * 3. Invoice operations
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let authToken = '';
let customerId = '';
let invoiceId = '';

// Login credentials (use a test account)
const testUser = {
  email: 'test@gstcompliance.com',
  password: 'SecurePassword123'
};

/**
 * Login first to get auth token
 */
async function login() {
  console.log('\n🔐 Logging in...');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, testUser);
    authToken = response.data.token;
    console.log('✅ Login successful\n');
    return true;
  } catch (error) {
    console.error('❌ Login failed. Please ensure you have a test account registered.');
    console.error('Run: node src/test-auth.js first to create a test account\n');
    return false;
  }
}

/**
 * TEST 1: Create Customer (B2B with GSTIN)
 */
async function testCreateCustomerB2B() {
  console.log('📝 TEST 1: Create B2B Customer with GSTIN');
  console.log('===========================================');
  
  try {
    const customer = {
      customerName: 'ABC Enterprises Pvt Ltd',
      gstin: '29AABCT3518Q1ZV', // Karnataka GSTIN
      pan: 'AABCT3518Q',
      billingAddress: '123 MG Road, Bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      email: 'contact@abc-enterprises.com',
      phone: '9876543210',
      customerType: 'b2b'
    };
    
    const response = await axios.post(`${BASE_URL}/api/customers`, customer, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ Customer created successfully!');
    console.log(`   Customer Name: ${response.data.customer.customerName}`);
    console.log(`   GSTIN: ${response.data.customer.gstin}`);
    console.log(`   State Code: ${response.data.customer.stateCode}`);
    console.log(`   Customer Type: ${response.data.customer.customerType}\n`);
    
    customerId = response.data.customer.id;
    return true;
  } catch (error) {
    console.error('❌ Failed to create customer');
    console.error(error.response?.data || error.message);
    return false;
  }
}

/**
 * TEST 2: Create Customer (B2C without GSTIN)
 */
async function testCreateCustomerB2C() {
  console.log('📝 TEST 2: Create B2C Customer (No GSTIN)');
  console.log('===========================================');
  
  try {
    const customer = {
      customerName: 'Rajesh Kumar',
      billingAddress: '456 Retail Street, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '9123456789',
      customerType: 'b2c'
    };
    
    const response = await axios.post(`${BASE_URL}/api/customers`, customer, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✅ B2C Customer created successfully!');
    console.log(`   Customer Name: ${response.data.customer.customerName}`);
    console.log(`   GSTIN: ${response.data.customer.gstin || 'N/A (B2C)'}`);
    console.log(`   Customer Type: ${response.data.customer.customerType}\n`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create B2C customer');
    console.error(error.response?.data || error.message);
    return false;
  }
}

/**
 * TEST 3: Get all customers
 */
async function testGetCustomers() {
  console.log('📝 TEST 3: Get All Customers');
  console.log('==============================');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/customers`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log(`✅ Retrieved ${response.data.customers.length} customers`);
    console.log(`   Total: ${response.data.pagination.total}`);
    console.log(`   Page: ${response.data.pagination.page}\n`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to get customers');
    console.error(error.response?.data || error.message);
    return false;
  }
}

/**
 * TEST 4: Create Invoice (Inter-state, IGST)
 */
async function testCreateInvoiceInterState() {
  console.log('📝 TEST 4: Create Inter-state Invoice (Maharashtra → Karnataka)');
  console.log('==================================================================');
  console.log('Expected: IGST (18%) on all items\n');
  
  try {
    const invoice = {
      customerId: customerId,
      invoiceDate: new Date().toISOString(),
      items: [
        {
          itemName: 'Laptop Dell Inspiron',
          description: '15.6 inch, 8GB RAM, 512GB SSD',
          hsnCode: '8471',
          quantity: 2,
          unitPrice: 45000,
          gstRate: 18
        },
        {
          itemName: 'Wireless Mouse',
          hsnCode: '8471',
          quantity: 5,
          unitPrice: 500,
          gstRate: 18
        }
      ],
      notes: 'Test invoice for inter-state transaction',
      termsAndConditions: 'Payment due within 30 days'
    };
    
    const response = await axios.post(`${BASE_URL}/api/invoices`, invoice, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const inv = response.data.invoice;
    
    console.log('✅ Invoice created successfully!');
    console.log(`   Invoice Number: ${inv.invoiceNumber}`);
    console.log(`   Invoice Type: ${inv.invoiceType}`);
    console.log(`   Subtotal: ₹${inv.subtotal}`);
    console.log(`   CGST: ₹${inv.cgstAmount}`);
    console.log(`   SGST: ₹${inv.sgstAmount}`);
    console.log(`   IGST: ₹${inv.igstAmount}`);
    console.log(`   Total Tax: ₹${inv.totalTaxAmount}`);
    console.log(`   Total Amount: ₹${inv.totalAmount}`);
    console.log(`   Tax Type: ${inv.igstAmount > 0 ? 'IGST' : 'CGST+SGST'}\n`);
    
    invoiceId = inv.id;
    
    // Verify calculations
    // Subtotal: (2 * 45000) + (5 * 500) = 90000 + 2500 = 92500
    // IGST @ 18%: 92500 * 0.18 = 16650
    // Total: 92500 + 16650 = 109150
    
    if (parseFloat(inv.subtotal) !== 92500) {
      console.error(`   ⚠️  Expected subtotal ₹92500, got ₹${inv.subtotal}`);
    }
    if (parseFloat(inv.igstAmount) !== 16650) {
      console.error(`   ⚠️  Expected IGST ₹16650, got ₹${inv.igstAmount}`);
    }
    if (parseFloat(inv.totalAmount) !== 109150) {
      console.error(`   ⚠️  Expected total ₹109150, got ₹${inv.totalAmount}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create invoice');
    console.error(error.response?.data || error.message);
    return false;
  }
}

/**
 * TEST 5: Get invoice by ID
 */
async function testGetInvoice() {
  console.log('📝 TEST 5: Get Invoice by ID');
  console.log('==============================');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/invoices/${invoiceId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const inv = response.data.invoice;
    
    console.log('✅ Invoice retrieved successfully!');
    console.log(`   Invoice Number: ${inv.invoiceNumber}`);
    console.log(`   Customer: ${inv.customer.customerName}`);
    console.log(`   Items: ${inv.items.length}`);
    console.log(`   Total: ₹${inv.totalAmount}\n`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to get invoice');
    console.error(error.response?.data || error.message);
    return false;
  }
}

/**
 * TEST 6: Get all invoices
 */
async function testGetInvoices() {
  console.log('📝 TEST 6: Get All Invoices');
  console.log('=============================');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/invoices`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log(`✅ Retrieved ${response.data.invoices.length} invoices`);
    console.log(`   Total: ${response.data.pagination.total}`);
    console.log(`   Page: ${response.data.pagination.page}\n`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to get invoices');
    console.error(error.response?.data || error.message);
    return false;
  }
}

/**
 * TEST 7: Get customer statistics
 */
async function testGetCustomerStats() {
  console.log('📝 TEST 7: Get Customer Statistics');
  console.log('=====================================');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/customers/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const stats = response.data.stats;
    
    console.log('✅ Statistics retrieved successfully!');
    console.log(`   Total Customers: ${stats.total}`);
    console.log(`   B2B: ${stats.b2b}`);
    console.log(`   B2C: ${stats.b2c}`);
    console.log(`   Export: ${stats.export}`);
    console.log(`   SEZ: ${stats.sez}\n`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to get statistics');
    console.error(error.response?.data || error.message);
    return false;
  }
}

/**
 * TEST 8: Get invoice statistics
 */
async function testGetInvoiceStats() {
  console.log('📝 TEST 8: Get Invoice Statistics');
  console.log('====================================');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/invoices/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const stats = response.data.stats;
    
    console.log('✅ Statistics retrieved successfully!');
    console.log(`   Total Invoices: ${stats.totalInvoices}`);
    console.log(`   Total Amount: ₹${stats.totalAmount}`);
    console.log(`   Total Tax: ₹${stats.totalTaxAmount}\n`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to get statistics');
    console.error(error.response?.data || error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n🚀 ==========================================');
  console.log('   Customer & Invoice API Tests');
  console.log('   Week 3-4: Invoice Management');
  console.log('========================================== 🚀');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('\n❌ Cannot proceed without authentication');
    return;
  }
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  // Customer Tests
  results.total++;
  if (await testCreateCustomerB2B()) results.passed++; else results.failed++;
  
  results.total++;
  if (await testCreateCustomerB2C()) results.passed++; else results.failed++;
  
  results.total++;
  if (await testGetCustomers()) results.passed++; else results.failed++;
  
  // Invoice Tests
  results.total++;
  if (await testCreateInvoiceInterState()) results.passed++; else results.failed++;
  
  results.total++;
  if (await testGetInvoice()) results.passed++; else results.failed++;
  
  results.total++;
  if (await testGetInvoices()) results.passed++; else results.failed++;
  
  // Statistics Tests
  results.total++;
  if (await testGetCustomerStats()) results.passed++; else results.failed++;
  
  results.total++;
  if (await testGetInvoiceStats()) results.passed++; else results.failed++;
  
  // Print summary
  console.log('\n📊 ==========================================');
  console.log('   TEST SUMMARY');
  console.log('============================================');
  console.log(`Total Tests:  ${results.total}`);
  console.log(`✅ Passed:    ${results.passed}`);
  console.log(`❌ Failed:    ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('============================================ 📊\n');
  
  if (results.failed === 0) {
    console.log('🎉 All API tests passed!');
    console.log('✅ Customer & Invoice management working correctly!\n');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.\n');
  }
}

// Run tests
runAllTests().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
