/**
 * Authentication API Test Script
 * Week 2: Authentication Module
 * 
 * Tests:
 * 1. User Registration with GSTIN validation
 * 2. Login
 * 3. Get Profile (protected route)
 * 4. Change Password
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let authToken = '';
let userId = '';

// Test data
const testUser = {
  email: `test-${Date.now()}@gstcompliance.com`,
  password: 'SecurePassword123',
  businessName: 'Test Business Pvt Ltd',
  gstin: '27AAPFU0939F1ZV', // Valid Maharashtra GSTIN
  pan: 'AAPFU0939F',
  state: 'Maharashtra',
  address: '123 Test Street, Mumbai',
  phone: '9876543210'
};

/**
 * Test 1: Register new user
 */
async function testRegister() {
  console.log('\n📝 TEST 1: User Registration');
  console.log('=====================================');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    
    console.log('✅ Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    authToken = response.data.token;
    userId = response.data.user.id;
    
    console.log('\n🔑 Auth Token:', authToken.substring(0, 50) + '...');
    console.log('👤 User ID:', userId);
    
    return true;
  } catch (error) {
    console.error('❌ Registration failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

/**
 * Test 2: Invalid GSTIN registration (should fail)
 */
async function testInvalidGSTIN() {
  console.log('\n📝 TEST 2: Invalid GSTIN Registration (Should Fail)');
  console.log('=====================================');
  
  try {
    const invalidUser = {
      ...testUser,
      email: `invalid-${Date.now()}@test.com`,
      gstin: 'INVALID_GSTIN_123'
    };
    
    await axios.post(`${BASE_URL}/api/auth/register`, invalidUser);
    
    console.log('❌ Test failed: Invalid GSTIN was accepted');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Correctly rejected invalid GSTIN');
      console.log('Error message:', error.response.data.error);
      return true;
    }
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

/**
 * Test 3: Login
 */
async function testLogin() {
  console.log('\n📝 TEST 3: User Login');
  console.log('=====================================');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    authToken = response.data.token;
    
    console.log('\n🔑 New Auth Token:', authToken.substring(0, 50) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ Login failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

/**
 * Test 4: Get Profile (Protected Route)
 */
async function testGetProfile() {
  console.log('\n📝 TEST 4: Get User Profile (Protected Route)');
  console.log('=====================================');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Profile fetched successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Get profile failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

/**
 * Test 5: Access protected route without token (should fail)
 */
async function testUnauthorizedAccess() {
  console.log('\n📝 TEST 5: Unauthorized Access (Should Fail)');
  console.log('=====================================');
  
  try {
    await axios.get(`${BASE_URL}/api/auth/me`);
    
    console.log('❌ Test failed: Accessed protected route without token');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Correctly blocked unauthorized access');
      console.log('Error message:', error.response.data.error);
      return true;
    }
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

/**
 * Test 6: Change Password
 */
async function testChangePassword() {
  console.log('\n📝 TEST 6: Change Password');
  console.log('=====================================');
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/auth/change-password`,
      {
        oldPassword: testUser.password,
        newPassword: 'NewSecurePassword456'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    console.log('✅ Password changed successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Update test password for future tests
    testUser.password = 'NewSecurePassword456';
    
    return true;
  } catch (error) {
    console.error('❌ Change password failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

/**
 * Test 7: Login with new password
 */
async function testLoginWithNewPassword() {
  console.log('\n📝 TEST 7: Login with New Password');
  console.log('=====================================');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log('✅ Login with new password successful!');
    console.log('Token received:', response.data.token.substring(0, 50) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ Login with new password failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n🚀 ========================================');
  console.log('   GST Compliance SaaS - Authentication Tests');
  console.log('   Week 2: Authentication Module');
  console.log('========================================== 🚀');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  // Test 1: Register
  results.total++;
  if (await testRegister()) {
    results.passed++;
  } else {
    results.failed++;
    console.error('\n❌ Registration failed. Stopping tests.');
    printSummary(results);
    return;
  }
  
  // Test 2: Invalid GSTIN
  results.total++;
  if (await testInvalidGSTIN()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 3: Login
  results.total++;
  if (await testLogin()) {
    results.passed++;
  } else {
    results.failed++;
    console.error('\n❌ Login failed. Stopping tests.');
    printSummary(results);
    return;
  }
  
  // Test 4: Get Profile
  results.total++;
  if (await testGetProfile()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 5: Unauthorized Access
  results.total++;
  if (await testUnauthorizedAccess()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 6: Change Password
  results.total++;
  if (await testChangePassword()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 7: Login with new password
  results.total++;
  if (await testLoginWithNewPassword()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Print summary
  printSummary(results);
}

/**
 * Print test summary
 */
function printSummary(results) {
  console.log('\n\n📊 ========================================');
  console.log('   TEST SUMMARY');
  console.log('==========================================');
  console.log(`Total Tests:  ${results.total}`);
  console.log(`✅ Passed:    ${results.passed}`);
  console.log(`❌ Failed:    ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('========================================== 📊\n');
  
  if (results.failed === 0) {
    console.log('🎉 All tests passed! Authentication module is working perfectly!');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run tests
runAllTests().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
