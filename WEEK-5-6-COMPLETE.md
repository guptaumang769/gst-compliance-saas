# Week 5-6 Complete: Purchase Management & Dashboard 🎉

**Status:** ✅ Complete  
**Date:** January 26, 2026  
**Features:** Purchase Invoices, Supplier Management, Dashboard Analytics, ITC Calculation

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [What's New](#whats-new)
3. [Database Changes](#database-changes)
4. [API Endpoints](#api-endpoints)
5. [Key Features](#key-features)
6. [Setup & Testing](#setup--testing)
7. [Usage Examples](#usage-examples)
8. [Business Logic](#business-logic)
9. [Next Steps](#next-steps)

---

## Overview

Week 5-6 adds **Purchase Invoice Management** and **Dashboard Analytics** to complete the core accounting loop:

**Before Week 5-6:**
- ✅ Create sales invoices
- ✅ Track customers
- ✅ Calculate output GST (tax liability)

**After Week 5-6:**
- ✅ Create purchase invoices (expenses)
- ✅ Track suppliers
- ✅ Calculate Input Tax Credit (ITC)
- ✅ **Net Tax Payable = Sales Tax - ITC** ⭐
- ✅ Dashboard with business insights
- ✅ GST filing deadline tracking

---

## What's New

### 1. **Supplier Management** 👥

Track vendors/suppliers from whom you purchase goods/services.

**Features:**
- Add registered suppliers (with GSTIN)
- Add unregistered suppliers (without GSTIN)
- GSTIN validation
- Supplier search and filtering
- Supplier statistics

### 2. **Purchase Invoice Management** 📦

Record purchases and track GST paid (for ITC claims).

**Features:**
- Create purchase invoices with multiple items
- Automatic GST calculation (CGST/SGST/IGST)
- ITC (Input Tax Credit) tracking
- Mark ITC eligible/ineligible
- Purchase type classification (goods, services, capital goods, import)
- Payment tracking
- Support for reverse charge mechanism

### 3. **Dashboard & Analytics** 📊

Business intelligence at a glance.

**Features:**
- Current month overview (revenue, expenses, tax)
- **Net tax payable calculation** (Sales Tax - ITC)
- Top customers and suppliers
- Revenue trend (6-month chart)
- GST filing deadlines
- Quick stats cards

### 4. **ITC Calculation Engine** 💰

Core business logic for Input Tax Credit.

**Formula:**
```
Net Tax Payable = Output Tax (Sales) - Input Tax Credit (Purchases)
```

**Example:**
- Sales this month: ₹5,00,000 → GST @18% = ₹90,000 (Output Tax)
- Purchases this month: ₹3,00,000 → GST @18% = ₹54,000 (ITC)
- **Net Tax Payable = ₹90,000 - ₹54,000 = ₹36,000** ✅

---

## Database Changes

### New Models

#### 1. **Supplier Model**
```prisma
model Supplier {
  id               String    @id @default(uuid())
  businessId       String
  supplierName     String
  gstin            String?   // Optional for unregistered
  pan              String?
  billingAddress   String
  city             String
  state            String
  stateCode        String?
  pincode          String
  email            String?
  phone            String?
  supplierType     String    @default("registered")
  // ... metadata fields
}
```

#### 2. **Purchase Model**
```prisma
model Purchase {
  id                    String    @id @default(uuid())
  businessId            String
  supplierId            String
  supplierInvoiceNumber String
  supplierInvoiceDate   DateTime
  purchaseType          String    // goods, services, capital_goods, import
  
  // Financial fields
  subtotal              Decimal
  taxableAmount         Decimal
  cgstAmount            Decimal
  sgstAmount            Decimal
  igstAmount            Decimal
  cessAmount            Decimal
  totalTaxAmount        Decimal
  totalAmount           Decimal
  
  // ITC tracking (CRITICAL)
  isItcEligible         Boolean   @default(true)
  itcClaimType          String    @default("full")
  itcAmount             Decimal   // Tax amount eligible for ITC
  
  // ... other fields
}
```

#### 3. **PurchaseItem Model**
```prisma
model PurchaseItem {
  id                String   @id @default(uuid())
  purchaseId        String
  itemName          String
  hsnCode           String?
  sacCode           String?
  quantity          Decimal
  unitPrice         Decimal
  taxableAmount     Decimal
  gstRate           Decimal
  // ... GST breakdown fields
  isItcEligible     Boolean  @default(true)
  itcAmount         Decimal  // Item-level ITC
}
```

### Database Migration

Run this on your **Windows laptop** after pulling the code:

```powershell
cd backend
npx prisma generate
npx prisma migrate dev --name add_purchase_and_dashboard
```

---

## API Endpoints

### Supplier APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/suppliers` | Create new supplier | ✅ |
| GET | `/api/suppliers` | List all suppliers | ✅ |
| GET | `/api/suppliers/:id` | Get supplier details | ✅ |
| PUT | `/api/suppliers/:id` | Update supplier | ✅ |
| DELETE | `/api/suppliers/:id` | Delete supplier | ✅ |
| GET | `/api/suppliers/stats` | Supplier statistics | ✅ |

**Query Parameters (GET /api/suppliers):**
- `supplierType` - Filter by type (registered/unregistered)
- `search` - Search by name, GSTIN, email
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

### Purchase APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/purchases` | Create purchase invoice | ✅ |
| GET | `/api/purchases` | List all purchases | ✅ |
| GET | `/api/purchases/:id` | Get purchase details | ✅ |
| PUT | `/api/purchases/:id` | Update purchase | ✅ |
| DELETE | `/api/purchases/:id` | Delete purchase | ✅ |
| GET | `/api/purchases/stats` | Purchase statistics | ✅ |
| GET | `/api/purchases/itc/:year/:month` | Calculate ITC for period | ✅ |

**Query Parameters (GET /api/purchases):**
- `supplierId` - Filter by supplier
- `startDate` - Filter from date (YYYY-MM-DD)
- `endDate` - Filter to date (YYYY-MM-DD)
- `purchaseType` - Filter by type (goods/services/etc)
- `isItcEligible` - Filter by ITC eligibility
- `page` - Page number
- `limit` - Items per page

### Dashboard APIs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/quick-stats` | Quick overview cards | ✅ |
| GET | `/api/dashboard/overview` | Detailed monthly overview | ✅ |
| GET | `/api/dashboard/top-customers` | Top customers by revenue | ✅ |
| GET | `/api/dashboard/top-suppliers` | Top suppliers by expenditure | ✅ |
| GET | `/api/dashboard/revenue-trend` | 6-month revenue chart | ✅ |
| GET | `/api/dashboard/deadlines` | GST filing deadlines | ✅ |

**Query Parameters (GET /api/dashboard/overview):**
- `month` - Month (1-12, default: current)
- `year` - Year (YYYY, default: current)

---

## Key Features

### 1. ITC Calculation Logic

#### What is ITC (Input Tax Credit)?

When you purchase goods/services for business use, you pay GST to the supplier. This GST can be claimed back (as credit) from the government.

**Example:**
```
Your Business: Electronics Retailer

Sales (This Month):
- Sold laptops for ₹5,00,000
- Charged GST @18%: ₹90,000
- Total collected from customers: ₹5,90,000

Purchases (This Month):
- Bought laptops from distributor: ₹3,00,000
- Paid GST @18%: ₹54,000
- Total paid to supplier: ₹3,54,000

ITC Calculation:
- Output Tax (Sales GST): ₹90,000
- Input Tax Credit (Purchase GST): ₹54,000
- Net Tax Payable: ₹90,000 - ₹54,000 = ₹36,000

You only pay ₹36,000 to the government!
```

#### ITC Eligibility Rules

**ITC is available for:**
- ✅ Goods/services used for business purposes
- ✅ Capital goods (machinery, equipment)
- ✅ Input raw materials
- ✅ Office supplies, utilities

**ITC is NOT available for:**
- ❌ Personal use items
- ❌ Food and beverages
- ❌ Motor vehicles (except for specific business use)
- ❌ Works contract services for construction of immovable property
- ❌ Goods/services used for exempt supplies

Our system allows you to mark each purchase as ITC eligible or not.

### 2. Purchase Types

```javascript
purchaseType Options:
- "goods"         → Physical products (laptops, furniture, raw materials)
- "services"      → Services (consulting, software subscriptions, rent)
- "capital_goods" → Long-term assets (machinery, computers, vehicles)
- "import"        → Imported goods (IGST + customs duty)
```

### 3. Reverse Charge Mechanism (RCM)

In some cases, the **buyer** (not the supplier) is responsible for paying GST.

**When RCM applies:**
- Purchase from unregistered supplier
- Purchase of specific services (legal, security, manpower)
- Import of services

```javascript
// Example: Purchase from unregistered supplier
{
  supplierId: "...",
  reverseCharge: true,  // You'll pay GST to government
  isItcEligible: true   // But you can claim ITC
}
```

### 4. Dashboard Metrics Explained

#### **Output Tax (Sales Tax Liability)**
Total GST collected from customers on sales.

#### **Input Tax Credit (ITC)**
Total GST paid on purchases (eligible for credit).

#### **Net Tax Payable**
```
Net Tax Payable = Output Tax - ITC

If negative → You get a refund!
```

#### **Top Customers/Suppliers**
Ranked by revenue/expenditure to identify key business relationships.

#### **Revenue Trend**
6-month historical chart to visualize business growth.

#### **GST Deadlines**
Automated deadline tracking:
- **GSTR-1:** 11th of next month (sales details)
- **GSTR-3B:** 20th of next month (summary return + payment)

---

## Setup & Testing

### Step 1: Pull Latest Code (Windows Laptop)

```powershell
cd C:\path\to\AI-SaaS-Project\gst-compliance-saas
git pull origin main
```

### Step 2: Update Database Schema

```powershell
cd backend

# Generate Prisma client with new models
npx prisma generate

# Run database migration
npx prisma migrate dev --name add_purchase_and_dashboard

# Verify migration
npx prisma studio  # Opens GUI at http://localhost:5555
```

You should see new tables:
- `suppliers`
- `purchases`
- `purchase_items`

### Step 3: Restart Backend

```powershell
# Stop current backend (Ctrl+C)

# Start backend
npm run dev
```

Expected output:
```
🚀 ==========================================
   GST Compliance SaaS Backend
   Server: http://localhost:5000
   Health: http://localhost:5000/health
   API Info: http://localhost:5000/api
==========================================🚀
```

### Step 4: Verify New APIs

Visit: http://localhost:5000/api

You should see:
```json
{
  "endpoints": {
    "suppliers": "/api/suppliers ✅ NEW",
    "purchases": "/api/purchases ✅ NEW",
    "dashboard": "/api/dashboard ✅ NEW"
  }
}
```

### Step 5: Run Test Suites

```powershell
cd backend

# Test 1: Purchase & Supplier Management (12 tests)
node src/test-purchases-suppliers.js

# Test 2: Dashboard Analytics (7 tests)
node src/test-dashboard.js
```

**Expected Output:**
```
═══════════════════════════════════════════════
  TEST SUMMARY
═══════════════════════════════════════════════
Total Tests: 19
✅ Passed: 19
❌ Failed: 0
Success Rate: 100.0%
═══════════════════════════════════════════════
```

---

## Usage Examples

### Example 1: Create a Supplier

```javascript
POST /api/suppliers
Authorization: Bearer <token>

{
  "supplierName": "TechCorp Supplies Pvt Ltd",
  "gstin": "29ABCDE1234F1Z5",
  "pan": "ABCDE1234F",
  "billingAddress": "456 Supplier Street",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001",
  "email": "sales@techcorp.com",
  "phone": "+91-9876543210",
  "supplierType": "registered"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Supplier created successfully",
  "data": {
    "id": "uuid-here",
    "supplierName": "TechCorp Supplies Pvt Ltd",
    "gstin": "29ABCDE1234F1Z5",
    "stateCode": "29",
    "state": "Karnataka"
  }
}
```

### Example 2: Create a Purchase Invoice

```javascript
POST /api/purchases
Authorization: Bearer <token>

{
  "supplierId": "supplier-uuid",
  "supplierInvoiceNumber": "TCORP/2026/001",
  "supplierInvoiceDate": "2026-01-25",
  "purchaseType": "goods",
  "isItcEligible": true,
  "notes": "Office equipment purchase",
  "items": [
    {
      "itemName": "Dell Laptop",
      "hsnCode": "84713000",
      "quantity": 5,
      "unit": "NOS",
      "unitPrice": 50000,
      "gstRate": 18,
      "cessRate": 0
    },
    {
      "itemName": "HP Printer",
      "hsnCode": "84433100",
      "quantity": 2,
      "unit": "NOS",
      "unitPrice": 15000,
      "gstRate": 18,
      "cessRate": 0
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Purchase invoice created successfully",
  "data": {
    "id": "purchase-uuid",
    "supplierInvoiceNumber": "TCORP/2026/001",
    "subtotal": 280000,
    "totalTaxAmount": 50400,
    "cgstAmount": 25200,
    "sgstAmount": 25200,
    "igstAmount": 0,
    "totalAmount": 330400,
    "itcAmount": 50400,  // ✅ ITC you can claim!
    "items": [...]
  }
}
```

**Breakdown:**
- 5 Laptops: 5 × ₹50,000 = ₹2,50,000
- 2 Printers: 2 × ₹15,000 = ₹30,000
- **Subtotal:** ₹2,80,000
- **GST @18%:** ₹50,400 (CGST: ₹25,200 + SGST: ₹25,200)
- **Total:** ₹3,30,400
- **ITC Claimable:** ₹50,400 ✅

### Example 3: Get Dashboard Overview

```javascript
GET /api/dashboard/overview?month=1&year=2026
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "month": 1,
      "year": 2026,
      "monthName": "January"
    },
    "sales": {
      "totalRevenue": 590000,
      "taxableAmount": 500000,
      "totalTax": 90000,
      "cgst": 45000,
      "sgst": 45000,
      "igst": 0,
      "invoiceCount": 10
    },
    "purchases": {
      "totalExpenditure": 330400,
      "taxableAmount": 280000,
      "totalItc": 50400,
      "cgst": 25200,
      "sgst": 25200,
      "igst": 0,
      "purchaseCount": 2
    },
    "tax": {
      "outputTax": 90000,
      "inputTaxCredit": 50400,
      "netTaxPayable": 39600,  // ✅ Amount to pay to government
      "refundDue": 0
    }
  }
}
```

**Insight:**
- You collected ₹90,000 from customers
- You paid ₹50,400 to suppliers
- **You only owe ₹39,600 to the government!** 🎉

### Example 4: Calculate ITC for Period

```javascript
GET /api/purchases/itc/2026/1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "month": 1,
    "year": 2026,
    "period": "2026-01",
    "itcBreakdown": {
      "totalItc": 50400,
      "cgstItc": 25200,
      "sgstItc": 25200,
      "igstItc": 0,
      "cessItc": 0,
      "byPurchaseType": {
        "goods": {
          "totalItc": 50400,
          "count": 2
        }
      }
    },
    "purchaseCount": 2
  }
}
```

### Example 5: Get GST Filing Deadlines

```javascript
GET /api/dashboard/deadlines
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "returnType": "GSTR-1",
      "description": "Details of outward supplies (sales)",
      "forPeriod": "01/2026",
      "dueDate": "2026-02-11",
      "daysRemaining": 16,
      "isOverdue": false,
      "priority": "normal",
      "status": "pending"
    },
    {
      "returnType": "GSTR-3B",
      "description": "Summary return with tax payment",
      "forPeriod": "01/2026",
      "dueDate": "2026-02-20",
      "daysRemaining": 25,
      "isOverdue": false,
      "priority": "normal",
      "status": "pending"
    }
  ]
}
```

---

## Business Logic

### ITC Calculation Flow

```
1. User creates purchase invoice
   ↓
2. System determines supply type (intra/inter state)
   ↓
3. System calculates GST (CGST+SGST or IGST)
   ↓
4. Check if purchase is ITC eligible
   ↓
5. If eligible: itcAmount = totalTaxAmount
   If not eligible: itcAmount = 0
   ↓
6. Store itcAmount at both invoice & item level
   ↓
7. Dashboard aggregates all ITC for the period
   ↓
8. Net Tax = Sales Tax - Total ITC
```

### Dashboard Calculation Flow

```
1. Get current month/year
   ↓
2. Query all invoices for the period
   → Sum: totalAmount, taxableAmount, totalTaxAmount
   ↓
3. Query all purchases for the period (where isItcEligible = true)
   → Sum: itcAmount
   ↓
4. Calculate: netTaxPayable = salesTax - itcAmount
   ↓
5. If netTaxPayable < 0 → refundDue = abs(netTaxPayable)
   ↓
6. Return dashboard metrics
```

### State-wise GST Logic

```javascript
Business State: Maharashtra (27)
Supplier State: Karnataka (29)

Supply Type: Inter-state (different states)
↓
GST Type: IGST
Example: ₹1,00,000 @ 18% → IGST: ₹18,000

---

Business State: Maharashtra (27)
Supplier State: Maharashtra (27)

Supply Type: Intra-state (same state)
↓
GST Type: CGST + SGST
Example: ₹1,00,000 @ 18% → CGST: ₹9,000 + SGST: ₹9,000
```

---

## Next Steps

### Week 7-8: GSTR-1 & GSTR-3B Generation 📄

Now that we have:
- ✅ Sales invoices (output tax)
- ✅ Purchase invoices (ITC)
- ✅ Dashboard calculations

We can build:
- **GSTR-1:** Detailed sales return (B2B, B2C, exports, etc.)
- **GSTR-3B:** Summary return with tax liability
- Auto-generate JSON/Excel files for GST Portal upload
- One-click filing (future: API integration with GST Portal)

### Week 9-10: Frontend Development 🎨

Build the React UI:
- Dashboard with charts
- Invoice/purchase creation forms
- Customer/supplier management
- GST return generation screens

---

## Files Created

```
backend/
├── prisma/
│   └── schema.prisma (updated with Supplier, Purchase, PurchaseItem)
│
├── src/
│   ├── services/
│   │   ├── supplierService.js ✅ NEW
│   │   ├── purchaseService.js ✅ NEW
│   │   └── dashboardService.js ✅ NEW
│   │
│   ├── controllers/
│   │   ├── supplierController.js ✅ NEW
│   │   ├── purchaseController.js ✅ NEW
│   │   └── dashboardController.js ✅ NEW
│   │
│   ├── routes/
│   │   ├── supplierRoutes.js ✅ NEW
│   │   ├── purchaseRoutes.js ✅ NEW
│   │   └── dashboardRoutes.js ✅ NEW
│   │
│   ├── test-purchases-suppliers.js ✅ NEW (12 tests)
│   ├── test-dashboard.js ✅ NEW (7 tests)
│   │
│   └── index.js (updated with new routes)
│
└── package.json (no new dependencies)
```

**Total New Files:** 9 services/controllers/routes + 2 test files = **11 files**  
**Total Lines of Code:** ~2,500+ lines  
**Test Coverage:** 19 comprehensive tests

---

## Summary

### What You Can Do Now:

1. **Track Purchases** 📦
   - Record all business expenses
   - Calculate GST paid on purchases
   - Track ITC for tax savings

2. **Manage Suppliers** 👥
   - Add registered & unregistered suppliers
   - GSTIN validation
   - Supplier statistics

3. **Calculate Net Tax** 💰
   - Automatic ITC calculation
   - Net tax payable = Sales Tax - ITC
   - Save money on taxes!

4. **View Analytics** 📊
   - Monthly revenue and expenses
   - Tax liability overview
   - Top customers and suppliers
   - Revenue trends
   - GST deadline tracking

5. **Prepare for Filing** 📄
   - All data ready for GSTR-1
   - ITC calculated for GSTR-3B
   - Deadline reminders

---

## 🎉 Milestone Achieved!

You now have a **complete accounting loop**:
- ✅ Sales tracking (Week 3-4)
- ✅ Purchase tracking (Week 5-6)
- ✅ Tax calculation (both output & input)
- ✅ Dashboard with business insights

**Next:** GST return generation and filing automation! 🚀

---

**Questions?** See the individual service files for detailed JSDoc comments.

**Need Help?** Run the test suites to see working examples of all APIs.

Happy Coding! 💻✨
