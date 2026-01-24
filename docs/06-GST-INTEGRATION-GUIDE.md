# GST Integration Guide - Where GST Rules Are Applied

## Overview
This document provides a comprehensive guide for the CA team to understand exactly where and how GST rules are integrated into the codebase. This will help validate that all GST compliance requirements are correctly implemented.

---

## 🎯 Critical GST Components

There are **3 CRITICAL components** where GST rules are heavily integrated:
1. **GST Calculator** - Tax calculation logic
2. **GSTR-1 Generator** - Return generation for outward supplies
3. **GSTR-3B Generator** - Summary return with tax liability

---

## 1️⃣ GST Calculator (`backend/src/services/gstCalculator.js`)

### Purpose:
Calculate GST (CGST/SGST or IGST) based on supply type and tax rate.

### GST Rules Applied:

#### Rule 1: Supply Type Determination
**GST Law Reference:** CGST Act, Section 8 (Intra-State vs Inter-State Supply)

```javascript
determineSupplyType(businessStateCode, customerStateCode) {
  if (businessStateCode === customerStateCode) {
    return 'intra_state';  // Same state → CGST + SGST
  } else {
    return 'inter_state';  // Different state → IGST
  }
}
```

**When Applied:** During invoice creation, when customer is selected

**Example:**
- Business in Maharashtra (MH, code 27)
- Customer in Maharashtra → Intra-state → CGST + SGST
- Customer in Gujarat (code 24) → Inter-state → IGST

---

#### Rule 2: CGST + SGST Calculation (Intra-State Supply)
**GST Law Reference:** CGST Act & SGST Act

```javascript
calculateIntraStateGST(taxableAmount, gstRate) {
  const cgstRate = gstRate / 2;  // Split equally
  const sgstRate = gstRate / 2;  // Split equally
  
  const cgstAmount = (taxableAmount * cgstRate) / 100;
  const sgstAmount = (taxableAmount * sgstRate) / 100;
  
  return {
    cgst_rate: cgstRate,
    sgst_rate: sgstRate,
    cgst_amount: this.roundOff(cgstAmount),
    sgst_amount: this.roundOff(sgstAmount),
    total_tax: this.roundOff(cgstAmount + sgstAmount)
  };
}
```

**Example:**
- Taxable amount: ₹10,000
- GST rate: 18%
- **CGST:** 9% = ₹900
- **SGST:** 9% = ₹900
- **Total GST:** ₹1,800

---

#### Rule 3: IGST Calculation (Inter-State Supply)
**GST Law Reference:** IGST Act

```javascript
calculateInterStateGST(taxableAmount, gstRate) {
  const igstAmount = (taxableAmount * gstRate) / 100;
  
  return {
    igst_rate: gstRate,
    igst_amount: this.roundOff(igstAmount),
    total_tax: this.roundOff(igstAmount)
  };
}
```

**Example:**
- Taxable amount: ₹10,000
- GST rate: 18%
- **IGST:** 18% = ₹1,800
- **Total GST:** ₹1,800

---

#### Rule 4: GST Rounding
**GST Law Reference:** GST rounding is to 2 decimal places

```javascript
roundOff(amount) {
  return Math.round(amount * 100) / 100;
}
```

**Example:**
- Amount: 899.9999 → Rounded to ₹900.00
- Amount: 899.4444 → Rounded to ₹899.44

---

### CA Validation Required:

**Test Scenarios Needed:**
1. ✅ Intra-state supply with 18% GST (CGST 9% + SGST 9%)
2. ✅ Inter-state supply with 18% GST (IGST 18%)
3. ✅ All GST rates: 0%, 5%, 12%, 18%, 28%
4. ✅ Rounding edge cases (e.g., ₹999.9951 should round to ₹1000.00)
5. ✅ Discounts (GST on discounted amount)
6. ✅ Cess calculation (for products like tobacco)

**Validation Method:**
```javascript
// CA Team should provide expected output for each scenario
// Example test case:
test('Intra-state 18% GST on ₹10,000', () => {
  const result = gstCalculator.calculateGST(10000, 18, 'intra_state');
  expect(result.cgst_amount).toBe(900);
  expect(result.sgst_amount).toBe(900);
  expect(result.total_tax).toBe(1800);
  expect(result.total_amount).toBe(11800);
});
```

---

## 2️⃣ GSTR-1 Generator (`backend/src/services/gstr1Generator.js`)

### Purpose:
Generate GSTR-1 return from sales invoices in the format required by GST portal.

### GST Rules Applied:

#### Rule 1: Invoice Classification
**GST Law Reference:** GSTR-1 return structure

```javascript
// Classify each invoice into GSTR-1 tables
classifyInvoice(invoice) {
  // Table 4: B2B Invoices (buyer with GSTIN)
  if (invoice.customer_gstin && invoice.transaction_type.includes('b2b')) {
    return 'B2B';  // Goes to Table 4
  }
  
  // Table 5: B2C Large (invoice value > ₹2.5 lakh, no GSTIN)
  if (!invoice.customer_gstin && invoice.total_amount > 250000) {
    return 'B2CL';  // Goes to Table 5
  }
  
  // Table 7: B2C Small (invoice value ≤ ₹2.5 lakh, no GSTIN)
  if (!invoice.customer_gstin && invoice.total_amount <= 250000) {
    return 'B2CS';  // Goes to Table 7 (state-wise summary)
  }
  
  // Table 6: Exports
  if (invoice.is_export) {
    return 'EXPORT';  // Goes to Table 6
  }
}
```

**Example:**
- Invoice #1: Customer GSTIN = 27ABCDE1234F1Z5, Amount = ₹50,000 → **B2B (Table 4)**
- Invoice #2: No GSTIN, Amount = ₹3,00,000 → **B2CL (Table 5)**
- Invoice #3: No GSTIN, Amount = ₹10,000 → **B2CS (Table 7)**

---

#### Rule 2: B2B Table Generation (Table 4)
**GST Law Reference:** GSTR-1 Table 4A, 4B, 4C

```javascript
generateB2BTable(invoices) {
  const b2bInvoices = invoices.filter(inv => 
    inv.transaction_type.includes('b2b') && inv.customer_gstin
  );
  
  // Group by customer GSTIN
  const groupedByGSTIN = this.groupBy(b2bInvoices, 'customer_gstin');
  
  const b2b = [];
  
  Object.keys(groupedByGSTIN).forEach(gstin => {
    const customerInvoices = groupedByGSTIN[gstin];
    
    b2b.push({
      ctin: gstin,  // Customer GSTIN
      inv: customerInvoices.map(inv => ({
        inum: inv.invoice_number,        // Invoice number
        idt: this.formatDate(inv.invoice_date),  // DD-MM-YYYY
        val: inv.total_amount,           // Invoice value
        pos: this.getStateCode(inv.place_of_supply),  // 2-digit state code
        rchrg: inv.is_reverse_charge ? 'Y' : 'N',  // Reverse charge
        inv_typ: 'R',  // Regular invoice
        itms: this.getInvoiceItems(inv.id).map(item => ({
          num: item.line_number,
          itm_det: {
            rt: item.gst_rate,          // GST rate
            txval: item.taxable_amount,  // Taxable value
            iamt: item.igst_amount,      // IGST
            camt: item.cgst_amount,      // CGST
            samt: item.sgst_amount,      // SGST
            csamt: item.cess_amount || 0,  // Cess
          },
        })),
      })),
    });
  });
  
  return b2b;
}
```

**JSON Output Example:**
```json
{
  "b2b": [
    {
      "ctin": "27ABCDE1234F1Z5",
      "inv": [
        {
          "inum": "INV-001",
          "idt": "15-09-2025",
          "val": 11800,
          "pos": "27",
          "rchrg": "N",
          "inv_typ": "R",
          "itms": [
            {
              "num": 1,
              "itm_det": {
                "rt": 18,
                "txval": 10000,
                "iamt": 0,
                "camt": 900,
                "samt": 900,
                "csamt": 0
              }
            }
          ]
        }
      ]
    }
  ]
}
```

---

#### Rule 3: B2C Small Table Generation (Table 7 - State-wise Summary)
**GST Law Reference:** GSTR-1 Table 7

```javascript
generateB2CSTable(invoices) {
  const b2cSmall = invoices.filter(inv => 
    inv.transaction_type.includes('b2c') && 
    inv.total_amount <= 250000
  );
  
  // Aggregate by state code and GST rate
  const summary = {};
  
  b2cSmall.forEach(inv => {
    const stateCode = this.getStateCode(inv.place_of_supply);
    const supplyType = inv.supply_type === 'intra_state' ? 'OE' : 'IS';
    
    const items = this.getInvoiceItems(inv.id);
    
    items.forEach(item => {
      const key = `${stateCode}_${item.gst_rate}_${supplyType}`;
      
      if (!summary[key]) {
        summary[key] = {
          pos: stateCode,       // Place of supply (state code)
          rt: item.gst_rate,    // GST rate
          typ: supplyType,      // OE = Intra-state, IS = Inter-state
          txval: 0,
          iamt: 0,
          camt: 0,
          samt: 0,
          csamt: 0,
        };
      }
      
      // Aggregate amounts
      summary[key].txval += item.taxable_amount;
      summary[key].iamt += item.igst_amount;
      summary[key].camt += item.cgst_amount;
      summary[key].samt += item.sgst_amount;
      summary[key].csamt += item.cess_amount || 0;
    });
  });
  
  return Object.values(summary);
}
```

**JSON Output Example:**
```json
{
  "b2cs": [
    {
      "pos": "27",
      "rt": 18,
      "typ": "OE",
      "txval": 150000,
      "iamt": 0,
      "camt": 13500,
      "samt": 13500,
      "csamt": 0
    }
  ]
}
```

**Important:** B2C Small invoices are NOT listed individually. They are aggregated by state and GST rate.

---

#### Rule 4: HSN Summary Generation (Table 12)
**GST Law Reference:** GSTR-1 Table 12 (Mandatory for all taxpayers)

```javascript
generateHSNSummary(invoices) {
  const hsnSummary = {};
  
  invoices.forEach(inv => {
    const items = this.getInvoiceItems(inv.id);
    
    items.forEach(item => {
      const hsn = item.hsn_sac_code;
      
      if (!hsnSummary[hsn]) {
        hsnSummary[hsn] = {
          num: 1,                    // Serial number (auto-increment)
          hsn_sc: hsn,               // HSN/SAC code
          desc: item.item_name,      // Description
          uqc: item.unit,            // Unit of measurement
          qty: 0,                    // Total quantity
          val: 0,                    // Total value (before tax)
          txval: 0,                  // Taxable value
          iamt: 0,                   // IGST amount
          camt: 0,                   // CGST amount
          samt: 0,                   // SGST amount
          csamt: 0,                  // Cess amount
        };
      }
      
      // Aggregate quantities and amounts
      hsnSummary[hsn].qty += item.quantity;
      hsnSummary[hsn].val += item.gross_amount;
      hsnSummary[hsn].txval += item.taxable_amount;
      hsnSummary[hsn].iamt += item.igst_amount;
      hsnSummary[hsn].camt += item.cgst_amount;
      hsnSummary[hsn].samt += item.sgst_amount;
      hsnSummary[hsn].csamt += item.cess_amount || 0;
    });
  });
  
  return Object.values(hsnSummary);
}
```

**JSON Output Example:**
```json
{
  "hsn": [
    {
      "num": 1,
      "hsn_sc": "8471",
      "desc": "Laptop Computer",
      "uqc": "PCS",
      "qty": 10,
      "val": 500000,
      "txval": 500000,
      "iamt": 0,
      "camt": 45000,
      "samt": 45000,
      "csamt": 0
    }
  ]
}
```

---

### CA Validation Required:

**Test Scenarios:**
1. ✅ 50 B2B invoices (different states) → Verify Table 4 is correct
2. ✅ 20 B2C Large invoices → Verify Table 5 is correct
3. ✅ 100 B2C Small invoices → Verify Table 7 aggregation is correct
4. ✅ 10 Export invoices → Verify Table 6 is correct
5. ✅ HSN Summary → Verify totals match invoice totals
6. ✅ **Upload generated JSON to GST portal (sandbox/test environment)** → Must be accepted

**Validation Checklist:**
- [ ] Invoice classification is correct (B2B vs B2C vs Export)
- [ ] State codes are correct (2 digits)
- [ ] Date format is DD-MM-YYYY
- [ ] HSN codes are present and valid
- [ ] Amounts match with invoices
- [ ] JSON schema is valid (use GST portal validator)

---

## 3️⃣ GSTR-3B Generator (`backend/src/services/gstr3bGenerator.js`)

### Purpose:
Generate GSTR-3B summary return showing tax liability and Input Tax Credit (ITC).

### GST Rules Applied:

#### Rule 1: Calculate Tax Liability (Table 3.1)
**GST Law Reference:** GSTR-3B Table 3.1 (Outward taxable supplies)

```javascript
calculateTable31(salesInvoices) {
  let taxable = 0, igst = 0, cgst = 0, sgst = 0, cess = 0;
  
  salesInvoices.forEach(inv => {
    // Only include taxable supplies (exclude exempted, nil-rated)
    if (!inv.is_exempted && !inv.is_nil_rated) {
      taxable += inv.taxable_amount;
      igst += inv.igst_amount;
      cgst += inv.cgst_amount;
      sgst += inv.sgst_amount;
      cess += inv.cess_amount || 0;
    }
  });
  
  return {
    osup_det: {  // Outward supply details
      txval: this.roundOff(taxable),
      iamt: this.roundOff(igst),
      camt: this.roundOff(cgst),
      samt: this.roundOff(sgst),
      csamt: this.roundOff(cess),
    },
  };
}
```

**Example:**
- Total sales: ₹10,00,000 (taxable value)
- IGST collected: ₹50,000
- CGST collected: ₹40,000
- SGST collected: ₹40,000
- **Total tax liability:** ₹1,30,000

---

#### Rule 2: Calculate Input Tax Credit (Table 4)
**GST Law Reference:** GSTR-3B Table 4 (ITC Available)

```javascript
calculateTable4ITC(purchaseInvoices) {
  let itc_avl = { igst: 0, cgst: 0, sgst: 0, cess: 0 };
  
  purchaseInvoices.forEach(inv => {
    // Only include ITC-eligible purchases
    if (inv.is_itc_eligible) {
      itc_avl.igst += inv.igst_amount;
      itc_avl.cgst += inv.cgst_amount;
      itc_avl.sgst += inv.sgst_amount;
      itc_avl.cess += inv.cess_amount || 0;
    }
  });
  
  return {
    itc_avl: [
      {
        ty: 'ISRC',  // Inward supplies from registered persons
        iamt: this.roundOff(itc_avl.igst),
        camt: this.roundOff(itc_avl.cgst),
        samt: this.roundOff(itc_avl.sgst),
        csamt: this.roundOff(itc_avl.cess),
      },
    ],
    itc_rev: [],  // ITC reversals (manual entry)
    itc_net: itc_avl,  // Net ITC = ITC Available - ITC Reversals
  };
}
```

**ITC Eligibility Rules (CA Input Needed):**
1. ✅ Purchase from registered supplier (GSTIN present)
2. ✅ Invoice is recorded in books
3. ✅ Tax has been paid to government by supplier (verified via GSTR-2A/2B)
4. ❌ Blocked ITC items:
   - Motor vehicles (unless for business use)
   - Food, beverages (unless for resale)
   - Works contract services (for construction of immovable property)
   - (CA team to provide complete list)

**Example:**
- Total purchases: ₹5,00,000 (taxable value)
- IGST paid: ₹30,000
- CGST paid: ₹20,000
- SGST paid: ₹20,000
- **Total ITC available:** ₹70,000

---

#### Rule 3: Calculate Net Tax Payable (Table 6.1)
**GST Law Reference:** GSTR-3B Table 6.1

```javascript
calculateTaxLiability(salesInvoices, purchaseInvoices) {
  // Step 1: Calculate tax from sales
  const taxLiability = {
    igst: 0,
    cgst: 0,
    sgst: 0,
    cess: 0,
  };
  
  salesInvoices.forEach(inv => {
    taxLiability.igst += inv.igst_amount;
    taxLiability.cgst += inv.cgst_amount;
    taxLiability.sgst += inv.sgst_amount;
    taxLiability.cess += inv.cess_amount || 0;
  });
  
  // Step 2: Calculate ITC from purchases
  const itc = {
    igst: 0,
    cgst: 0,
    sgst: 0,
    cess: 0,
  };
  
  purchaseInvoices.forEach(inv => {
    if (inv.is_itc_eligible) {
      itc.igst += inv.igst_amount;
      itc.cgst += inv.cgst_amount;
      itc.sgst += inv.sgst_amount;
      itc.cess += inv.cess_amount || 0;
    }
  });
  
  // Step 3: Net tax payable = Tax Liability - ITC
  const taxPayable = {
    igst: Math.max(0, taxLiability.igst - itc.igst),
    cgst: Math.max(0, taxLiability.cgst - itc.cgst),
    sgst: Math.max(0, taxLiability.sgst - itc.sgst),
    cess: Math.max(0, taxLiability.cess - itc.cess),
  };
  
  return {
    tax_pay: {
      iamt: this.roundOff(taxPayable.igst),
      camt: this.roundOff(taxPayable.cgst),
      samt: this.roundOff(taxPayable.sgst),
      csamt: this.roundOff(taxPayable.cess),
    },
  };
}
```

**Example Calculation:**
```
Tax from Sales:
- IGST: ₹50,000
- CGST: ₹40,000
- SGST: ₹40,000
Total: ₹1,30,000

ITC from Purchases:
- IGST: ₹30,000
- CGST: ₹20,000
- SGST: ₹20,000
Total: ₹70,000

Net Tax Payable:
- IGST: ₹50,000 - ₹30,000 = ₹20,000
- CGST: ₹40,000 - ₹20,000 = ₹20,000
- SGST: ₹40,000 - ₹20,000 = ₹20,000
Total: ₹60,000 (to be paid to government)
```

---

### CA Validation Required:

**Test Scenarios:**
1. ✅ Calculate tax liability from 100 sales invoices
2. ✅ Calculate ITC from 50 purchase invoices
3. ✅ Verify net tax payable matches manual calculation
4. ✅ Test ITC eligibility rules (blocked items)
5. ✅ **Manually file GSTR-3B** and compare with system-generated values

**Validation Checklist:**
- [ ] Table 3.1 values match with GSTR-1 summary
- [ ] ITC calculation is correct (only eligible items)
- [ ] Net tax payable is accurate
- [ ] Interest and late fee (manual entry) is working
- [ ] JSON schema is valid

---

## 🔍 Other GST Integration Points

### 4. GSTIN Validation (`backend/src/utils/gstValidation.js`)

```javascript
validateGSTIN(gstin) {
  // Format: 22AAAAA0000A1Z5
  // 2 digits state code + 10 digits PAN + 1 digit entity + 1 letter 'Z' + 1 checksum
  
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (!gstinRegex.test(gstin)) {
    return { valid: false, message: 'Invalid GSTIN format' };
  }
  
  // Checksum validation (Luhn algorithm variant)
  const checksumDigit = gstin[14];
  const calculatedChecksum = this.calculateGSTINChecksum(gstin.substring(0, 14));
  
  if (checksumDigit !== calculatedChecksum) {
    return { valid: false, message: 'Invalid GSTIN checksum' };
  }
  
  return { valid: true };
}
```

**Applied In:**
- User registration
- Business setup
- Customer creation

---

### 5. HSN/SAC Code Validation (`backend/src/utils/hsnValidation.js`)

```javascript
validateHSN(code) {
  // HSN code: 4-8 digits
  // SAC code: 6 digits (for services)
  
  const hsnRegex = /^[0-9]{4,8}$/;
  const sacRegex = /^[0-9]{6}$/;
  
  if (hsnRegex.test(code) || sacRegex.test(code)) {
    // Check if code exists in master data
    const exists = await checkHSNInMasterData(code);
    return { valid: exists, message: exists ? 'Valid' : 'HSN code not found' };
  }
  
  return { valid: false, message: 'Invalid HSN/SAC format' };
}
```

**Applied In:**
- Product creation
- Invoice line items

---

## ✅ CA Team Deliverables Required

### Before Coding Starts:
1. **GST Calculation Rules Document**
   - Excel sheet with all scenarios
   - Expected outputs for each scenario

2. **ITC Eligibility Rules**
   - List of blocked ITC items
   - Eligibility conditions

3. **Sample Invoices**
   - 20 real-world invoice samples
   - Covering all transaction types

4. **GST Portal JSON Schema**
   - Official GSTR-1 JSON schema
   - Official GSTR-3B JSON schema
   - Sample JSON files (valid)

### During Development:
1. **Test Case Validation**
   - Run all 50+ test scenarios
   - Sign off on GST Calculator (Week 5)
   - Sign off on GSTR-1 Generator (Week 12)
   - Sign off on GSTR-3B Generator (Week 14)

2. **Edge Case Testing**
   - Exports (with/without payment of tax)
   - SEZ supplies
   - Reverse charge transactions
   - Credit notes / Debit notes
   - Amendments

3. **Beta Testing**
   - Create 100+ invoices using the system
   - File actual GSTR-1 using generated JSON
   - File actual GSTR-3B using generated JSON
   - Report any discrepancies

---

## 🚨 Critical Checkpoints

### ❌ DO NOT PROCEED TO NEXT PHASE WITHOUT:
1. **Week 5:** GST Calculator validated by CA team (100% accuracy)
2. **Week 12:** GSTR-1 JSON uploaded to GST portal successfully (no errors)
3. **Week 14:** GSTR-3B calculation matches manual calculation

### ⚠️ Common GST Errors to Watch For:
1. **Rounding errors** (must round to 2 decimals)
2. **Invoice misclassification** (B2B vs B2C threshold)
3. **State code errors** (wrong place of supply)
4. **HSN missing or invalid**
5. **ITC claimed on ineligible items**
6. **Date format** (GST portal requires DD-MM-YYYY)

---

## 📞 CA Support During Development

### Weekly Review (Every Saturday):
- CA team reviews code changes related to GST
- Test new features with sample data
- Validate calculations

### GST Query Resolution:
- Engineers can ask GST-related questions in dedicated Slack channel
- CA team responds within 24 hours
- Critical issues: Immediate call

---

## 📚 Reference Documents

### For CA Team:
1. CGST Act, 2017
2. IGST Act, 2017
3. GSTR-1 Instruction Manual (GST Portal)
4. GSTR-3B Instruction Manual (GST Portal)
5. HSN Code List (GST Portal)

### For Engineers:
1. [01-MVP-FEATURES.md](01-MVP-FEATURES.md) - What to build
2. [04-DESIGN-DOCUMENT.md](04-DESIGN-DOCUMENT.md) - Technical design
3. [05-PHASE-PLAN.md](05-PHASE-PLAN.md) - When to build

---

**Document Version:** 1.0  
**Last Updated:** January 24, 2026  
**Owner:** Software Engineer + CA Team  
**Status:** Ready for Implementation
