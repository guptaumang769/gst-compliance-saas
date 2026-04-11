# 📋 GST Compliance SaaS – Phase Status & Development Plan

**Version:** 2.0  
**Date:** March 17, 2026  
**Project Duration So Far:** ~11 weeks  
**Tech Stack:** React.js + Express.js + PostgreSQL + Prisma ORM  
**Status:** Phase 1 MVP — Feature complete, deployment ready

---

## 📌 Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully built, tested & working |
| ⚠️ | Built but needs improvement / partial |
| 🔧 | Bug found and fixed during testing |
| ❌ | Not built yet |
| ⏭️ | Skipped during testing |
| 🧪 | Needs more testing |

---

## 🏗️ PHASE 1: MVP (Completed ~90%)

### 1. Authentication & User Management

| # | Feature | Status | Files | Notes |
|---|---------|--------|-------|-------|
| 1.1 | User Registration (email, password, business details, GSTIN, PAN, state) | ✅ | `authService.js`, `authController.js`, `authRoutes.js`, `RegisterPage.jsx` | GSTIN format validated, state code extracted, business created on register |
| 1.2 | User Login (JWT-based) | ✅ | `authService.js`, `authMiddleware.js`, `LoginPage.jsx` | JWT stored in localStorage, Axios interceptors set up |
| 1.3 | Password Change | ✅ 🔧 | `authService.js`, `SettingsPage.jsx` | Fixed: API endpoint was commented out, field name mismatch (`currentPassword` vs `oldPassword`) corrected |
| 1.4 | User Profile (read-only view) | ✅ | `ProfilePage.jsx`, `authService.js` | Separate page from Settings; shows user + business details |
| 1.5 | Session Management (auto-logout, token expiry) | ✅ | `AuthContext.jsx`, `authMiddleware.js` | 401 interceptor clears token and redirects to login |
| 1.6 | Email Verification | ✅ | `authService.js`, `emailService.js`, `VerifyEmailPage.jsx` | Verification email sent on register; token-based verification; resend option |
| 1.7 | Password Reset via Email | ✅ | `authService.js`, `emailService.js`, `ForgotPasswordPage.jsx`, `ResetPasswordPage.jsx` | Forgot password → email with reset token → new password form |

---

### 2. Business Configuration & Settings

| # | Feature | Status | Files | Notes |
|---|---------|--------|-------|-------|
| 2.1 | Business Profile Setup (name, GSTIN, PAN, address, state, phone, email) | ✅ | `authService.js`, `SettingsPage.jsx` | Auto-created during registration; editable from Settings |
| 2.2 | Business Profile Edit (name, address, phone, email) | ✅ 🔧 | `authService.js` → `updateProfile()`, `SettingsPage.jsx` | Fixed: Data wasn't populating on mount; now fetches and displays correctly |
| 2.3 | GSTIN & PAN Read-Only | ✅ | `SettingsPage.jsx` | Cannot be changed after registration (as per GST rules) |
| 2.4 | Filing Frequency Setting (monthly/quarterly) | ✅ | `SettingsPage.jsx` → Bank & Filing tab | Monthly/Quarterly dropdown in Settings, saved via `PUT /api/auth/settings` |
| 2.5 | Bank Details | ✅ | `SettingsPage.jsx` → Bank & Filing tab, `authService.js` → `updateBusinessSettings()` | Bank name, account, IFSC, branch editable in Settings |
| 2.6 | Logo Upload | ❌ | `schema.prisma` → `logoUrl` | Schema field exists but no upload functionality |
| 2.7 | Notification Settings | ✅ | `SettingsPage.jsx` | Toggle states persisted to localStorage |
| 2.8 | Invoice Numbering Format (prefix, start number) | ❌ | `invoiceNumberGenerator.js` uses auto-format | Hardcoded format `INV-YYYYMM-XXXX`; no customization UI |

---

### 3. Customer Management

| # | Feature | Status | Files | Notes |
|---|---------|--------|-------|-------|
| 3.1 | Create Customer (B2B with GSTIN, B2C without) | ✅ | `customerService.js`, `customerController.js`, `CustomersPage.jsx` | Auto-detects B2B/B2C based on GSTIN presence |
| 3.2 | Edit Customer | ✅ | Same as above | |
| 3.3 | Delete Customer (soft delete) | ✅ | Same as above | Sets `isActive = false` |
| 3.4 | Search Customers (name, GSTIN, email) | ✅ | `customerService.js` | |
| 3.5 | GSTIN Format Validation | ✅ | `gstValidation.js` → `validateGSTIN()` | 15-digit format check + checksum |
| 3.6 | PAN Format Validation | ✅ | `gstValidation.js` → `validatePAN()` | |
| 3.7 | GSTIN State Code vs Selected State Mismatch | ✅ 🔧 | `gstValidation.js` → `validateGSTINStateMatch()` | Added during testing — throws error if GSTIN state code doesn't match selected state |
| 3.8 | PAN in GSTIN vs Entered PAN Mismatch | ✅ 🔧 | `gstValidation.js` → `validateGSTINPANMatch()` | Added during testing — GSTIN characters 3-12 must match PAN |
| 3.9 | Duplicate GSTIN Check | ✅ | `customerService.js` | Prevents two customers with same GSTIN under same business |
| 3.10 | Duplicate PAN Check | ✅ 🔧 | `customerService.js` | Added during testing |
| 3.11 | Duplicate Phone Check | ✅ 🔧 | `CustomersPage.jsx` (frontend check) | Added during testing |
| 3.12 | State Code Auto-Extraction from GSTIN | ✅ | `gstValidation.js` → `extractStateCode()` | First 2 digits of GSTIN mapped to state |
| 3.13 | Pincode Validation | ✅ | `gstValidation.js` | 6-digit numeric check |
| 3.14 | Phone Validation (starts with 6-9) | ✅ | `gstValidation.js` | Indian mobile number format |

---

### 4. Supplier Management

| # | Feature | Status | Files | Notes |
|---|---------|--------|-------|-------|
| 4.1 | Create Supplier (Registered with GSTIN / Unregistered) | ✅ | `supplierService.js`, `supplierController.js`, `SuppliersPage.jsx` | Auto-detects type based on GSTIN |
| 4.2 | Edit Supplier | ✅ | Same as above | |
| 4.3 | Delete Supplier (soft delete) | ✅ | Same as above | |
| 4.4 | Search Suppliers | ✅ | `supplierService.js` | |
| 4.5 | Duplicate Phone Check | ✅ 🔧 | `SuppliersPage.jsx` (frontend check) | Added during testing |
| 4.6 | GSTIN / PAN Validation (same as customer) | ✅ | `gstValidation.js` | Reuses same validation utilities |

---

### 5. Invoice Management (Sales)

| # | Feature | Status | Files | Notes |
|---|---------|--------|-------|-------|
| 5.1 | Create Invoice (multi-line items, customer selection) | ✅ | `invoiceService.js`, `invoiceController.js`, `InvoicesPage.jsx` | |
| 5.2 | Auto GST Calculation (CGST+SGST for intra-state, IGST for inter-state) | ✅ | `gstCalculator.js` → `calculateInvoiceGST()` | Determines supply type from seller/buyer state codes |
| 5.3 | Multi-GST Rate Support (0%, 5%, 12%, 18%, 28%, 40%) | ✅ | `gstCalculator.js` | Each line item can have different GST rate |
| 5.4 | Cess Rate Support | ✅ | `gstCalculator.js` | Per-item cess calculation |
| 5.5 | Discount Support (per-item percentage) | ✅ 🔧 | `gstCalculator.js`, `invoiceService.js` | Fixed: Discount wasn't saving to DB; `gstCalculator` now sums item-level discounts correctly |
| 5.6 | Edit Invoice | ✅ 🔧 | `invoiceService.js` → `updateInvoice()` | Fixed: `PrismaClientValidationError` — `discount` field was being spread into `InvoiceItem` schema; now explicitly maps valid fields |
| 5.7 | Delete Invoice (soft delete) | ✅ | `invoiceService.js` → `deleteInvoice()` | |
| 5.8 | Invoice Number Auto-Generation | ✅ | `invoiceNumberGenerator.js` | Format: `INV-YYYYMM-XXXX` |
| 5.9 | Future Date Blocking | ✅ 🔧 | `invoiceSchema` (Yup) + `invoiceService.js` | Frontend: `max: new Date()` on date picker + Yup validation; Backend: throws error if date > today |
| 5.10 | Empty Line Items Validation | ✅ 🔧 | `InvoicesPage.jsx`, `invoiceService.js` | Fixed: Added field-level error display + toast + backend per-item validation |
| 5.11 | Search by Invoice Number & Customer Name | ✅ 🔧 | `invoiceService.js` → `getInvoices()` | Fixed: Customer name wasn't included in search query |
| 5.12 | Filter by Status (Draft, Generated, Sent, Filed) | ✅ 🔧 | `invoiceService.js`, `InvoicesPage.jsx` | Fixed: Backend now filters by `pdfGenerated`, `emailSent`, `filedInGstr1` flags |
| 5.13 | Invoice Status Lifecycle: Draft → Generated → Sent → Filed | ✅ 🔧 | `InvoicesPage.jsx` → `getInvoiceStatus()` | Derived from DB flags; "Generated" was missing from dropdown — fixed |
| 5.14 | Edit/Delete Disabled When Filed | ✅ | `InvoicesPage.jsx` | Edit and Delete buttons hidden when `filedInGstr1 = true` |
| 5.15 | Pagination | ✅ | `invoiceService.js`, `InvoicesPage.jsx` | Backend paginated queries |
| 5.16 | Invoice Type Detection (B2B, B2C Small, B2C Large) | ✅ | `invoiceService.js` | Based on customer type and amount threshold (₹2.5L) |
| 5.17 | Place of Supply Detection | ✅ | `invoiceService.js` | Auto-set from customer state |
| 5.18 | Reverse Charge Toggle | ✅ | `InvoicesPage.jsx` → FormControlLabel + Switch | RCM toggle on invoice form with warning alert |

---

### 6. Invoice PDF & Email

| # | Feature | Status | Files | Notes |
|---|---------|--------|-------|-------|
| 6.1 | PDF Generation (GST-compliant layout) | ✅ | `pdfService.js` | Uses PDFKit; includes business details, GSTIN, tax breakdown, HSN codes |
| 6.2 | PDF Auto-Generate on Download | ✅ | `invoiceController.js` → `downloadInvoicePDF()` | If PDF doesn't exist, auto-generates first |
| 6.3 | PDF Download Action | ✅ | `InvoicesPage.jsx` | Download icon; sets `pdfGenerated = true` |
| 6.4 | Send Invoice via Email | ✅ | `emailService.js`, `invoiceController.js`, `InvoicesPage.jsx` | Email icon in actions; sends PDF as attachment; requires SMTP config in `.env` |
| 6.5 | Mark as Filed in GSTR-1 | ✅ | `invoiceController.js` → `markAsFiled()`, `InvoicesPage.jsx` | Gavel icon; toggle filed/unfiled; sets `filedInGstr1` flag |
| 6.6 | Email Tracking (emailSent, emailSentTo, emailSentAt) | ✅ | `emailService.js` | Updates invoice record after successful email |

---

### 7. Purchase Management

| # | Feature | Status | Files | Notes |
|---|---------|--------|-------|-------|
| 7.1 | Create Purchase (multi-line items, supplier selection) | ✅ | `purchaseService.js`, `purchaseController.js`, `PurchasesPage.jsx` | |
| 7.2 | Auto GST Calculation | ✅ | `gstCalculator.js` | Same engine as invoices |
| 7.3 | ITC Calculation (Input Tax Credit) | ✅ | `purchaseService.js` | ITC = total tax if supplier is registered; 0 if unregistered |
| 7.4 | ITC Eligibility Flag | ✅ | `schema.prisma` → `isItcEligible`, `itcAmount` | Auto-set based on supplier type |
| 7.5 | Discount Support | ✅ 🔧 | `purchaseService.js`, `gstCalculator.js` | Fixed: Same discount issue as invoices |
| 7.6 | Edit Purchase | ✅ | `purchaseService.js` | |
| 7.7 | Delete Purchase (soft delete) | ✅ | `purchaseService.js` | |
| 7.8 | Mark as Paid/Unpaid | ✅ 🔧 | `purchaseService.js` → `markPurchaseAsPaid()`, `PurchasesPage.jsx` | Added during testing; updates `isPaid`, `paymentDate`, `paymentMethod` |
| 7.9 | Search by Supplier Name & Invoice Number | ✅ 🔧 | `purchaseService.js` → `getPurchases()` | Fixed: Added `supplier.supplierName` and `supplierInvoiceNumber` to search |
| 7.10 | Filter by Status (Pending / Paid) | ✅ 🔧 | `purchaseService.js`, `PurchasesPage.jsx` | Fixed: Now filters by `isPaid` field |
| 7.11 | Pagination | ✅ | `purchaseService.js`, `PurchasesPage.jsx` | |
| 7.12 | Reverse Charge Mechanism (RCM) | ✅ | `PurchasesPage.jsx` → RCM toggle + auto-enable for unregistered | RCM toggle with info alert about GSTR-3B reporting |

---

### 8. GST Returns

| # | Feature | Status | Files | Notes |
|---|---------|--------|-------|-------|
| 8.1 | GSTR-1 Generation | ✅ | `gstr1Service.js`, `gstr1Controller.js`, `GSTReturnsPage.jsx` | Generates from all sales invoices for selected period |
| 8.2 | GSTR-1 B2B Table (Table 4) | ✅ | `gstr1Service.js` | Groups by customer GSTIN, includes invoice-wise details |
| 8.3 | GSTR-1 B2C Large Table (Table 5) | ✅ | `gstr1Service.js` | Invoices > ₹2.5L without GSTIN |
| 8.4 | GSTR-1 B2C Small / State Summary (Table 7) | ✅ | `gstr1Service.js` | State-wise summary of B2C sales |
| 8.5 | GSTR-1 HSN Summary (Table 12) | ✅ | `gstr1Service.js` | Aggregated by HSN code |
| 8.6 | GSTR-1 JSON Download | ✅ 🔧 | `GSTReturnsPage.jsx`, `api.js` | Fixed: Download was producing empty file due to `responseType: 'blob'` |
| 8.7 | GSTR-1 View Details (structured UI) | ✅ 🔧 | `GSTReturnsPage.jsx` | Fixed: Was showing raw JSON; now shows tabbed, structured data |
| 8.8 | GSTR-3B Generation | ✅ | `gstr3bService.js`, `gstr3bController.js`, `GSTReturnsPage.jsx` | Calculates outward supplies, ITC, net tax payable |
| 8.9 | GSTR-3B Table 3.1 (Outward Supplies) | ✅ | `gstr3bService.js` | Taxable + Tax breakdown |
| 8.10 | GSTR-3B Table 4 (Eligible ITC) | ✅ | `gstr3bService.js` | ITC from purchases grouped by type |
| 8.11 | GSTR-3B Table 6.1 (Tax Payable) | ✅ | `gstr3bService.js` | Tax liability − ITC = Net payable |
| 8.12 | GSTR-3B JSON Download | ✅ | `GSTReturnsPage.jsx` | |
| 8.13 | GSTR-3B View Details (structured UI) | ✅ 🔧 | `GSTReturnsPage.jsx` | Fixed: Was showing raw JSON; now shows structured tables matching official form sections |
| 8.14 | Return Status Flow (Generated → Filed) | ✅ 🔧 | `GSTReturnsPage.jsx`, `gstr1Controller.js`, `gstr3bController.js` | Added "Mark as Filed" with ARN input; status legend |
| 8.15 | Return Period Selection (month/year) | ✅ | `GSTReturnsPage.jsx` | |
| 8.16 | Previous Month Return Generation | ✅ | `gstr1Service.js`, `gstr3bService.js` | Filters invoices/purchases by selected period |

---

### 9. Dashboard

| # | Feature | Status | Files | Notes |
|---|---------|--------|-------|-------|
| 9.1 | Revenue Overview (current month) | ✅ 🔧 | `dashboardService.js`, `DashboardPage.jsx` | Fixed: Was hardcoded to current month; added month/year selector |
| 9.2 | Total Invoices Count | ✅ | `dashboardService.js` | |
| 9.3 | Total Customers Count | ✅ | `dashboardService.js` | |
| 9.4 | GST Tax Collected (Output Tax) | ✅ 🔧 | `dashboardService.js`, `DashboardPage.jsx` | Fixed: Back-dated invoices now reflected via month selector |
| 9.5 | 6-Month Revenue Trend Chart | ✅ 🔧 | `DashboardPage.jsx` | Added: Fetches data for last 6 months for bar chart |
| 9.6 | Top Customers / Suppliers | ✅ | `dashboardService.js` | |
| 9.7 | Recent Invoices | ✅ | `dashboardService.js` | Last 5-10 invoices |
| 9.8 | ITC Available Card | ⚠️ | `dashboardService.js` | Calculates from purchases; may need separate card for visibility |
| 9.9 | Compliance Calendar / Upcoming Deadlines | ✅ | `ComplianceCalendarPage.jsx` | Monthly calendar with GSTR-1/3B/PMT-06 deadlines, color-coded |

---

### 10. Subscription & Payments

| # | Feature | Status | Files | Notes |
|---|---------|--------|-------|-------|
| 10.1 | Subscription Plans Definition (Free Trial, Starter, Professional, Enterprise) | ✅ | `subscriptionPlans.js` | Plans with limits, pricing, features defined |
| 10.2 | Usage Limit Enforcement (invoice count check) | ✅ | `invoiceController.js`, `subscriptionMiddleware.js` | Checks `invoiceCountCurrentMonth >= invoiceLimit` before creating |
| 10.3 | Subscription Status API | ✅ | `subscriptionService.js`, `subscriptionController.js` | Get current plan, usage stats, renewal info |
| 10.4 | Razorpay Order Creation | ✅ | `paymentService.js` | Backend: Creates Razorpay order, returns order ID |
| 10.5 | Razorpay Payment Verification | ✅ | `paymentService.js` | Verifies signature, captures payment |
| 10.6 | Razorpay Webhook Handler | ✅ | `webhookRoutes.js`, `paymentService.js` | Handles `payment.captured`, `payment.failed` events |
| 10.7 | Payment History | ✅ | `paymentService.js` | Records all payments in `Payment` model |
| 10.8 | **Pricing Page UI** | ❌ | — | No frontend page for plan selection or checkout |
| 10.9 | **Checkout / Payment Flow UI** | ❌ | — | No Razorpay button or payment form on frontend |
| 10.10 | **Current Plan & Usage UI** | ❌ | — | No subscription status page |
| 10.11 | Plan Upgrade/Downgrade | ⚠️ | `subscriptionService.js` | Backend logic exists; no UI |

---

### 11. Navigation & Layout

| # | Feature | Status | Files | Notes |
|---|---------|--------|-------|-------|
| 11.1 | Sidebar Navigation (Dashboard, Customers, Invoices, Suppliers, Purchases, GST Returns, Settings) | ✅ | `MainLayout.jsx` | |
| 11.2 | User Menu (Profile, Settings, Logout) | ✅ 🔧 | `MainLayout.jsx` | Fixed: Profile and Settings were both opening Settings page; now separate routes |
| 11.3 | Responsive Layout | ⚠️ | `MainLayout.jsx`, CSS | Basic responsive; not fully tested on mobile |
| 11.4 | Error Boundary | ✅ | `ErrorBoundary.jsx` | Catches React rendering errors |
| 11.5 | Toast Notifications (success, error, info) | ✅ | `errorHandler.js`, `react-toastify` | Used throughout the app |

---

## 📊 Testing Summary

### Tests Executed (UAT Plan Day 1–4)

| Day | Test Cases | Tested | Passed | Bugs Found & Fixed |
|-----|-----------|--------|--------|---------------------|
| Day 1 | 1.1–1.12 (Auth, Customers, Suppliers, Validations) | ✅ All | ✅ All | Duplicate phone/PAN checks added |
| Day 2 | 2.1–2.10 (Invoices, Purchases) | ✅ All | ✅ All | Discount save, `InvoiceItem` schema error, edit not reflecting |
| Day 3 | 3.1–3.12 (GSTR-1, GSTR-3B, Dashboard, Reports) | ✅ All | ✅ All | Empty JSON download, raw JSON detail views, dashboard month selector |
| Day 4 | 4.1–4.5, 4.7, 4.8, 4.9b-d (Settings, Edge Cases, Search/Filter) | ✅ Most | ✅ All | Profile/Settings routing, password change, search/filter on invoices & purchases, GSTIN-State mismatch, PAN-GSTIN mismatch, future date, empty items |

### Tests Skipped / Remaining

| Test Case | Status | Reason |
|-----------|--------|--------|
| 4.6 – HSN Code Validation | ✅ | HSN Autocomplete wired to InvoicesPage & PurchasesPage with 30+ common HSN/SAC codes |
| 4.9 – Reverse Charge Mechanism | ⏭️ Skipped | No UI toggle for RCM; DB field exists |
| 4.10 – Pagination (50+ records) | 🧪 Not tested | Needs bulk data |
| 4.11 – Search Performance | 🧪 Not tested | Needs bulk data |
| 4.12 – Concurrent Operations | 🧪 Not tested | Multi-tab test |
| 4.13 – Browser Compatibility | 🧪 Not tested | Chrome, Firefox, Safari, Edge |
| 4.14 – Mobile Responsiveness | 🧪 Not tested | Mobile/DevTools test |
| Day 5 – End-to-End Workflows | 🧪 Not tested | 4 complete workflow scenarios |

---

## 🔴 PHASE 1 REMAINING: Features to Complete Before Production

**Priority: Must be done before production launch**

### A. Critical (P0) — ✅ ALL COMPLETED (March 17, 2026)

| # | Feature | Status | Details |
|---|---------|--------|---------|
| A1 | **Subscription & Pricing UI** | ✅ | `PricingPage.jsx` with 4 plan cards, monthly/annual toggle, Razorpay checkout, current plan display, payment history, usage stats |
| A2 | **Email Verification Flow** | ✅ | Verification email on register, `/verify-email` page, `/resend-verification` endpoint, `VerifyEmailPage.jsx` |
| A3 | **Password Reset via Email** | ✅ | `/forgot-password` page, reset email with token, `/reset-password` page, `ForgotPasswordPage.jsx`, `ResetPasswordPage.jsx` |

### B. Important (P1) — Mostly Completed (March 17, 2026)

| # | Feature | Status | Details |
|---|---------|--------|---------|
| B1 | **Reverse Charge UI** | ✅ | RCM toggle on invoice/purchase forms with warnings; auto-enables for unregistered suppliers |
| B2 | **HSN Code Autocomplete** | ✅ | Autocomplete with 30+ common HSN/SAC codes on invoice/purchase line item forms |
| B3 | **Notification Settings Persistence** | ✅ | Toggle states saved to localStorage; persist across page reloads |
| B4 | **Bank Details UI in Settings** | ✅ | New "Bank & Filing" tab with bank name, account, IFSC, branch fields; persisted via `PUT /api/auth/settings` |
| B5 | **Filing Frequency Edit** | ✅ | Monthly/Quarterly dropdown in Settings → Bank & Filing tab |
| B6 | **User Email & Phone Edit** | ✅ | Already existed in Settings → User Profile tab |
| B7 | **Compliance Calendar** | ✅ | `ComplianceCalendarPage.jsx` with monthly grid, GSTR-1/3B/PMT-06 deadlines, color-coded, upcoming list |
| B8 | **Invoice Number Format Customization** | ❌ | Deferred to Phase 2 |

### C. Nice to Have (P2) — Can be done post-launch

| # | Feature | Effort | Details |
|---|---------|--------|---------|
| C1 | Logo Upload for Invoices | 1 day | Upload business logo; display on PDF |
| C2 | Bulk CSV Import (Customers, Suppliers) | 2 days | Upload CSV → parse → create records |
| C3 | Invoice Terms & Conditions Template | 0.5 day | Default T&C in Settings; auto-populate on invoices |
| C4 | Mobile Responsive Polish | 2 days | Thorough mobile testing and CSS adjustments |

---

## 🟢 PHASE 2: Advanced Features (Month 5–8)

### 12. Credit/Debit Notes

| # | Feature | Priority | Effort | Details |
|---|---------|----------|--------|---------|
| 12.1 | Create Credit Note (linked to original invoice) | P1 | 3 days | New model `CreditNote` with `originalInvoiceId`; reason, adjusted amount |
| 12.2 | Create Debit Note | P1 | 2 days | Similar to Credit Note |
| 12.3 | Auto-reflect in GSTR-1 (Table 9A, 9B, 9C) | P0 | 2 days | GSTR-1 generator must include credit/debit notes |
| 12.4 | Impact on Dashboard Totals | P1 | 1 day | Subtract credit notes from revenue |
| 12.5 | Credit/Debit Note PDF | P2 | 1 day | PDF template for notes |

### 13. Multi-User Access & Roles

| # | Feature | Priority | Effort | Details |
|---|---------|----------|--------|---------|
| 13.1 | Role-Based Access (Owner, Accountant, Viewer) | P1 | 3 days | DB: `role` field on User; Middleware: role-based route guards |
| 13.2 | Invite Team Members | P1 | 2 days | Owner sends invite link; new user joins with assigned role |
| 13.3 | Permission Matrix | P1 | 1 day | Owner: full access; Accountant: CRUD invoices/purchases; Viewer: read-only |
| 13.4 | Activity Audit Log | P1 | 2 days | Track who created/edited/deleted what; `AuditLog` model |

### 14. GSTR-2A/2B Reconciliation

| # | Feature | Priority | Effort | Details |
|---|---------|----------|--------|---------|
| 14.1 | Upload GSTR-2A/2B JSON | P1 | 2 days | Parse and store supplier-reported data |
| 14.2 | Auto-Match with Purchases | P0 | 3 days | Compare invoice number, date, amounts, GSTIN |
| 14.3 | Mismatch Report | P0 | 2 days | Highlight: missing in books, missing in 2A, amount differences |
| 14.4 | Accept/Reject ITC per Invoice | P1 | 1 day | Mark matched items; reject unmatched |
| 14.5 | Reconciliation Dashboard | P1 | 2 days | Summary cards: matched, unmatched, excess ITC at risk |

### 15. E-Way Bill Generation

| # | Feature | Priority | Effort | Details |
|---|---------|----------|--------|---------|
| 15.1 | E-Way Bill Form | P2 | 3 days | For goods movement > ₹50,000; vehicle number, distance, transporter |
| 15.2 | Link to Invoice | P2 | 1 day | Auto-populate from sales invoice |
| 15.3 | E-Way Bill Number Tracking | P2 | 1 day | Store bill number, validity |
| 15.4 | E-Way Bill Report | P2 | 1 day | List all e-way bills with status |

### 16. E-Invoice Generation

| # | Feature | Priority | Effort | Details |
|---|---------|----------|--------|---------|
| 16.1 | Generate IRN (Invoice Reference Number) | P2 | 3 days | Integrate with GSTN IRP (Invoice Registration Portal) |
| 16.2 | QR Code on Invoice | P2 | 1 day | Add signed QR code to PDF |
| 16.3 | E-Invoice Status Tracking | P2 | 1 day | Track IRN generation status |

### 17. Reports & Analytics

| # | Feature | Priority | Effort | Details |
|---|---------|----------|--------|---------|
| 17.1 | Sales Register Report (date range filter, export CSV) | P1 | 2 days | All invoices with tax breakdown |
| 17.2 | Purchase Register Report | P1 | 2 days | All purchases with ITC details |
| 17.3 | Tax Rate-wise Summary | P1 | 1 day | Group by 5%, 12%, 18%, 28% |
| 17.4 | Customer-wise Sales Report | P1 | 1 day | |
| 17.5 | Supplier-wise Purchase Report | P1 | 1 day | |
| 17.6 | HSN-wise Summary Report | P1 | 1 day | |
| 17.7 | ITC Analysis Report | P1 | 1 day | Available vs utilized vs balance |
| 17.8 | Export to Excel/CSV | P1 | 1 day | For all reports |

### 18. TDS/TCS Management

| # | Feature | Priority | Effort | Details |
|---|---------|----------|--------|---------|
| 18.1 | TCS for E-Commerce Operators | P2 | 2 days | Tax Collected at Source tracking |
| 18.2 | TDS on Purchases | P2 | 2 days | Tax Deducted at Source tracking |
| 18.3 | TDS/TCS Credit in GSTR-3B | P2 | 1 day | Table 6.2 in GSTR-3B |

---

## 🔵 PHASE 3: Enterprise Features (Month 9–12)

| # | Feature | Priority | Effort | Details |
|---|---------|----------|--------|---------|
| 19.1 | Auto-Filing to GST Portal (with DSC) | P2 | 4 weeks | Direct API integration with GSTN; Digital Signature Certificate |
| 19.2 | Inventory Management | P2 | 3 weeks | Stock tracking, stock-in/out linked to invoices/purchases |
| 19.3 | Bank Reconciliation | P2 | 2 weeks | Import bank statements; match with invoices/purchases |
| 19.4 | Financial Reports (P&L, Balance Sheet) | P2 | 3 weeks | Accounting reports from transaction data |
| 19.5 | AI-Powered Tax Optimization | P3 | 4 weeks | Suggest tax-saving opportunities based on data patterns |
| 19.6 | Mobile App (PWA) | P2 | 3 weeks | Progressive Web App with offline support |
| 19.7 | WhatsApp Integration | P3 | 2 weeks | Share invoices via WhatsApp |
| 19.8 | GST Chatbot | P3 | 3 weeks | AI chatbot for GST queries |
| 19.9 | Product/Service Master Module | P1 | 2 days | Reusable product catalog with HSN, default GST rate; auto-populate in invoice items |
| 19.10 | Admin Panel (Internal) | P1 | 2 weeks | User management, subscription overview, system health |

---

## 🗓️ Recommended Development Timeline

### Sprint 1 (Week 1–2): Phase 1 Remaining — Critical

| Task | Days | Owner |
|------|------|-------|
| Subscription & Pricing UI (A1) | 3–4 | Software Engineer |
| Email Verification Flow (A2) | 1–2 | Software Engineer |
| Password Reset via Email (A3) | 1 | Software Engineer |
| Performance & Stress Testing (TC 4.10–4.14) | 1 | QA Team |
| End-to-End Workflow Testing (Day 5) | 1 | QA Team |

### Sprint 2 (Week 3–4): Phase 1 Remaining — Important

| Task | Days | Owner |
|------|------|-------|
| Reverse Charge UI (B1) | 1 | Software Engineer |
| HSN Autocomplete (B2) | 1 | Software Engineer |
| Settings improvements (B3–B6) | 2 | Software Engineer |
| Compliance Calendar (B7) | 2 | Software Engineer |
| Invoice Number Customization (B8) | 1 | Software Engineer |
| Product/Service Master (19.9) | 2 | Software Engineer |

### Sprint 3–4 (Week 5–8): Phase 2 — Core

| Task | Days | Owner |
|------|------|-------|
| Credit/Debit Notes (12.1–12.5) | 5 | Software Engineer |
| Multi-User Roles (13.1–13.4) | 5 | Software Engineer |
| Reports & Analytics (17.1–17.8) | 5 | Software Engineer + Data Engineer |
| Bug fixes from QA | Ongoing | Software Engineer |

### Sprint 5–8 (Week 9–16): Phase 2 — Advanced

| Task | Weeks | Owner |
|------|-------|-------|
| GSTR-2A/2B Reconciliation (14.1–14.5) | 2 | Software Engineer + Data Engineer |
| E-Way Bill Generation (15.1–15.4) | 1.5 | Software Engineer |
| E-Invoice Generation (16.1–16.3) | 1.5 | Software Engineer |
| TDS/TCS Management (18.1–18.3) | 1 | Software Engineer |
| Deploy to Production + CI/CD | 1 | Data Engineer |

---

## 📝 File Inventory

### Backend Files

```
backend/src/
├── config/
│   ├── database.js              ✅ Prisma client singleton
│   └── subscriptionPlans.js     ✅ Plan definitions & limits
├── controllers/
│   ├── authController.js        ✅ Register, Login, Profile, Update, Password
│   ├── customerController.js    ✅ CRUD + validation
│   ├── dashboardController.js   ✅ Stats, Charts, Trends
│   ├── gstr1Controller.js       ✅ Generate, Download, Status
│   ├── gstr3bController.js      ✅ Generate, Download, Status
│   ├── invoiceController.js     ✅ CRUD, PDF, Email, Mark Filed
│   ├── paymentController.js     ✅ Razorpay integration
│   ├── purchaseController.js    ✅ CRUD, Mark Paid
│   ├── subscriptionController.js ✅ Plan status, limits
│   └── supplierController.js    ✅ CRUD
├── middleware/
│   ├── authMiddleware.js        ✅ JWT verification
│   └── subscriptionMiddleware.js ✅ Plan limit checks
├── routes/
│   ├── authRoutes.js            ✅
│   ├── customerRoutes.js        ✅
│   ├── dashboardRoutes.js       ✅
│   ├── gstr1Routes.js           ✅
│   ├── gstr3bRoutes.js          ✅
│   ├── invoiceRoutes.js         ✅
│   ├── paymentRoutes.js         ✅
│   ├── purchaseRoutes.js        ✅
│   ├── subscriptionRoutes.js    ✅
│   ├── supplierRoutes.js        ✅
│   └── webhookRoutes.js         ✅
├── services/
│   ├── authService.js           ✅
│   ├── customerService.js       ✅
│   ├── dashboardService.js      ✅
│   ├── emailService.js          ✅ (needs SMTP config)
│   ├── gstCalculator.js         ✅ Core GST engine
│   ├── gstr1Service.js          ✅
│   ├── gstr3bService.js         ✅
│   ├── invoiceService.js        ✅
│   ├── paymentService.js        ✅ (Razorpay backend)
│   ├── pdfService.js            ✅
│   ├── purchaseService.js       ✅
│   ├── subscriptionService.js   ✅
│   └── supplierService.js       ✅
├── utils/
│   ├── gstValidation.js         ✅ GSTIN, PAN, State, Pincode, Phone
│   ├── hsnSacValidator.js       ✅ (not wired to live UI yet)
│   └── invoiceNumberGenerator.js ✅
└── index.js                     ✅ Express app entry
```

### Frontend Files

```
frontend/src/
├── App.jsx                      ✅ Routes configuration
├── main.jsx                     ✅ App entry point
├── components/
│   ├── common/
│   │   └── ErrorBoundary.jsx    ✅
│   └── layout/
│       └── MainLayout.jsx       ✅ Sidebar + Header + User menu
├── context/
│   └── AuthContext.jsx          ✅ Auth state, login/logout, token
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx        ✅
│   │   └── RegisterPage.jsx     ✅
│   ├── CustomersPage.jsx        ✅ Full CRUD + validations
│   ├── DashboardPage.jsx        ✅ Stats + Charts + Month selector
│   ├── GSTReturnsPage.jsx       ✅ GSTR-1 & 3B generation, detail view, status
│   ├── InvoicesPage.jsx         ✅ Full CRUD + PDF + Email + Filed + Status
│   ├── ProfilePage.jsx          ✅ Read-only user + business info
│   ├── PurchasesPage.jsx        ✅ Full CRUD + Mark Paid + Search + Filter
│   ├── SettingsPage.jsx         ✅ Business edit + Password change + Notifications
│   └── SuppliersPage.jsx        ✅ Full CRUD + validations
├── services/
│   └── api.js                   ✅ Axios instances for all APIs
├── styles/
│   ├── auth.css                 ✅
│   ├── common.css               ✅
│   └── dashboard.css            ✅
├── theme/
│   └── theme.js                 ✅ MUI theme customization
└── utils/
    ├── constants.js             ✅ Status colors, messages
    ├── errorHandler.js          ✅ Toast notifications
    └── formatters.js            ✅ Currency, Date formatting
```

### Database Schema (Prisma)

```
Models:
├── User                         ✅ Auth + Profile
├── Business                     ✅ GSTIN, PAN, Subscription
├── Customer                     ✅ B2B/B2C
├── Invoice                      ✅ GST breakdown, Status flags
├── InvoiceItem                  ✅ Line items with tax
├── Supplier                     ✅ Registered/Unregistered
├── Purchase                     ✅ ITC, Payment status
├── PurchaseItem                 ✅ Line items with tax
├── GSTReturn                    ✅ GSTR-1, GSTR-3B data
└── Payment                      ✅ Razorpay transactions
```

---

## ✅ Summary

| Category | Built | Remaining | Total |
|----------|-------|-----------|-------|
| Phase 1 Features | ~85% | ~15% | Core MVP |
| Backend APIs | 95% | 5% | 40+ endpoints |
| Frontend Pages | 90% | 10% | 10 pages |
| Bug Fixes During Testing | 20+ | 0 | All resolved |
| Test Cases Executed | ~70/80+ | ~10 | UAT Plan |

**The application is ready for QA team handoff.** The remaining Phase 1 items (Subscription UI, Email Verification, Password Reset) are needed before production deployment but don't block QA testing of core functionality.

---

**Document Version:** 1.0  
**Last Updated:** February 22, 2026  
**Owner:** Software Engineer (You)  
**Next Review:** After Sprint 1 completion
