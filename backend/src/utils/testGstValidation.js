/**
 * Test GST Validation Utilities
 * Run: node src/utils/testGstValidation.js
 */

const {
  validateGSTIN,
  validatePAN,
  extractStateCode,
  extractPAN,
  getStateName,
  validateHSNSAC,
  validateGSTRate
} = require('./gstValidation');

console.log('🧪 Testing GST Validation Utilities\n');
console.log('═══════════════════════════════════════\n');

// Test 1: Valid GSTIN
console.log('📊 Test 1: Valid GSTIN');
const validGSTIN = '27AABCT1332L1ZM';
const result1 = validateGSTIN(validGSTIN);
console.log(`GSTIN: ${validGSTIN}`);
console.log(`Valid: ${result1.valid}`);
console.log(`Message: ${result1.message}`);
if (result1.details) {
  console.log('Details:', JSON.stringify(result1.details, null, 2));
}
console.log('');

// Test 2: Invalid GSTIN (wrong length)
console.log('📊 Test 2: Invalid GSTIN (wrong length)');
const invalidGSTIN1 = '27AABCT1332L1Z';
const result2 = validateGSTIN(invalidGSTIN1);
console.log(`GSTIN: ${invalidGSTIN1}`);
console.log(`Valid: ${result2.valid}`);
console.log(`Message: ${result2.message}`);
console.log('');

// Test 3: Invalid GSTIN (wrong format)
console.log('📊 Test 3: Invalid GSTIN (wrong format)');
const invalidGSTIN2 = '2XAABCT1332L1ZM';
const result3 = validateGSTIN(invalidGSTIN2);
console.log(`GSTIN: ${invalidGSTIN2}`);
console.log(`Valid: ${result3.valid}`);
console.log(`Message: ${result3.message}`);
console.log('');

// Test 4: Valid PAN
console.log('📊 Test 4: Valid PAN');
const validPAN = 'AABCT1332L';
const result4 = validatePAN(validPAN);
console.log(`PAN: ${validPAN}`);
console.log(`Valid: ${result4.valid}`);
console.log(`Message: ${result4.message}`);
console.log('');

// Test 5: Invalid PAN
console.log('📊 Test 5: Invalid PAN');
const invalidPAN = 'ABC123';
const result5 = validatePAN(invalidPAN);
console.log(`PAN: ${invalidPAN}`);
console.log(`Valid: ${result5.valid}`);
console.log(`Message: ${result5.message}`);
console.log('');

// Test 6: Extract State Code
console.log('📊 Test 6: Extract State Code');
const stateCode = extractStateCode('27AABCT1332L1ZM');
const stateName = getStateName(stateCode);
console.log(`GSTIN: 27AABCT1332L1ZM`);
console.log(`State Code: ${stateCode}`);
console.log(`State Name: ${stateName}`);
console.log('');

// Test 7: Extract PAN
console.log('📊 Test 7: Extract PAN from GSTIN');
const pan = extractPAN('27AABCT1332L1ZM');
console.log(`GSTIN: 27AABCT1332L1ZM`);
console.log(`Extracted PAN: ${pan}`);
console.log('');

// Test 8: Valid HSN Code
console.log('📊 Test 8: Valid HSN Code');
const validHSN = '8471';
const result8 = validateHSNSAC(validHSN, 'goods');
console.log(`HSN: ${validHSN}`);
console.log(`Valid: ${result8.valid}`);
console.log(`Message: ${result8.message}`);
console.log('');

// Test 9: Valid SAC Code
console.log('📊 Test 9: Valid SAC Code');
const validSAC = '998314';
const result9 = validateHSNSAC(validSAC, 'services');
console.log(`SAC: ${validSAC}`);
console.log(`Valid: ${result9.valid}`);
console.log(`Message: ${result9.message}`);
console.log('');

// Test 10: Invalid HSN Code
console.log('📊 Test 10: Invalid HSN Code');
const invalidHSN = '12';
const result10 = validateHSNSAC(invalidHSN, 'goods');
console.log(`HSN: ${invalidHSN}`);
console.log(`Valid: ${result10.valid}`);
console.log(`Message: ${result10.message}`);
console.log('');

// Test 11: Valid GST Rates
console.log('📊 Test 11: Valid GST Rates');
const validRates = [0, 5, 12, 18, 28];
validRates.forEach(rate => {
  const result = validateGSTRate(rate);
  console.log(`  Rate ${rate}%: ${result.valid ? '✅ Valid' : '❌ Invalid'}`);
});
console.log('');

// Test 12: Invalid GST Rate
console.log('📊 Test 12: Invalid GST Rate');
const invalidRate = 15;
const result12 = validateGSTRate(invalidRate);
console.log(`Rate: ${invalidRate}%`);
console.log(`Valid: ${result12.valid}`);
console.log(`Message: ${result12.message}`);
console.log('');

// Test 13: Multiple State Names
console.log('📊 Test 13: State Names from Codes');
const stateCodes = ['01', '07', '19', '27', '29', '33', '36'];
stateCodes.forEach(code => {
  console.log(`  ${code}: ${getStateName(code)}`);
});
console.log('');

console.log('═══════════════════════════════════════');
console.log('🎉 All GST validation tests complete!');
console.log('═══════════════════════════════════════\n');
