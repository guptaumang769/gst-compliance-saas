# GST Compliance SaaS - Technical Design Document

## Document Overview
This document provides a comprehensive technical design for building the GST Compliance SaaS platform. It covers architecture, component interactions, GST rules integration points, and detailed implementation guidelines.

---

## 🎯 System Goals

### Functional Goals:
1. **Accurate GST Calculations** - 100% accuracy in tax computation
2. **Compliant Returns** - Generate GST returns accepted by portal
3. **User-Friendly Interface** - Non-technical users can operate easily
4. **Real-time Dashboard** - Show tax liability and compliance status
5. **Automated Reminders** - Never miss filing deadlines

### Non-Functional Goals:
1. **Performance:** Page load <2 seconds, API response <500ms
2. **Scalability:** Support 10,000+ concurrent users (future)
3. **Security:** Bank-grade security for financial data
4. **Availability:** 99.9% uptime (8.76 hours downtime/year max)
5. **Data Integrity:** Zero data loss, ACID transactions

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Web Browser │  │ Mobile Web   │  │  Admin Panel │          │
│  │  (React.js)  │  │ (Responsive) │  │  (Internal)  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼─────────────────┼──────────────────┘
          │                 │                 │
          └─────────────────┴─────────────────┘
                            │
                    HTTPS/REST API
                            │
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              API Gateway (Express.js)                      │ │
│  │  Rate Limiting | Authentication | Input Validation         │ │
│  └────────────────────────┬───────────────────────────────────┘ │
│                           │                                      │
│  ┌────────────────────────┴───────────────────────────────────┐ │
│  │                   Business Logic Layer                     │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │  Auth    │  │ Invoice  │  │  GST     │  │ Reports  │  │ │
│  │  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │      GST Calculation Engine ✅ CRITICAL COMPONENT    │ │ │
│  │  │  - CGST/SGST/IGST Logic                              │ │ │
│  │  │  - GSTR-1 Generator                                  │ │ │
│  │  │  - GSTR-3B Calculator                                │ │ │
│  │  │  - HSN Summary Builder                               │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │    Redis     │  │   AWS S3     │          │
│  │  (Primary)   │  │   (Cache)    │  │  (Files)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ GST Portal   │  │  Razorpay    │  │ Email/SMS    │          │
│  │  (API)       │  │  (Payments)  │  │ (SendGrid)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Component Design

### 1. Authentication Service

**Responsibility:** Handle user registration, login, JWT token management

**File Structure:**
```
backend/src/
├── controllers/
│   └── authController.js
├── services/
│   └── authService.js
├── middleware/
│   └── authMiddleware.js
└── routes/
    └── authRoutes.js
```

**Key Functions:**

```javascript
// authService.js
class AuthService {
  async register(email, password, businessData) {
    // 1. Validate email format
    // 2. Hash password (bcrypt)
    // 3. ✅ Validate GSTIN format
    // 4. Create user record
    // 5. Create business record
    // 6. Send verification email
    // 7. Return JWT token
  }

  async login(email, password) {
    // 1. Find user by email
    // 2. Compare password hash
    // 3. Generate JWT token
    // 4. Update last_login timestamp
    // 5. Return token + user data
  }

  async verifyEmail(token) {
    // 1. Decode verification token
    // 2. Update email_verified = true
  }

  async resetPassword(email) {
    // 1. Generate reset token
    // 2. Send reset email
  }
}
```

**✅ GST Integration Point:**
- During registration, validate GSTIN format
- Optionally fetch business details from GST API

---

### 2. Invoice Service

**Responsibility:** Create, update, finalize invoices; calculate GST

**File Structure:**
```
backend/src/
├── controllers/
│   └── invoiceController.js
├── services/
│   ├── invoiceService.js
│   └── gstCalculator.js ✅ CRITICAL
├── models/
│   ├── Invoice.js
│   └── InvoiceItem.js
└── routes/
    └── invoiceRoutes.js
```

**Key Functions:**

```javascript
// invoiceService.js
class InvoiceService {
  async createInvoice(businessId, invoiceData) {
    // 1. Validate invoice data
    // 2. Check subscription limits
    // 3. Generate invoice number (if auto)
    // 4. Determine supply_type (intra-state vs inter-state) ✅
    // 5. For each line item:
    //    a. ✅ Calculate GST using gstCalculator
    //    b. Calculate totals
    // 6. Calculate invoice totals
    // 7. Save invoice (status = draft)
    // 8. Return invoice
  }

  async finalizeInvoice(invoiceId) {
    // 1. Validate invoice is complete
    // 2. ✅ Verify GST calculations
    // 3. Update status = finalized
    // 4. Generate PDF
    // 5. Upload PDF to S3
    // 6. Send invoice to customer (email)
    // 7. Log in audit_logs
    // 8. Mark as cannot edit
  }

  async getInvoices(businessId, filters) {
    // 1. Apply filters (date range, customer, status)
    // 2. Paginate results
    // 3. Return invoices
  }
}
```

**✅ GST Calculator (MOST CRITICAL COMPONENT)**

```javascript
// gstCalculator.js
class GSTCalculator {
  /**
   * Calculate GST based on supply type
   * ✅ CORE GST LOGIC
   */
  calculateGST(taxableAmount, gstRate, supplyType) {
    const result = {
      taxable_amount: taxableAmount,
      gst_rate: gstRate,
      cgst_rate: 0,
      sgst_rate: 0,
      igst_rate: 0,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
      total_tax: 0,
      total_amount: 0,
    };

    if (supplyType === 'intra_state') {
      // Same state: CGST + SGST (split equally)
      result.cgst_rate = gstRate / 2;
      result.sgst_rate = gstRate / 2;
      result.cgst_amount = this.roundOff((taxableAmount * result.cgst_rate) / 100);
      result.sgst_amount = this.roundOff((taxableAmount * result.sgst_rate) / 100);
      result.total_tax = result.cgst_amount + result.sgst_amount;
    } else if (supplyType === 'inter_state') {
      // Different state: IGST (full rate)
      result.igst_rate = gstRate;
      result.igst_amount = this.roundOff((taxableAmount * result.igst_rate) / 100);
      result.total_tax = result.igst_amount;
    }

    result.total_amount = taxableAmount + result.total_tax;
    return result;
  }

  /**
   * Determine supply type based on business and customer state
   * ✅ CRITICAL LOGIC
   */
  determineSupplyType(businessStateCode, customerStateCode) {
    if (businessStateCode === customerStateCode) {
      return 'intra_state'; // CGST + SGST
    } else {
      return 'inter_state'; // IGST
    }
  }

  /**
   * Round off to 2 decimal places (GST rounding rules)
   */
  roundOff(amount) {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Calculate invoice-level totals from line items
   */
  calculateInvoiceTotals(items) {
    const totals = {
      subtotal: 0,
      total_taxable: 0,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
      cess_amount: 0,
      total_tax: 0,
      total_amount: 0,
    };

    items.forEach(item => {
      totals.subtotal += item.gross_amount;
      totals.total_taxable += item.taxable_amount;
      totals.cgst_amount += item.cgst_amount;
      totals.sgst_amount += item.sgst_amount;
      totals.igst_amount += item.igst_amount;
      totals.cess_amount += item.cess_amount || 0;
      totals.total_tax += item.total_tax;
    });

    totals.total_amount = totals.total_taxable + totals.total_tax;

    // Round all amounts
    Object.keys(totals).forEach(key => {
      totals[key] = this.roundOff(totals[key]);
    });

    return totals;
  }
}

module.exports = new GSTCalculator();
```

**✅ Where GST Rules Are Applied:**
- `createInvoice()` → Calls `determineSupplyType()` then `calculateGST()`
- `finalizeInvoice()` → Re-validates all GST calculations
- Business state vs Customer state comparison determines CGST/SGST or IGST

---

### 3. GST Returns Service

**Responsibility:** Generate GSTR-1, GSTR-3B returns from invoices

**File Structure:**
```
backend/src/
├── controllers/
│   └── returnsController.js
├── services/
│   ├── gstr1Generator.js ✅ CRITICAL
│   ├── gstr3bGenerator.js ✅ CRITICAL
│   └── gstPortalAPI.js
└── routes/
    └── returnsRoutes.js
```

**✅ GSTR-1 Generator (CRITICAL GST COMPONENT)**

```javascript
// gstr1Generator.js
class GSTR1Generator {
  /**
   * Generate GSTR-1 return for a tax period
   * ✅ CORE GST FILING LOGIC
   */
  async generateGSTR1(businessId, taxPeriod) {
    // taxPeriod format: "2025-09" (YYYY-MM)
    
    const business = await getBusinessById(businessId);
    const invoices = await getInvoicesForPeriod(businessId, taxPeriod, 'sales');

    const gstr1 = {
      gstin: business.gstin,
      ret_period: this.formatPeriod(taxPeriod), // "092025"
      
      // Table 4: B2B Invoices (customer with GSTIN)
      b2b: this.generateB2BTable(invoices),
      
      // Table 5: B2C Large Invoices (>2.5L)
      b2cl: this.generateB2CLTable(invoices),
      
      // Table 7: B2C Small Invoices (state-wise summary)
      b2cs: this.generateB2CSTable(invoices),
      
      // Table 6: Exports
      exp: this.generateExportTable(invoices),
      
      // Table 9: Credit/Debit Notes (future)
      cdnr: [],
      cdnur: [],
      
      // Table 12: HSN Summary
      hsn: this.generateHSNSummary(invoices),
    };

    // Save to database
    await saveGSTR1Return(businessId, taxPeriod, gstr1);

    // Generate JSON file
    const jsonFile = await this.saveAsJSON(gstr1, businessId, taxPeriod);

    return { gstr1, jsonFile };
  }

  /**
   * Generate Table 4: B2B Invoices
   * ✅ GST PORTAL FORMAT
   */
  generateB2BTable(invoices) {
    const b2bInvoices = invoices.filter(inv => 
      inv.transaction_type.includes('b2b') && inv.customer_gstin
    );

    // Group by GSTIN
    const groupedByGSTIN = this.groupBy(b2bInvoices, 'customer_gstin');

    const b2b = [];

    Object.keys(groupedByGSTIN).forEach(gstin => {
      const customerInvoices = groupedByGSTIN[gstin];
      
      b2b.push({
        ctin: gstin, // Customer GSTIN
        inv: customerInvoices.map(inv => ({
          inum: inv.invoice_number,
          idt: this.formatDate(inv.invoice_date), // DD-MM-YYYY
          val: inv.total_amount,
          pos: this.getStateCode(inv.place_of_supply), // 2-digit state code
          rchrg: inv.is_reverse_charge ? 'Y' : 'N',
          inv_typ: 'R', // Regular
          itms: this.getInvoiceItems(inv.id).map(item => ({
            num: item.line_number,
            itm_det: {
              rt: item.gst_rate, // GST Rate
              txval: item.taxable_amount, // Taxable value
              iamt: item.igst_amount, // IGST amount
              camt: item.cgst_amount, // CGST amount
              samt: item.sgst_amount, // SGST amount
              csamt: item.cess_amount || 0, // Cess amount
            },
          })),
        })),
      });
    });

    return b2b;
  }

  /**
   * Generate Table 7: B2C Small (state-wise summary)
   * ✅ GST PORTAL FORMAT
   */
  generateB2CSTable(invoices) {
    const b2cSmall = invoices.filter(inv => 
      inv.transaction_type.includes('b2c') && 
      inv.total_amount <= 250000 // ₹2.5L limit
    );

    // Group by state code and GST rate
    const summary = {};

    b2cSmall.forEach(inv => {
      const stateCode = this.getStateCode(inv.place_of_supply);
      const supplyType = inv.supply_type === 'intra_state' ? 'OE' : 'IS'; // OE = Intra-state, IS = Inter-state

      // Get items
      const items = this.getInvoiceItems(inv.id);
      
      items.forEach(item => {
        const key = `${stateCode}_${item.gst_rate}_${supplyType}`;
        
        if (!summary[key]) {
          summary[key] = {
            pos: stateCode,
            rt: item.gst_rate,
            typ: supplyType,
            txval: 0,
            iamt: 0,
            camt: 0,
            samt: 0,
            csamt: 0,
          };
        }

        summary[key].txval += item.taxable_amount;
        summary[key].iamt += item.igst_amount;
        summary[key].camt += item.cgst_amount;
        summary[key].samt += item.sgst_amount;
        summary[key].csamt += item.cess_amount || 0;
      });
    });

    return Object.values(summary);
  }

  /**
   * Generate Table 12: HSN Summary
   * ✅ GST PORTAL REQUIREMENT
   */
  generateHSNSummary(invoices) {
    const hsnSummary = {};

    invoices.forEach(inv => {
      const items = this.getInvoiceItems(inv.id);
      
      items.forEach(item => {
        const hsn = item.hsn_sac_code;
        
        if (!hsnSummary[hsn]) {
          hsnSummary[hsn] = {
            num: 1,
            hsn_sc: hsn,
            desc: item.item_name,
            uqc: item.unit,
            qty: 0,
            val: 0,
            txval: 0,
            iamt: 0,
            camt: 0,
            samt: 0,
            csamt: 0,
          };
        }

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

  // Helper functions
  formatPeriod(taxPeriod) {
    // Convert "2025-09" to "092025"
    const [year, month] = taxPeriod.split('-');
    return `${month}${year}`;
  }

  formatDate(date) {
    // Convert to DD-MM-YYYY
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  groupBy(array, key) {
    return array.reduce((result, item) => {
      (result[item[key]] = result[item[key]] || []).push(item);
      return result;
    }, {});
  }
}

module.exports = new GSTR1Generator();
```

**✅ GSTR-3B Generator**

```javascript
// gstr3bGenerator.js
class GSTR3BGenerator {
  /**
   * Generate GSTR-3B (summary return with tax liability)
   * ✅ CORE GST FILING LOGIC
   */
  async generateGSTR3B(businessId, taxPeriod) {
    const business = await getBusinessById(businessId);
    const salesInvoices = await getInvoicesForPeriod(businessId, taxPeriod, 'sales');
    const purchaseInvoices = await getInvoicesForPeriod(businessId, taxPeriod, 'purchase');

    const gstr3b = {
      gstin: business.gstin,
      ret_period: this.formatPeriod(taxPeriod),
      
      // Table 3.1: Outward taxable supplies
      sup_details: this.calculateTable31(salesInvoices),
      
      // Table 3.2: Inter-state supplies to unregistered persons
      inter_sup: this.calculateTable32(salesInvoices),
      
      // Table 4: ITC Available
      itc_elg: this.calculateTable4ITC(purchaseInvoices),
      
      // Table 5: Values from GSTR-1
      inward_sup: this.calculateTable5(salesInvoices),
      
      // Table 6.1: Total tax liability
      tax_paid: this.calculateTaxLiability(salesInvoices, purchaseInvoices),
    };

    // Save to database
    await saveGSTR3BReturn(businessId, taxPeriod, gstr3b);

    return gstr3b;
  }

  /**
   * Calculate Table 3.1: Outward supplies
   * ✅ GST CALCULATION
   */
  calculateTable31(invoices) {
    let taxable = 0, igst = 0, cgst = 0, sgst = 0, cess = 0;

    invoices.forEach(inv => {
      if (!inv.is_exempted && !inv.is_nil_rated) {
        taxable += inv.taxable_amount;
        igst += inv.igst_amount;
        cgst += inv.cgst_amount;
        sgst += inv.sgst_amount;
        cess += inv.cess_amount || 0;
      }
    });

    return {
      osup_det: {
        txval: this.roundOff(taxable),
        iamt: this.roundOff(igst),
        camt: this.roundOff(cgst),
        samt: this.roundOff(sgst),
        csamt: this.roundOff(cess),
      },
      // Add other supply types (exempted, nil-rated, non-GST)
    };
  }

  /**
   * Calculate Table 4: ITC (Input Tax Credit)
   * ✅ GST ITC LOGIC
   */
  calculateTable4ITC(purchaseInvoices) {
    let itc_avl = { igst: 0, cgst: 0, sgst: 0, cess: 0 };

    purchaseInvoices.forEach(inv => {
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
          ty: 'IMPG', // Imports
          iamt: 0,
          camt: 0,
          samt: 0,
          csamt: 0,
        },
        {
          ty: 'ISRC', // Inward supplies from registered persons
          iamt: this.roundOff(itc_avl.igst),
          camt: this.roundOff(itc_avl.cgst),
          samt: this.roundOff(itc_avl.sgst),
          csamt: this.roundOff(itc_avl.cess),
        },
      ],
      itc_rev: [], // ITC reversals (manual entry)
      itc_net: itc_avl, // Net ITC available
    };
  }

  /**
   * Calculate Table 6.1: Tax liability after ITC
   * ✅ FINAL TAX PAYABLE CALCULATION
   */
  calculateTaxLiability(salesInvoices, purchaseInvoices) {
    // Tax from sales
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

    // ITC from purchases
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

    // Tax payable = Tax liability - ITC
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

  roundOff(amount) {
    return Math.round(amount * 100) / 100;
  }

  formatPeriod(taxPeriod) {
    const [year, month] = taxPeriod.split('-');
    return `${month}${year}`;
  }
}

module.exports = new GSTR3BGenerator();
```

**✅ Where GST Rules Are Integrated:**
- **GSTR-1 Generation:**
  - `generateB2BTable()` → Formats B2B invoices as per GST portal schema
  - `generateB2CSTable()` → State-wise summary for B2C small invoices
  - `generateHSNSummary()` → HSN-wise summary (mandatory)
- **GSTR-3B Generation:**
  - `calculateTable31()` → Outward supply values
  - `calculateTable4ITC()` → Input Tax Credit calculation
  - `calculateTaxLiability()` → Final tax payable after ITC

**CA Team Deliverables Needed:**
1. **GST Portal JSON Schema** (official format for GSTR-1/3B)
2. **Sample Returns** (real examples from GST portal)
3. **ITC Eligibility Rules** (what purchases qualify for ITC)
4. **Edge Cases** (exports, SEZ, reverse charge scenarios)

---

### 4. Dashboard Service

**Responsibility:** Aggregate data for dashboard display

**File Structure:**
```
backend/src/
├── controllers/
│   └── dashboardController.js
├── services/
│   └── dashboardService.js
└── routes/
    └── dashboardRoutes.js
```

**Key Functions:**

```javascript
// dashboardService.js
class DashboardService {
  async getDashboardData(businessId, currentPeriod) {
    // 1. Tax Liability (current month/quarter)
    const taxLiability = await this.getTaxLiability(businessId, currentPeriod);
    
    // 2. ITC Available
    const itcAvailable = await this.getITCAvailable(businessId, currentPeriod);
    
    // 3. Compliance Status
    const complianceStatus = await this.getComplianceStatus(businessId);
    
    // 4. Quick Stats
    const stats = await this.getQuickStats(businessId, currentPeriod);
    
    // 5. Recent Activity
    const recentInvoices = await this.getRecentInvoices(businessId, 10);
    
    return {
      taxLiability,
      itcAvailable,
      complianceStatus,
      stats,
      recentInvoices,
    };
  }

  async getTaxLiability(businessId, period) {
    // Query invoices table for current period
    const result = await db.query(`
      SELECT 
        SUM(cgst_amount) as total_cgst,
        SUM(sgst_amount) as total_sgst,
        SUM(igst_amount) as total_igst,
        SUM(cess_amount) as total_cess,
        SUM(total_tax) as total_tax
      FROM invoices
      WHERE business_id = $1
        AND invoice_type = 'sales'
        AND status = 'finalized'
        AND DATE_TRUNC('month', invoice_date) = $2
    `, [businessId, period]);
    
    return result.rows[0];
  }
}
```

---

## 🔄 Data Flow Diagrams

### Invoice Creation Flow

```
User Input (Frontend)
  ├── Customer Selection
  ├── Product/Service Selection
  ├── Quantity & Rate
  └── Discount (optional)
         │
         ▼
API Request: POST /api/invoices
         │
         ▼
Invoice Controller
  ├── Validate Input (Joi)
  ├── Check Subscription Limit
  └── Call InvoiceService.createInvoice()
         │
         ▼
Invoice Service
  ├── Determine Supply Type ✅
  │   └── Compare business.state_code vs customer.state_code
  ├── For each line item:
  │   └── Call GSTCalculator.calculateGST() ✅
  │       ├── IF intra_state → CGST + SGST
  │       └── IF inter_state → IGST
  ├── Calculate Invoice Totals
  └── Save to Database
         │
         ▼
Database
  ├── INSERT INTO invoices
  └── INSERT INTO invoice_items
         │
         ▼
Response: Invoice Object + GST Breakdown
         │
         ▼
Frontend: Display Invoice
```

---

### GSTR-1 Generation Flow

```
User Clicks "Generate GSTR-1"
  └── Select Tax Period (e.g., Sep 2025)
         │
         ▼
API Request: POST /api/returns/gstr1
         │
         ▼
Returns Controller
  └── Call GSTR1Generator.generateGSTR1()
         │
         ▼
GSTR1 Generator Service
  ├── Fetch all sales invoices for period ✅
  ├── Group invoices by transaction type:
  │   ├── B2B (with GSTIN) → Table 4
  │   ├── B2C Large (>2.5L) → Table 5
  │   ├── B2C Small → Table 7 (state summary)
  │   ├── Exports → Table 6
  │   └── HSN Summary → Table 12
  ├── Format as per GST Portal JSON Schema ✅
  ├── Validate JSON Schema
  ├── Save to gstr_returns table
  └── Generate JSON file & upload to S3
         │
         ▼
Response: JSON File URL + Summary
         │
         ▼
Frontend: Display Summary + Download JSON
         │
         ▼
User: Upload JSON to GST Portal Manually
```

---

## 🔐 Security Considerations

### 1. Authentication & Authorization
- **JWT Tokens:** 7-day expiry, refresh tokens
- **Password:** bcrypt with salt rounds = 10
- **Role-Based Access:** Owner, Accountant, Viewer (future)

### 2. Data Protection
- **Encryption at Rest:** Database encryption (AWS RDS)
- **Encryption in Transit:** HTTPS/TLS 1.3
- **Sensitive Fields:** Encrypt bank details (AES-256)

### 3. Input Validation
- **Backend:** Joi/Zod validation on all inputs
- **Frontend:** React Hook Form validation
- **SQL Injection:** Use parameterized queries (Prisma/Sequelize)
- **XSS:** Sanitize all user inputs

### 4. Rate Limiting
- **API:** 100 requests/15 min per IP
- **Auth Endpoints:** 5 login attempts/15 min

### 5. Audit Trail
- **All Changes:** Log in `audit_logs` table
- **Who/When/What:** User ID, timestamp, old data, new data

---

## 📊 Performance Optimization

### 1. Database
- **Indexes:** On frequently queried columns (invoice_date, gstin, status)
- **Query Optimization:** Use EXPLAIN ANALYZE
- **Connection Pooling:** Max 100 connections

### 2. Caching (Redis)
- **User Sessions:** Store JWT tokens
- **Dashboard Data:** Cache for 5 minutes
- **Product/Customer Lists:** Cache for 1 hour

### 3. Frontend
- **Code Splitting:** Lazy load routes
- **Image Optimization:** Compress logos
- **CDN:** Use Cloudflare for static assets

---

## 🧪 Testing Strategy

### 1. Unit Tests
- **GST Calculator:** Test all tax rates, supply types
- **GSTR-1 Generator:** Test with sample invoices
- **Invoice Service:** Test totals calculation

### 2. Integration Tests
- **API Endpoints:** Test full request-response cycle
- **Database:** Test CRUD operations

### 3. GST Compliance Tests ✅ CRITICAL
- **CA Team Validates:** Provide 50+ test scenarios
- **Compare Output:** Our GSTR-1 vs real GSTR-1
- **Edge Cases:** Exports, SEZ, reverse charge, credit notes

### 4. Load Testing
- **Tool:** Apache JMeter or Artillery
- **Target:** 1,000 concurrent users, 100ms response time

---

## 📝 Documentation Requirements

### 1. Code Documentation
- **JSDoc comments** for all functions
- **README** in each module folder

### 2. API Documentation
- **Swagger/OpenAPI** spec
- **Postman Collection** for testing

### 3. User Documentation (by CAs)
- **How to create invoice**
- **How to file GSTR-1**
- **GST FAQ**

---

## ✅ Definition of Done

For each feature:
- [ ] Code written and reviewed
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests passing
- [ ] CA team validated (for GST features)
- [ ] API documented
- [ ] No linter errors
- [ ] Deployed to staging
- [ ] User acceptance testing (UAT) passed
- [ ] Deployed to production

---

**Document Version:** 1.0  
**Last Updated:** January 24, 2026  
**Owner:** Software Engineer (Technical Lead)  
**Reviewers:** Data Engineer, CA Team
