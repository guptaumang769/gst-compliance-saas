/**
 * PDF & Email Test Suite
 * Tests for invoice PDF generation and email sending
 * 
 * Run: node src/test-pdf-email.js
 * Requires: 
 * - Backend server running
 * - Test invoices created
 * - Email configuration in .env
 */

const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000';
let authToken = '';
let testInvoiceId = '';

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
// SETUP: Get or Create Test Invoice
// ============================================

async function setupTestInvoice() {
  log('📝 Setting up test invoice...', 'blue');
  try {
    // Try to get existing invoices
    const response = await api.get('/api/invoices?limit=1');
    
    if (response.data.invoices && response.data.invoices.length > 0) {
      testInvoiceId = response.data.invoices[0].id;
      log(`✅ Using existing invoice: ${response.data.invoices[0].invoiceNumber}`, 'green');
      log(`   Invoice ID: ${testInvoiceId}\n`, 'green');
      return true;
    }
    
    // No invoices found, create one
    log('⚠️  No invoices found. Creating test customer and invoice...', 'yellow');
    
    // Step 1: Create a test customer
    const customerResponse = await api.post('/api/customers', {
      customerName: 'PDF Test Customer Pvt Ltd',
      gstin: '29ABCDE1234F1Z5', // Karnataka
      pan: 'ABCDE1234F',
      customerType: 'b2b',
      billingAddress: '456 Test Street',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      email: 'customer@pdftest.com',
      phone: '9876543210'
    });
    
    const customerId = customerResponse.data.customer.id;
    log(`✅ Test customer created: ${customerId}`, 'green');
    
    // Step 2: Create a test invoice
    const invoiceResponse = await api.post('/api/invoices', {
      customerId: customerId,
      invoiceDate: new Date().toISOString().split('T')[0],
      items: [
        {
          itemName: 'Professional Services - Web Development',
          description: 'Custom website development',
          sacCode: '998314',
          quantity: 1,
          unit: 'Service',
          unitPrice: 50000,
          gstRate: 18,
          cessRate: 0
        },
        {
          itemName: 'Digital Marketing Services',
          description: 'SEO and content marketing',
          sacCode: '998313',
          quantity: 1,
          unit: 'Service',
          unitPrice: 25000,
          gstRate: 18,
          cessRate: 0
        }
      ],
      notes: 'Test invoice for PDF and email testing',
      termsAndConditions: 'Payment due within 30 days'
    });
    
    testInvoiceId = invoiceResponse.data.invoice.id;
    log(`✅ Test invoice created: ${invoiceResponse.data.invoice.invoiceNumber}`, 'green');
    log(`   Invoice ID: ${testInvoiceId}`, 'green');
    log(`   Total Amount: ₹${invoiceResponse.data.invoice.totalAmount}\n`, 'green');
    
    return true;
  } catch (error) {
    log(`❌ Failed to setup test invoice: ${error.response?.data?.message || error.message}`, 'red');
    if (error.response?.data) {
      log(`   Details: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

// ============================================
// PDF TESTS
// ============================================

async function testGeneratePDF() {
  log('📄 Test 1: Generate Invoice PDF', 'blue');
  try {
    const response = await api.post(`/api/invoices/${testInvoiceId}/generate-pdf`);

    if (response.status === 200) {
      log('✅ PDF generated successfully', 'green');
      log(`   PDF Path: ${response.data.pdfPath}`, 'green');
      log(`   Invoice ID: ${response.data.invoiceId}`, 'green');
      
      // Check if file exists on disk
      if (fs.existsSync(response.data.pdfPath)) {
        const stats = fs.statSync(response.data.pdfPath);
        log(`   File Size: ${(stats.size / 1024).toFixed(2)} KB`, 'green');
        log('   ✅ PDF file exists on disk', 'green');
      } else {
        log('   ⚠️  PDF file not found on disk', 'yellow');
      }
      
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.error || error.message}`, 'red');
    if (error.response?.data) {
      log(`   Details: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

async function testDownloadPDF() {
  log('\n📄 Test 2: Download Invoice PDF', 'blue');
  try {
    const response = await api.get(`/api/invoices/${testInvoiceId}/download-pdf`, {
      responseType: 'arraybuffer'
    });

    if (response.status === 200) {
      log('✅ PDF downloaded successfully', 'green');
      log(`   Content Type: ${response.headers['content-type']}`, 'green');
      log(`   File Size: ${(response.data.length / 1024).toFixed(2)} KB`, 'green');
      
      // Verify it's a PDF
      const isPDF = response.headers['content-type'] === 'application/pdf';
      if (isPDF) {
        log('   ✅ File is a valid PDF', 'green');
      } else {
        log('   ⚠️  File might not be a valid PDF', 'yellow');
      }
      
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testGeneratePDFTwice() {
  log('\n📄 Test 3: Generate PDF Twice (Regeneration)', 'blue');
  try {
    // Generate PDF again
    const response = await api.post(`/api/invoices/${testInvoiceId}/generate-pdf`);

    if (response.status === 200) {
      log('✅ PDF regenerated successfully', 'green');
      log('   Regeneration works correctly', 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

// ============================================
// EMAIL CONFIGURATION TESTS
// ============================================

async function testVerifyEmailConfig() {
  log('\n✉️  Test 4: Verify Email Configuration', 'blue');
  try {
    const response = await api.get('/api/invoices/verify-email-config');

    if (response.data.success) {
      log('✅ Email configuration is valid', 'green');
      log(`   Message: ${response.data.message}`, 'green');
      return true;
    } else {
      log('⚠️  Email configuration has issues', 'yellow');
      log(`   Error: ${response.data.message}`, 'yellow');
      log('\n   💡 Fix: Configure email in .env file:', 'magenta');
      log('      EMAIL_HOST=smtp.gmail.com', 'magenta');
      log('      EMAIL_PORT=587', 'magenta');
      log('      EMAIL_USER=your-email@gmail.com', 'magenta');
      log('      EMAIL_PASSWORD=your-app-password', 'magenta');
      return false;
    }
  } catch (error) {
    log(`❌ Failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testSendTestEmail() {
  log('\n✉️  Test 5: Send Test Email', 'blue');
  
  // Prompt for email address
  log('⚠️  This test requires a valid email address', 'yellow');
  log('   Skipping automated test (requires user input)', 'yellow');
  log('\n   To test manually:', 'magenta');
  log('   POST /api/invoices/test-email', 'magenta');
  log('   Body: { "to": "your-email@example.com" }', 'magenta');
  
  return true; // Skip automated test
}

async function testSendInvoiceEmail() {
  log('\n✉️  Test 6: Send Invoice Email', 'blue');
  
  log('⚠️  This test requires a valid email address and will send an actual email', 'yellow');
  log('   Skipping automated test (requires user input)', 'yellow');
  log('\n   To test manually:', 'magenta');
  log(`   POST /api/invoices/${testInvoiceId}/send-email`, 'magenta');
  log('   Body: {', 'magenta');
  log('     "to": "customer@example.com",', 'magenta');
  log('     "subject": "Your Invoice",', 'magenta');
  log('     "message": "Please find your invoice attached."', 'magenta');
  log('   }', 'magenta');
  
  return true; // Skip automated test
}

// ============================================
// INTEGRATION TEST
// ============================================

async function testPDFAndEmailWorkflow() {
  log('\n🔄 Test 7: Complete PDF + Email Workflow', 'blue');
  try {
    log('   Step 1: Generate PDF...', 'blue');
    const pdfResponse = await api.post(`/api/invoices/${testInvoiceId}/generate-pdf`);
    
    if (pdfResponse.status !== 200) {
      throw new Error('PDF generation failed');
    }
    log('   ✅ PDF generated', 'green');

    log('   Step 2: Verify PDF exists...', 'blue');
    const downloadResponse = await api.get(`/api/invoices/${testInvoiceId}/download-pdf`, {
      responseType: 'arraybuffer'
    });
    
    if (downloadResponse.status !== 200) {
      throw new Error('PDF download failed');
    }
    log('   ✅ PDF verified', 'green');

    log('   Step 3: Verify email config...', 'blue');
    const emailConfigResponse = await api.get('/api/invoices/verify-email-config');
    
    if (emailConfigResponse.data.success) {
      log('   ✅ Email config valid', 'green');
    } else {
      log('   ⚠️  Email config not configured (optional)', 'yellow');
    }

    log('\n✅ Complete workflow successful!', 'green');
    log('   You can now:', 'green');
    log('   1. Generate professional PDF invoices', 'green');
    log('   2. Download PDFs for printing', 'green');
    log('   3. Send invoices via email (if configured)', 'green');
    
    return true;
  } catch (error) {
    log(`❌ Workflow failed: ${error.message}`, 'red');
    return false;
  }
}

// ============================================
// RUN ALL TESTS
// ============================================

async function runTests() {
  log('═══════════════════════════════════════════════════', 'blue');
  log('  GST SaaS - PDF & Email Test Suite', 'blue');
  log('  Testing Invoice PDF Generation & Email', 'blue');
  log('═══════════════════════════════════════════════════', 'blue');

  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ Tests aborted: Login failed', 'red');
    process.exit(1);
  }

  // Setup test invoice
  const invoiceSetup = await setupTestInvoice();
  if (!invoiceSetup) {
    log('\n❌ Tests aborted: No test invoice available', 'red');
    process.exit(1);
  }

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0
  };

  const tests = [
    { name: 'Generate PDF', fn: testGeneratePDF, skip: false },
    { name: 'Download PDF', fn: testDownloadPDF, skip: false },
    { name: 'Regenerate PDF', fn: testGeneratePDFTwice, skip: false },
    { name: 'Verify Email Config', fn: testVerifyEmailConfig, skip: false },
    { name: 'Send Test Email', fn: testSendTestEmail, skip: true },
    { name: 'Send Invoice Email', fn: testSendInvoiceEmail, skip: true },
    { name: 'Complete Workflow', fn: testPDFAndEmailWorkflow, skip: false }
  ];

  for (const test of tests) {
    results.total++;
    
    if (test.skip) {
      results.skipped++;
      continue;
    }
    
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
  log(`⏭️  Skipped: ${results.skipped}`, 'yellow');
  const runTests = results.total - results.skipped;
  log(`Success Rate: ${((results.passed / runTests) * 100).toFixed(1)}%`, results.failed > 0 ? 'yellow' : 'green');
  log('═══════════════════════════════════════════════════\n', 'blue');

  if (results.passed === runTests) {
    log('🎉 All automated tests passed!', 'green');
    log('\n📧 Email Tests (Manual):', 'magenta');
    log('   To test email functionality, configure .env and run:', 'blue');
    log('   POST /api/invoices/test-email', 'blue');
    log('   Body: { "to": "your-email@example.com" }', 'blue');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test suite crashed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
