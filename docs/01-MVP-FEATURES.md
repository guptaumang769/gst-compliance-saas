# GST Compliance SaaS - MVP Feature List

## Overview
This document outlines the **Minimum Viable Product (MVP)** features for the GST Compliance SaaS platform. The MVP focuses on core GST filing capabilities with minimal but essential features to validate product-market fit.

---

## 🎯 MVP Success Criteria
- Users can create GST-compliant invoices
- System auto-calculates GST correctly for all tax rates
- Users can generate GSTR-1 and GSTR-3B returns
- Users can view their tax liability dashboard
- Users can download returns in JSON/Excel format
- Complete the above in **3-4 months** of part-time work

---

## 📋 Feature Categories

### 1. USER MANAGEMENT & AUTHENTICATION

#### 1.1 User Registration
- **Priority:** P0 (Must Have)
- **Description:** Allow businesses to sign up and create accounts
- **Features:**
  - Email-based registration
  - Email verification (OTP or link)
  - Password with strength validation
  - Basic KYC: Business name, GSTIN, PAN, address, state
  - Business type selection (Regular/Composition/SEZ)
  - Turnover category selection
- **GST Integration Point:** ✅ Validate GSTIN format (15 digits, checksum validation)
- **Acceptance Criteria:**
  - User can register with valid email
  - GSTIN validation prevents invalid registrations
  - User receives confirmation email

#### 1.2 User Login & Security
- **Priority:** P0
- **Features:**
  - Email/password login
  - JWT-based authentication
  - Password reset via email
  - Session management (auto-logout after inactivity)
  - Remember me option
- **Security Requirements:**
  - Password hashing (bcrypt)
  - HTTPS only
  - Rate limiting on login attempts

#### 1.3 User Profile Management
- **Priority:** P1
- **Features:**
  - Update business details
  - Change password
  - Update contact information
  - Add logo (for invoices)

---

### 2. BUSINESS CONFIGURATION

#### 2.1 Business Setup
- **Priority:** P0
- **Description:** Configure business-specific GST settings
- **Features:**
  - GSTIN registration
  - State of registration
  - Business address (principal place of business)
  - Bank account details (for invoices)
  - Financial year selection
  - GST filing frequency (Monthly/Quarterly)
- **GST Integration Point:** ✅ Fetch business details from GST portal using GSTIN API
- **Acceptance Criteria:**
  - Business profile is complete before creating invoices
  - System auto-detects filing frequency based on turnover

#### 2.2 Product/Service Master
- **Priority:** P0
- **Description:** Maintain catalog of products/services sold
- **Features:**
  - Add product/service with:
    - Name, description
    - HSN/SAC code (mandatory for GST)
    - Default GST rate (0%, 5%, 12%, 18%, 28%)
    - Unit of measurement
    - Default selling price (optional)
  - Edit/delete products
  - Search products
  - Bulk upload via CSV
- **GST Integration Point:** ✅ HSN/SAC code validation and auto-suggestion
- **Acceptance Criteria:**
  - User can create product with valid HSN code
  - Invalid HSN codes are flagged

#### 2.3 Customer Master
- **Priority:** P0
- **Description:** Maintain customer database
- **Features:**
  - Add customer with:
    - Business name
    - GSTIN (if registered)
    - Address with state
    - Email, phone
    - Customer type (B2B/B2C/Export)
  - Edit/delete customers
  - Search customers
  - Auto-detect if customer is in same state (for CGST/SGST vs IGST)
- **GST Integration Point:** ✅ GSTIN validation, state detection
- **Acceptance Criteria:**
  - System auto-detects intra-state vs inter-state supply
  - B2C customers don't require GSTIN

---

### 3. INVOICING (CORE MODULE)

#### 3.1 Sales Invoice Creation
- **Priority:** P0
- **Description:** Create GST-compliant sales invoices
- **Features:**
  - Invoice number (auto-generated or manual)
  - Invoice date
  - Customer selection (from master)
  - Line items:
    - Product/service selection
    - Quantity
    - Rate
    - Discount (amount or percentage)
    - GST rate
    - Taxable value
    - Tax amount (auto-calculated)
    - Total amount
  - Multiple line items
  - Invoice type selection:
    - Regular (B2B)
    - B2C
    - Export (with/without payment of tax)
    - SEZ (with/without payment of tax)
  - Place of supply (auto-detected or manual)
  - Terms & conditions
  - Notes
  - Save as draft
  - Finalize invoice (cannot edit after finalization)
- **GST Calculation Logic:** ✅ **KEY INTEGRATION POINT**
  - **Intra-state:** CGST + SGST (e.g., 9% + 9% = 18%)
  - **Inter-state:** IGST (e.g., 18%)
  - **Reverse Charge:** Mark if applicable
  - **TCS (Tax Collected at Source):** For e-commerce operators (if applicable)
- **Acceptance Criteria:**
  - Invoice auto-calculates GST correctly
  - CGST/SGST for same state, IGST for different state
  - Invoice is GST-compliant (has all mandatory fields)
  - Cannot edit finalized invoices

#### 3.2 Purchase Invoice Creation
- **Priority:** P1
- **Description:** Record purchase invoices for Input Tax Credit (ITC)
- **Features:**
  - Supplier selection/addition
  - Invoice number, date
  - Line items with HSN/SAC
  - GST amount (CGST/SGST/IGST)
  - ITC eligible (Yes/No)
  - Upload invoice PDF (optional)
  - Reverse charge applicable (Yes/No)
- **GST Integration Point:** ✅ Will be reconciled with GSTR-2A/2B from GST portal
- **Acceptance Criteria:**
  - Purchase invoices are tracked separately
  - ITC calculation is accurate

#### 3.3 Invoice Templates & Printing
- **Priority:** P1
- **Features:**
  - Professional invoice template (GST-compliant)
  - Show CGST/SGST/IGST breakdown
  - HSN/SAC codes in invoice
  - Business logo
  - Download as PDF
  - Send via email to customer
- **Acceptance Criteria:**
  - Invoice PDF is GST-compliant
  - All mandatory fields are visible

#### 3.4 Credit/Debit Notes
- **Priority:** P2 (Post-MVP, but important)
- **Description:** Issue credit/debit notes for invoice amendments
- **Features:**
  - Link to original invoice
  - Reason for credit/debit note
  - Amount adjustment
  - Reflects in GST returns

---

### 4. GST RETURNS GENERATION (CRITICAL MODULE)

#### 4.1 GSTR-1 Generation (Outward Supplies)
- **Priority:** P0
- **Description:** Auto-generate GSTR-1 return from sales invoices
- **Features:**
  - Select tax period (month/quarter)
  - Auto-populate from sales invoices:
    - **B2B invoices** (Table 4A, 4B, 4C)
    - **B2C large invoices** (>₹2.5L per invoice) (Table 5A, 5B)
    - **B2C small invoices** (state-wise summary) (Table 7)
    - **Exports** (Table 6A, 6B, 6C)
    - **Credit/Debit notes** (Table 9A, 9B, 9C)
    - **HSN-wise summary** (Table 12)
  - Review and edit before filing
  - Download JSON (for GST portal upload)
  - Download Excel summary
  - **[Future]** Direct filing to GST portal via API
- **GST Rules Integration:** ✅ **CRITICAL INTEGRATION POINT**
  - Implement all GSTR-1 table structures as per GST portal schema
  - Validate data against GST portal JSON schema
  - Handle invoice amendments and credit notes
- **Acceptance Criteria:**
  - Generated JSON is accepted by GST portal (no schema errors)
  - All invoice types are correctly classified
  - HSN summary is accurate

#### 4.2 GSTR-3B Generation (Summary Return)
- **Priority:** P0
- **Description:** Auto-generate GSTR-3B from invoices and purchases
- **Features:**
  - Select tax period
  - Auto-calculate:
    - **Table 3.1:** Outward supplies (taxable, exempted, nil-rated, non-GST)
    - **Table 3.2:** Inter-state supplies to unregistered persons
    - **Table 4:** Input Tax Credit (ITC) available
      - ITC on purchases
      - ITC reversals (if any)
      - Net ITC available
    - **Table 5:** Values from GSTR-1
    - **Table 6.1:** Total tax liability (CGST/SGST/IGST/Cess)
    - **Table 6.2:** TDS/TCS credit
    - **Table 6.3:** Tax payable after credits
    - **Table 6.4:** Interest, late fee, penalty (manual entry)
  - Allow manual adjustments (with notes)
  - Download JSON
  - Download summary PDF
  - Calculate tax payable amount
- **GST Rules Integration:** ✅ **CRITICAL INTEGRATION POINT**
  - Implement GSTR-3B calculation logic
  - ITC eligibility rules
  - Interest calculation for late filing
  - Cess calculation (if applicable)
- **Acceptance Criteria:**
  - GSTR-3B matches with GSTR-1 data
  - Tax liability is correctly calculated
  - ITC is accurately computed

#### 4.3 GSTR-2A/2B Reconciliation
- **Priority:** P2 (Post-MVP, but highly valuable)
- **Description:** Match purchase invoices with supplier's GSTR-1 filings
- **Features:**
  - Fetch GSTR-2A/2B from GST portal
  - Compare with recorded purchase invoices
  - Highlight mismatches:
    - Invoices in GSTR-2A but not in books
    - Invoices in books but not in GSTR-2A
    - Amount mismatches
  - Accept/reject ITC
- **GST Integration Point:** ✅ Fetch data from GST portal API

---

### 5. DASHBOARD & REPORTS

#### 5.1 Main Dashboard
- **Priority:** P0
- **Features:**
  - **Tax Liability Card:**
    - Current month/quarter CGST/SGST/IGST liability
    - Total tax payable
  - **ITC Card:**
    - Total ITC available
    - ITC utilized
    - ITC balance
  - **Compliance Status:**
    - Upcoming filing deadlines
    - Returns filed vs pending
  - **Quick Stats:**
    - Total invoices (current period)
    - Total sales value
    - Total purchases
  - **Recent Activity:**
    - Last 10 invoices created
    - Last returns filed
- **Acceptance Criteria:**
  - Dashboard loads in <2 seconds
  - All numbers are accurate and match with returns

#### 5.2 Invoice Reports
- **Priority:** P1
- **Features:**
  - Sales invoice register (date range filter)
  - Purchase invoice register
  - Tax rate-wise summary (5%, 12%, 18%, 28%)
  - Customer-wise sales report
  - Product-wise sales report
  - Export to Excel/CSV

#### 5.3 GST Reports
- **Priority:** P1
- **Features:**
  - GSTR-1 summary report
  - GSTR-3B summary report
  - Tax liability trend (last 6 months)
  - ITC analysis report
  - HSN-wise summary

#### 5.4 Compliance Calendar
- **Priority:** P1
- **Features:**
  - Show all GST filing deadlines
  - Mark completed filings (green)
  - Highlight pending filings (red)
  - Send email reminders 5 days before deadline

---

### 6. NOTIFICATIONS & ALERTS

#### 6.1 Email Notifications
- **Priority:** P1
- **Features:**
  - Invoice created (to customer)
  - Return ready for filing (to user)
  - Deadline reminders (5 days, 2 days, 1 day before)
  - Payment confirmation

#### 6.2 In-App Notifications
- **Priority:** P2
- **Features:**
  - Bell icon with notification count
  - Upcoming deadlines
  - New GST rule changes (manual updates by CAs)

---

### 7. SUBSCRIPTION & PAYMENTS

#### 7.1 Subscription Plans
- **Priority:** P0
- **Features:**
  - Display pricing tiers (Starter/Professional/Business)
  - Free trial (14 days)
  - Subscribe to a plan
  - View current plan and usage
  - Upgrade/downgrade plan
  - Cancel subscription

#### 7.2 Payment Integration
- **Priority:** P0
- **Features:**
  - Razorpay integration
  - Credit/Debit card payment
  - UPI payment
  - Net banking
  - Payment success/failure handling
  - Invoice for subscription payment

#### 7.3 Usage Limits
- **Priority:** P0
- **Features:**
  - Track invoice count per month
  - Restrict features based on plan:
    - Starter: 100 invoices/month
    - Professional: 500 invoices/month
    - Business: Unlimited
  - Show usage percentage
  - Prompt to upgrade when limit reached

---

### 8. SETTINGS & CONFIGURATION

#### 8.1 Account Settings
- **Priority:** P1
- **Features:**
  - Change password
  - Update email
  - Notification preferences (email on/off)

#### 8.2 Business Settings
- **Priority:** P1
- **Features:**
  - Update business details
  - Update bank details
  - Upload/change logo
  - Invoice numbering format (prefix, starting number)
  - Default payment terms

#### 8.3 Tax Settings
- **Priority:** P1
- **Features:**
  - Default GST rates for products
  - TCS applicable (Yes/No)
  - Reverse charge settings

---

## 🚫 Features NOT in MVP (Post-MVP)

### Phase 2 Features (Month 5-8):
1. **E-way Bill Generation**
2. **TDS/TCS Management**
3. **Advanced Reconciliation** (GSTR-2A/2B matching)
4. **Multi-user Access** (team members with roles)
5. **API Access** for integrations
6. **Mobile App** (Progressive Web App)

### Phase 3 Features (Month 9-12):
1. **Inventory Management**
2. **Expense Tracking**
3. **Bank Reconciliation**
4. **Accounts Payable/Receivable**
5. **Financial Reports** (P&L, Balance Sheet)
6. **E-Invoice Generation** (for businesses >₹10Cr turnover)

### Future Features:
1. **AI-powered Tax Optimization**
2. **WhatsApp Integration** (invoice sharing)
3. **Chatbot for GST Queries**
4. **Auto-filing to GST Portal** (with DSC integration)

---

## 📊 MVP Feature Priority Matrix

| Feature | Priority | Effort | Impact | Build Order |
|---------|----------|--------|--------|-------------|
| User Registration & Login | P0 | 1 week | High | Week 1 |
| Business Configuration | P0 | 3 days | High | Week 2 |
| Product/Customer Master | P0 | 4 days | High | Week 2 |
| Sales Invoice Creation | P0 | 2 weeks | Critical | Week 3-4 |
| GST Calculation Engine | P0 | 1 week | Critical | Week 5 |
| Purchase Invoice | P1 | 1 week | High | Week 6 |
| GSTR-1 Generation | P0 | 2 weeks | Critical | Week 7-8 |
| GSTR-3B Generation | P0 | 2 weeks | Critical | Week 9-10 |
| Dashboard & Reports | P0 | 1 week | High | Week 11 |
| Subscription & Payments | P0 | 1 week | Critical | Week 12 |
| Invoice Templates/PDF | P1 | 1 week | Medium | Week 13 |
| Notifications | P1 | 3 days | Medium | Week 14 |

**Total MVP Timeline:** 14-16 weeks (3.5-4 months) with 15-20 hours/week

---

## 🎨 UI/UX Requirements for MVP

### Design Principles:
1. **Simplicity:** Even non-tech users should understand it
2. **Speed:** Every page should load in <2 seconds
3. **Mobile-Friendly:** Responsive design (mobile-first)
4. **Guided Onboarding:** First-time users get a walkthrough
5. **Error Prevention:** Clear validation messages before submission

### Key Screens:
1. **Login/Registration Page**
2. **Dashboard (Home)**
3. **Invoice Creation Page** (most used screen - must be intuitive!)
4. **Invoice List Page**
5. **Return Generation Page** (GSTR-1/3B)
6. **Reports Page**
7. **Settings Page**

### Design System:
- Use a component library: **Material-UI (MUI)** or **Ant Design** for React
- Color scheme: Professional blue/green (trust, finance)
- Typography: Clean, readable fonts (Inter, Roboto)

---

## ✅ MVP Success Metrics

### Technical Metrics:
- [ ] 100% GST calculation accuracy (validated by CAs)
- [ ] Generated JSON files accepted by GST portal (0 schema errors)
- [ ] Page load time <2 seconds
- [ ] 99.5% uptime
- [ ] Zero data breaches

### Business Metrics:
- [ ] 50 beta users complete 1 full GST filing cycle
- [ ] 80% user retention after first month
- [ ] Average of 20 invoices created per user per month
- [ ] 90% positive feedback on ease of use
- [ ] 10 paying customers by end of Month 4

---

## 📝 Notes for Development

### Where GST Rules Are Integrated:

1. **GSTIN Validation** (User Registration)
   - File: `backend/utils/gstValidation.js`
   - Function: `validateGSTIN(gstin)`

2. **GST Calculation Logic** (Invoice Creation)
   - File: `backend/services/gstCalculator.js`
   - Functions:
     - `calculateGST(amount, rate, customerState, businessState)`
     - `calculateIntraStateGST()` → Returns CGST + SGST
     - `calculateInterStateGST()` → Returns IGST

3. **GSTR-1 Generation** (Returns Module)
   - File: `backend/services/gstr1Generator.js`
   - Function: `generateGSTR1(userId, period)`
   - Implementation: Map invoices to GST portal JSON schema tables

4. **GSTR-3B Generation** (Returns Module)
   - File: `backend/services/gstr3bGenerator.js`
   - Function: `generateGSTR3B(userId, period)`
   - Implementation: Calculate tax liability and ITC

5. **HSN Code Validation**
   - File: `backend/data/hsnCodes.json` (static data)
   - Function: `validateHSN(code)`

### CA Team Deliverables for Engineers:
- **GST Calculation Rules Document** (Excel/PDF with all scenarios)
- **GSTR-1/3B Field Mapping** (table structure documentation)
- **Test Cases** (50+ scenarios with expected outputs)
- **Sample JSON Files** (valid GSTR-1 and GSTR-3B files from GST portal)

---

## Next Steps

1. **Review this document** with CA team (validate all GST requirements)
2. **Finalize Tech Stack** (see architecture document)
3. **Create UI Mockups** (Figma/Sketch)
4. **Setup Development Environment** (Week 1)
5. **Start with User Auth Module** (Week 1)
6. **Weekly Demos** (show progress every Saturday)

---

**Document Version:** 1.0  
**Last Updated:** January 24, 2026  
**Owner:** Software Engineer (Full-Stack Lead)  
**Reviewers:** CA Team (for GST validation)
