/**
 * GST Calculator Test Suite
 * Week 3-4: Invoice Management
 * 
 * Tests the CORE GST calculation logic
 * This is CRITICAL - all GST calculations depend on this
 */

const {
  calculateItemGST,
  calculateInvoiceGST,
  getTransactionType,
  isValidGSTRate
} = require('../../src/services/gstCalculator');

console.log('\n🧮 ==========================================');
console.log('   GST Calculator Test Suite');
console.log('   Week 3-4: Invoice Management');
console.log('========================================== 🧮\n');

let testsPassed = 0;
let testsFailed = 0;

/**
 * Test helper
 */
function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`✅ ${testName}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${testName}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
  }
}

// ============================================
// TEST 1: Intra-state transaction (CGST + SGST)
// ============================================
console.log('📝 TEST 1: Intra-state Transaction (Maharashtra → Maharashtra)');
console.log('==========================================================');
runTest('Calculate 18% GST on ₹10,000 (same state)', () => {
  const result = calculateItemGST({
    taxableAmount: 10000,
    gstRate: 18,
    sellerStateCode: '27', // Maharashtra
    buyerStateCode: '27',  // Maharashtra
    invoiceType: 'b2b'
  });
  
  // Should split into CGST (9%) + SGST (9%)
  if (result.cgstAmount !== 900) throw new Error(`Expected CGST ₹900, got ₹${result.cgstAmount}`);
  if (result.sgstAmount !== 900) throw new Error(`Expected SGST ₹900, got ₹${result.sgstAmount}`);
  if (result.igstAmount !== 0) throw new Error(`Expected IGST ₹0, got ₹${result.igstAmount}`);
  if (result.totalTaxAmount !== 1800) throw new Error(`Expected total tax ₹1800, got ₹${result.totalTaxAmount}`);
  if (result.totalAmount !== 11800) throw new Error(`Expected total ₹11800, got ₹${result.totalAmount}`);
  if (result.taxType !== 'CGST+SGST') throw new Error(`Expected tax type 'CGST+SGST', got '${result.taxType}'`);
});

console.log(`   Taxable Amount: ₹10,000`);
console.log(`   GST Rate: 18%`);
console.log(`   → CGST (9%): ₹900`);
console.log(`   → SGST (9%): ₹900`);
console.log(`   → Total Tax: ₹1,800`);
console.log(`   → Total Amount: ₹11,800\n`);

// ============================================
// TEST 2: Inter-state transaction (IGST)
// ============================================
console.log('📝 TEST 2: Inter-state Transaction (Maharashtra → Karnataka)');
console.log('==========================================================');
runTest('Calculate 18% GST on ₹10,000 (different states)', () => {
  const result = calculateItemGST({
    taxableAmount: 10000,
    gstRate: 18,
    sellerStateCode: '27', // Maharashtra
    buyerStateCode: '29',  // Karnataka
    invoiceType: 'b2b'
  });
  
  // Should be IGST (18%)
  if (result.cgstAmount !== 0) throw new Error(`Expected CGST ₹0, got ₹${result.cgstAmount}`);
  if (result.sgstAmount !== 0) throw new Error(`Expected SGST ₹0, got ₹${result.sgstAmount}`);
  if (result.igstAmount !== 1800) throw new Error(`Expected IGST ₹1800, got ₹${result.igstAmount}`);
  if (result.totalTaxAmount !== 1800) throw new Error(`Expected total tax ₹1800, got ₹${result.totalTaxAmount}`);
  if (result.taxType !== 'IGST') throw new Error(`Expected tax type 'IGST', got '${result.taxType}'`);
});

console.log(`   Taxable Amount: ₹10,000`);
console.log(`   GST Rate: 18%`);
console.log(`   → IGST (18%): ₹1,800`);
console.log(`   → Total Tax: ₹1,800`);
console.log(`   → Total Amount: ₹11,800\n`);

// ============================================
// TEST 3: Different GST rates
// ============================================
console.log('📝 TEST 3: Different GST Rates');
console.log('================================');

runTest('Calculate 5% GST on ₹1,000 (intra-state)', () => {
  const result = calculateItemGST({
    taxableAmount: 1000,
    gstRate: 5,
    sellerStateCode: '27',
    buyerStateCode: '27',
    invoiceType: 'b2b'
  });
  
  if (result.cgstAmount !== 25) throw new Error(`Expected CGST ₹25, got ₹${result.cgstAmount}`);
  if (result.sgstAmount !== 25) throw new Error(`Expected SGST ₹25, got ₹${result.sgstAmount}`);
  if (result.totalTaxAmount !== 50) throw new Error(`Expected total tax ₹50, got ₹${result.totalTaxAmount}`);
});

runTest('Calculate 0.25% GST on ₹1,00,000 (intra-state - Diamonds)', () => {
  const result = calculateItemGST({
    taxableAmount: 100000,
    gstRate: 0.25,
    sellerStateCode: '27',
    buyerStateCode: '27',
    invoiceType: 'b2b'
  });
  
  if (result.totalTaxAmount !== 250) throw new Error(`Expected total tax ₹250, got ₹${result.totalTaxAmount}`);
});

runTest('Calculate 3% GST on ₹1,000 (intra-state - Gold)', () => {
  const result = calculateItemGST({
    taxableAmount: 1000,
    gstRate: 3,
    sellerStateCode: '27',
    buyerStateCode: '27',
    invoiceType: 'b2b'
  });
  
  if (result.totalTaxAmount !== 30) throw new Error(`Expected total tax ₹30, got ₹${result.totalTaxAmount}`);
});

runTest('Calculate 40% GST on ₹1,000 (intra-state - Luxury/Sin)', () => {
  const result = calculateItemGST({
    taxableAmount: 1000,
    gstRate: 40,
    sellerStateCode: '27',
    buyerStateCode: '27',
    invoiceType: 'b2b'
  });
  
  if (result.totalTaxAmount !== 400) throw new Error(`Expected total tax ₹400, got ₹${result.totalTaxAmount}`);
});

console.log(`   ✓ 0.25% GST: ₹1,00,000 → ₹250 tax - Diamonds/Precious Stones`);
console.log(`   ✓ 3% GST: ₹1,000 → ₹30 tax - Gold`);
console.log(`   ✓ 5% GST: ₹1,000 → ₹50 tax - Essentials`);
console.log(`   ✓ 40% GST: ₹1,000 → ₹400 tax - Luxury/Sin\n`);

// ============================================
// TEST 4: Export transaction (0% IGST)
// ============================================
console.log('📝 TEST 4: Export Transaction (0% GST)');
console.log('=========================================');
runTest('Export invoice should have 0% GST', () => {
  const result = calculateItemGST({
    taxableAmount: 10000,
    gstRate: 0,
    sellerStateCode: '27',
    buyerStateCode: '96', // Export
    invoiceType: 'export'
  });
  
  if (result.cgstAmount !== 0) throw new Error(`Expected CGST ₹0, got ₹${result.cgstAmount}`);
  if (result.sgstAmount !== 0) throw new Error(`Expected SGST ₹0, got ₹${result.sgstAmount}`);
  if (result.igstAmount !== 0) throw new Error(`Expected IGST ₹0, got ₹${result.igstAmount}`);
  if (result.totalTaxAmount !== 0) throw new Error(`Expected total tax ₹0, got ₹${result.totalTaxAmount}`);
  if (result.totalAmount !== 10000) throw new Error(`Expected total ₹10000, got ₹${result.totalAmount}`);
});

console.log(`   Taxable Amount: ₹10,000`);
console.log(`   GST Rate: 0% (Export)`);
console.log(`   → Total Tax: ₹0`);
console.log(`   → Total Amount: ₹10,000\n`);

// ============================================
// TEST 5: Multi-item invoice calculation
// ============================================
console.log('📝 TEST 5: Multi-item Invoice (Intra-state)');
console.log('==============================================');
runTest('Calculate GST for invoice with multiple items', () => {
  const items = [
    {
      itemName: 'Laptop',
      quantity: 2,
      unitPrice: 50000,
      gstRate: 18
    },
    {
      itemName: 'Mouse',
      quantity: 5,
      unitPrice: 500,
      gstRate: 18
    },
    {
      itemName: 'Keyboard',
      quantity: 3,
      unitPrice: 1500,
      gstRate: 18
    }
  ];
  
  const result = calculateInvoiceGST({
    items,
    sellerStateCode: '27',
    buyerStateCode: '27',
    invoiceType: 'b2b',
    discountAmount: 0
  });
  
  // Subtotal: (2*50000) + (5*500) + (3*1500) = 100000 + 2500 + 4500 = 107000
  if (result.subtotal !== 107000) throw new Error(`Expected subtotal ₹107000, got ₹${result.subtotal}`);
  
  // Tax: 107000 * 18% = 19260 (CGST 9630 + SGST 9630)
  if (result.totalTaxAmount !== 19260) throw new Error(`Expected tax ₹19260, got ₹${result.totalTaxAmount}`);
  if (result.cgstAmount !== 9630) throw new Error(`Expected CGST ₹9630, got ₹${result.cgstAmount}`);
  if (result.sgstAmount !== 9630) throw new Error(`Expected SGST ₹9630, got ₹${result.sgstAmount}`);
  
  // Total: 107000 + 19260 = 126260
  if (result.totalAmount !== 126260) throw new Error(`Expected total ₹126260, got ₹${result.totalAmount}`);
});

console.log(`   Item 1: 2 × Laptop @ ₹50,000 = ₹1,00,000`);
console.log(`   Item 2: 5 × Mouse @ ₹500 = ₹2,500`);
console.log(`   Item 3: 3 × Keyboard @ ₹1,500 = ₹4,500`);
console.log(`   Subtotal: ₹1,07,000`);
console.log(`   GST @ 18%: ₹19,260 (CGST ₹9,630 + SGST ₹9,630)`);
console.log(`   Total: ₹1,26,260\n`);

// ============================================
// TEST 6: Transaction type detection
// ============================================
console.log('📝 TEST 6: Transaction Type Detection');
console.log('=======================================');
runTest('Detect intra-state transaction', () => {
  const result = getTransactionType('27', '27');
  if (result.type !== 'intra-state') throw new Error(`Expected 'intra-state', got '${result.type}'`);
  if (result.taxType !== 'CGST+SGST') throw new Error(`Expected 'CGST+SGST', got '${result.taxType}'`);
  if (!result.isIntraState) throw new Error('Expected isIntraState to be true');
});

runTest('Detect inter-state transaction', () => {
  const result = getTransactionType('27', '29');
  if (result.type !== 'inter-state') throw new Error(`Expected 'inter-state', got '${result.type}'`);
  if (result.taxType !== 'IGST') throw new Error(`Expected 'IGST', got '${result.taxType}'`);
  if (!result.isInterState) throw new Error('Expected isInterState to be true');
});

console.log(`   ✓ Same state (27 → 27): Intra-state (CGST+SGST)`);
console.log(`   ✓ Different states (27 → 29): Inter-state (IGST)\n`);

// ============================================
// TEST 7: GST rate validation
// ============================================
console.log('📝 TEST 7: GST Rate Validation');
console.log('================================');
runTest('Valid GST rates (2026 structure)', () => {
  if (!isValidGSTRate(0)) throw new Error('0% should be valid');
  if (!isValidGSTRate(0.25)) throw new Error('0.25% should be valid');
  if (!isValidGSTRate(3)) throw new Error('3% should be valid');
  if (!isValidGSTRate(5)) throw new Error('5% should be valid');
  if (!isValidGSTRate(18)) throw new Error('18% should be valid');
  if (!isValidGSTRate(40)) throw new Error('40% should be valid');
});

runTest('Invalid GST rates (old 2025 rates)', () => {
  if (isValidGSTRate(12)) throw new Error('12% should be invalid (abolished in 2026)');
  if (isValidGSTRate(28)) throw new Error('28% should be invalid (abolished in 2026)');
  if (isValidGSTRate(10)) throw new Error('10% should be invalid');
  if (isValidGSTRate(15)) throw new Error('15% should be invalid');
});

console.log(`   ✓ Valid rates (2026): 0%, 0.25%, 3%, 5%, 18%, 40%`);
console.log(`   ✓ Invalid rates: 12%, 28% (abolished), 10%, 15% (never valid)\n`);

// ============================================
// TEST 8: With Cess
// ============================================
console.log('📝 TEST 8: GST with Cess');
console.log('==========================');
runTest('Calculate GST with cess (Luxury/Sin items)', () => {
  const result = calculateItemGST({
    taxableAmount: 10000,
    gstRate: 40, // Updated to 2026 luxury rate
    sellerStateCode: '27',
    buyerStateCode: '27',
    invoiceType: 'b2b',
    cessRate: 12 // Example: Tobacco products
  });
  
  // GST: 10000 * 40% = 4000 (CGST 2000 + SGST 2000)
  // Cess: 10000 * 12% = 1200
  // Total tax: 4000 + 1200 = 5200
  if (result.totalTaxAmount !== 5200) throw new Error(`Expected tax ₹5200, got ₹${result.totalTaxAmount}`);
  if (result.cessAmount !== 1200) throw new Error(`Expected cess ₹1200, got ₹${result.cessAmount}`);
});

console.log(`   Taxable Amount: ₹10,000`);
console.log(`   GST Rate: 40% (CGST 20% + SGST 20%) - Luxury/Sin`);
console.log(`   Cess Rate: 12% (Tobacco products)`);
console.log(`   → GST: ₹4,000`);
console.log(`   → Cess: ₹1,200`);
console.log(`   → Total Tax: ₹5,200\n`);

// ============================================
// SUMMARY
// ============================================
console.log('📊 ==========================================');
console.log('   TEST SUMMARY');
console.log('============================================');
console.log(`Total Tests:  ${testsPassed + testsFailed}`);
console.log(`✅ Passed:    ${testsPassed}`);
console.log(`❌ Failed:    ${testsFailed}`);
console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('============================================ 📊\n');

if (testsFailed === 0) {
  console.log('🎉 All GST calculator tests passed!');
  console.log('✅ Core GST calculation logic is working correctly!\n');
} else {
  console.log('⚠️  Some tests failed. Please fix the issues above.\n');
  process.exit(1);
}
