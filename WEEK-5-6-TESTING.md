# Week 5-6 Testing Guide 🧪

Complete guide for testing Purchase Management & Dashboard features on your Windows laptop.

---

## 📋 Pre-requisites

1. ✅ Backend server running (`npm run dev`)
2. ✅ Docker containers running (`docker-compose up -d`)
3. ✅ Database migrated (see Step 2 below)
4. ✅ Test user created (from Week 2)

---

## Step 1: Pull Latest Code

```powershell
cd C:\Users\gupta\AI-SaaS-Project\gst-compliance-saas
git pull origin main
```

Expected output:
```
remote: Enumerating objects: 25, done.
remote: Counting objects: 100% (25/25), done.
Updating abc1234..def5678
Fast-forward
 backend/prisma/schema.prisma                    | 150 ++++++++++
 backend/src/services/purchaseService.js         | 450 ++++++++++++++++++++++++++
 ...
 25 files changed, 2500 insertions(+)
```

---

## Step 2: Update Database Schema

```powershell
cd backend

# Generate new Prisma client
npx prisma generate

# Run migration (creates new tables)
npx prisma migrate dev --name add_purchase_and_dashboard
```

Expected output:
```
✔ Generated Prisma Client to ./node_modules/@prisma/client

Applying migration `20260126_add_purchase_and_dashboard`

The following migration(s) have been created and applied:

migrations/
  └─ 20260126_add_purchase_and_dashboard/
      └─ migration.sql

✔ Generated Prisma Client
```

**Verify Migration:**
```powershell
npx prisma studio
```

Opens: http://localhost:5555

You should see new tables:
- ✅ `suppliers`
- ✅ `purchases`
- ✅ `purchase_items`

---

## Step 3: Restart Backend

```powershell
# Stop backend (Ctrl+C if running)

# Start backend
npm run dev
```

Expected output:
```
🚀 ==========================================
   GST Compliance SaaS Backend
   Server: http://localhost:5000
   Health: http://localhost:5000/health
   ...
==========================================🚀
```

**Verify API:**

Visit: http://localhost:5000/api

Should show:
```json
{
  "endpoints": {
    "suppliers": "/api/suppliers ✅ NEW",
    "purchases": "/api/purchases ✅ NEW",
    "dashboard": "/api/dashboard ✅ NEW"
  }
}
```

---

## Step 4: Run Test Suites

### Test Suite 1: Purchase & Supplier Management (12 tests)

```powershell
cd backend
node src/test-purchases-suppliers.js
```

**Expected Output:**

```
═══════════════════════════════════════════════
  GST SaaS - Purchase & Supplier Test Suite
═══════════════════════════════════════════════

🔐 Logging in...
✅ Login successful

📝 Test 1: Create Supplier (Registered with GSTIN)
✅ Supplier created successfully
   ID: abc-123-xyz
   Name: TechCorp Supplies Pvt Ltd
   GSTIN: 29ABCDE1234F1Z5

📝 Test 2: Create Unregistered Supplier (No GSTIN)
✅ Unregistered supplier created successfully
   ID: def-456-uvw
   Name: Local Vendor
   Type: unregistered

📝 Test 3: Get All Suppliers
✅ Retrieved 2 suppliers
   Total: 2

📝 Test 4: Get Supplier by ID
✅ Supplier details retrieved successfully
   Name: TechCorp Supplies Pvt Ltd
   State: Karnataka

📝 Test 5: Get Supplier Statistics
✅ Supplier statistics retrieved successfully
   Total Suppliers: 2
   Registered: 1
   Unregistered: 1

📝 Test 6: Create Purchase Invoice (Intra-State → CGST+SGST)
✅ Purchase invoice created successfully
   Invoice #: TCORP/2026/001
   Total: ₹123900
   CGST: ₹9450
   SGST: ₹9450
   ITC Available: ₹18900
✅ GST calculations verified!

📝 Test 7: Create Purchase Invoice with Cess (Luxury Item)
✅ Purchase with cess created successfully
   Invoice #: TCORP/2026/002
   Taxable: ₹2000000
   GST (40%): ₹800000
   Cess (20%): ₹400000
   Total: ₹3200000
✅ Cess calculation verified!

📝 Test 8: Get All Purchases
✅ Retrieved 2 purchases
   Total: 2

📝 Test 9: Get Purchase by ID (with items)
✅ Purchase details retrieved successfully
   Invoice #: TCORP/2026/001
   Supplier: TechCorp Supplies Pvt Ltd
   Items: 2
   ITC: ₹18900

📝 Test 10: Get Purchase Statistics
✅ Purchase statistics retrieved successfully
   Total Purchases: 2
   Total Amount: ₹3323900
   ITC Available: ₹818900

📝 Test 11: Calculate ITC for Current Period
✅ ITC calculation successful
   Period: 2026-01
   Total ITC: ₹818900
   CGST ITC: ₹9450
   SGST ITC: ₹9450
   IGST ITC: ₹0

📝 Test 12: Update Purchase (Mark as Paid)
✅ Purchase updated successfully
   Paid: true
   Payment Date: 2026-01-26T00:00:00.000Z

═══════════════════════════════════════════════
  TEST SUMMARY
═══════════════════════════════════════════════
Total Tests: 12
✅ Passed: 12
❌ Failed: 0
Success Rate: 100.0%
═══════════════════════════════════════════════
```

### Test Suite 2: Dashboard Analytics (7 tests)

```powershell
node src/test-dashboard.js
```

**Expected Output:**

```
═══════════════════════════════════════════════
  GST SaaS - Dashboard Test Suite
═══════════════════════════════════════════════

🔐 Logging in...
✅ Login successful

📊 Test 1: Get Quick Stats
✅ Quick stats retrieved successfully

  Current Month:
    Revenue: ₹590000
    Expenses: ₹3323900
    Tax Liability: ₹90000
    ITC Available: ₹818900
    Net Tax Payable: ₹0

  Counts:
    Customers: 3
    Suppliers: 2
    Invoices: 5
    Purchases: 2

  Alerts:
    Upcoming Deadlines: 2

📊 Test 2: Get Dashboard Overview (Current Month)
✅ Dashboard overview retrieved successfully

  Period: January 2026

  Sales:
    Total Revenue: ₹590000
    Taxable Amount: ₹500000
    Total Tax: ₹90000
      CGST: ₹45000
      SGST: ₹45000
      IGST: ₹0
    Invoice Count: 5

  Purchases:
    Total Expenditure: ₹3323900
    Total ITC: ₹818900
      CGST: ₹9450
      SGST: ₹9450
      IGST: ₹0
    Purchase Count: 2

  Tax Summary:
    Output Tax (Sales): ₹90000
    Input Tax Credit: ₹818900
    Net Tax Payable: ₹0  ← Refund due: ₹728900

📊 Test 3: Get Top Customers
✅ Top customers retrieved successfully
   Found: 3 customers

   1. ACME Corporation
      Revenue: ₹295000
      Tax: ₹45000
      Invoices: 2

   2. Tech Startup Ltd
      Revenue: ₹177000
      Tax: ₹27000
      Invoices: 2

   3. Retailer Business
      Revenue: ₹118000
      Tax: ₹18000
      Invoices: 1

📊 Test 4: Get Top Suppliers
✅ Top suppliers retrieved successfully
   Found: 1 suppliers

   1. TechCorp Supplies Pvt Ltd
      Expenditure: ₹3323900
      ITC: ₹818900
      Purchases: 2

📊 Test 5: Get Revenue Trend (Last 6 Months)
✅ Revenue trend retrieved successfully
   Data points: 6

   Aug 2025: ₹0 (Tax: ₹0)
   Sep 2025: ₹0 (Tax: ₹0)
   Oct 2025: ₹0 (Tax: ₹0)
   Nov 2025: ₹0 (Tax: ₹0)
   Dec 2025: ₹0 (Tax: ₹0)
   Jan 2026: ₹590000 (Tax: ₹90000)

📊 Test 6: Get GST Filing Deadlines
✅ GST deadlines retrieved successfully
   Upcoming deadlines: 2

   GSTR-1
     For Period: 01/2026
     Due Date: 2026-02-11
     Days Remaining: 16
     Priority: NORMAL

   GSTR-3B
     For Period: 01/2026
     Due Date: 2026-02-20
     Days Remaining: 25
     Priority: NORMAL

📊 Test 7: Get Overview for Previous Month
✅ Previous month overview retrieved successfully
   Period: December 2025
   Net Tax Payable: ₹0

═══════════════════════════════════════════════
  TEST SUMMARY
═══════════════════════════════════════════════
Total Tests: 7
✅ Passed: 7
❌ Failed: 0
Success Rate: 100.0%
═══════════════════════════════════════════════
```

---

## Step 5: Manual API Testing (Optional)

Use Thunder Client, Postman, or curl to test individual endpoints.

### 1. Login (Get Token)

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@gstcompliance.com",
  "password": "Test@1234"
}
```

Copy the `token` from response.

### 2. Create Supplier

```bash
POST http://localhost:5000/api/suppliers
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "supplierName": "Office Supplies Co",
  "gstin": "27XYZAB1234C1Z6",
  "billingAddress": "123 Supplier Lane",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "supplierType": "registered"
}
```

### 3. Create Purchase Invoice

```bash
POST http://localhost:5000/api/purchases
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "supplierId": "<supplier-id-from-above>",
  "supplierInvoiceNumber": "INV-001",
  "supplierInvoiceDate": "2026-01-26",
  "purchaseType": "goods",
  "isItcEligible": true,
  "items": [
    {
      "itemName": "Office Chair",
      "hsnCode": "94013000",
      "quantity": 10,
      "unitPrice": 5000,
      "gstRate": 18
    }
  ]
}
```

### 4. Get Dashboard Overview

```bash
GET http://localhost:5000/api/dashboard/overview?month=1&year=2026
Authorization: Bearer <your-token>
```

### 5. Calculate ITC

```bash
GET http://localhost:5000/api/purchases/itc/2026/1
Authorization: Bearer <your-token>
```

---

## 🐛 Troubleshooting

### Issue 1: Migration Fails

**Error:**
```
Error: P3009: migrate found failed migrations...
```

**Solution:**
```powershell
# Reset database (WARNING: Deletes all data!)
npx prisma migrate reset

# Re-run migrations
npx prisma migrate dev
```

### Issue 2: "Supplier not found" Error

**Cause:** Trying to create purchase before creating supplier.

**Solution:** Create supplier first, then use the returned `id` in purchase creation.

### Issue 3: "GSTIN validation failed"

**Cause:** Invalid GSTIN format.

**Solution:** Use valid GSTIN format:
- 15 characters
- First 2: State code (01-37)
- Next 10: PAN
- 13th: Entity number (1-9, A-Z)
- 14th: Z
- 15th: Checksum

Example: `27ABCDE1234F1Z5`

### Issue 4: Tests Fail with "Login failed"

**Solution:**
```powershell
# Create test user first
node src/test-auth.js
```

---

## 📊 Expected Test Results Summary

| Test Suite | Tests | Expected Pass | Description |
|------------|-------|---------------|-------------|
| Auth | 7 | 7 | User registration, login |
| GST Calculator | 15 | 15 | GST calculation logic |
| Customer & Invoice | 8 | 8 | Sales management |
| Purchase & Supplier | 12 | 12 | Purchase management |
| Dashboard | 7 | 7 | Analytics & insights |
| **TOTAL** | **42** | **42** | **100% Pass Rate** |

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] Database has 3 new tables (suppliers, purchases, purchase_items)
- [ ] Backend shows new API endpoints
- [ ] Purchase test suite: 12/12 passed
- [ ] Dashboard test suite: 7/7 passed
- [ ] Total: 42/42 tests passed (100%)
- [ ] Can create suppliers via API
- [ ] Can create purchases via API
- [ ] Dashboard shows correct metrics
- [ ] ITC calculation works correctly

---

## 🎉 All Tests Passing?

Congratulations! Week 5-6 implementation is complete! 🚀

You now have:
- ✅ Complete purchase tracking
- ✅ ITC calculation
- ✅ Net tax payable calculation
- ✅ Business dashboard
- ✅ GST deadline tracking

**Next:** Week 7-8 will add GSTR-1 and GSTR-3B generation! 📄

---

## 📞 Need Help?

1. Check `WEEK-5-6-COMPLETE.md` for detailed documentation
2. Check `WEEK-5-6-SUMMARY.md` for quick reference
3. Review service files for JSDoc comments
4. Check Prisma Studio for database state

Happy Testing! 🧪✨
