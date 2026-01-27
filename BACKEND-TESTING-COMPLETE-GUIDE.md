# GST Compliance SaaS - Complete Backend Testing Guide

**Version:** 1.0  
**Last Updated:** January 27, 2026  
**Backend Completion:** 90% (Weeks 2-12)

---

## 📋 Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Automated Testing (Recommended)](#automated-testing-recommended)
3. [Manual Testing with Postman](#manual-testing-with-postman)
4. [Complete API Reference](#complete-api-reference)
5. [Testing Workflows](#testing-workflows)
6. [Troubleshooting Guide](#troubleshooting-guide)

---

## 🚀 Pre-Testing Setup

### Prerequisites
- ✅ Docker Desktop installed and running
- ✅ Node.js 18+ installed
- ✅ PostgreSQL (via Docker)
- ✅ Redis (via Docker)
- ✅ Postman/Thunder Client (for manual testing)

### Step 1: Clone and Setup

```powershell
# Clone the repository
cd C:\Users\gupta\AI-SaaS-Project
git clone <your-repo-url> gst-compliance-saas
cd gst-compliance-saas

# Start Docker services
docker-compose up -d

# Wait 10 seconds for services to start
Start-Sleep -Seconds 10

# Verify Docker containers are running
docker-compose ps
```

**Expected Output:**
```
NAME                    STATUS
postgres-gst-saas       Up (healthy)
redis-gst-saas          Up (healthy)
```

### Step 2: Backend Setup

```powershell
cd backend

# Install dependencies
npm install

# Create .env file (if not exists)
Copy-Item env.example .env

# Generate JWT secret (if needed)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output and paste in .env as JWT_SECRET

# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Start backend server
npm run dev
```

**Expected Output:**
```
Server running on port 5000
✓ Database connected
✓ Redis connected
```

### Step 3: Verify Health

Open browser or Postman:
```
GET http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-27T10:30:00.000Z",
  "uptime": 123.456,
  "database": "connected",
  "redis": "connected"
}
```

---

## 🧪 Automated Testing (Recommended)

### Testing Order (Run in Sequence)

```powershell
cd C:\Users\gupta\AI-SaaS-Project\gst-compliance-saas\backend

# 1. Week 2: Authentication (7 tests)
node .\src\test-auth.js

# 2. Week 3-4: GST Calculator (15 tests)
node .\src\test-gst-calculator.js

# 3. Week 3-4: Customers & Invoices (8 tests)
node .\src\test-customer-invoice.js

# 4. Week 5-6: Purchases & Suppliers (12 tests)
node .\src\test-purchases-suppliers.js

# 5. Week 5-6: Dashboard (7 tests)
node .\src\test-dashboard.js

# 6. Week 7-8: GST Returns (6 tests)
node .\src\test-gstr-returns.js

# 7. Week 9-10: PDF & Email (7 tests)
node .\src\test-pdf-email.js
```

### Expected Results

| Test Suite | Tests | Expected Pass | Critical |
|------------|-------|---------------|----------|
| Authentication | 7 | 7/7 | ⭐⭐⭐ |
| GST Calculator | 15 | 15/15 | ⭐⭐⭐ |
| Customers & Invoices | 8 | 8/8 | ⭐⭐⭐ |
| Purchases & Suppliers | 12 | 12/12 | ⭐⭐ |
| Dashboard | 7 | 7/7 | ⭐⭐ |
| GST Returns | 6 | 6/6 | ⭐⭐⭐ |
| PDF & Email | 7 | 2-7/7 | ⭐ |
| **TOTAL** | **62** | **59-62/62** | - |

**Note:** PDF & Email tests 1-2 (PDF) will pass without email config. Tests 3-7 (email) require SMTP setup.

---

## 📬 Manual Testing with Postman

### Setup Postman Collection

1. **Create New Collection:** "GST SaaS Backend"
2. **Create Environment:** "Local Development"
3. **Add Variables:**
   - `base_url`: `http://localhost:5000`
   - `token`: (will be set after login)
   - `business_id`: (will be set after login)
   - `customer_id`: (will be set after customer creation)
   - `invoice_id`: (will be set after invoice creation)
   - `supplier_id`: (will be set after supplier creation)
   - `purchase_id`: (will be set after purchase creation)

---

## 🔗 Complete API Reference

### **Module 1: Authentication (Week 2)** ⭐⭐⭐ CRITICAL

#### 1.1 Register User
```http
POST {{base_url}}/api/auth/register
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "SecurePass123",
  "businessName": "ABC Traders Pvt Ltd",
  "gstin": "27AAPFU0939F1ZV",
  "pan": "AAPFU0939F",
  "state": "Maharashtra",
  "address": "123 Business Street, Mumbai",
  "phone": "9876543210"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "role": "owner"
  },
  "business": {
    "id": "uuid",
    "businessName": "ABC Traders Pvt Ltd",
    "gstin": "27AAPFU0939F1ZV",
    "stateCode": "27"
  }
}
```

**Postman Test Script:**
```javascript
// Save token and business_id
pm.environment.set("token", pm.response.json().token);
pm.environment.set("business_id", pm.response.json().business.id);

// Verify response
pm.test("Status is 201", function() {
    pm.response.to.have.status(201);
});
pm.test("Token is present", function() {
    pm.expect(pm.response.json().token).to.exist;
});
```

**Use Case:** First-time user registration with GST business details.

---

#### 1.2 Login User
```http
POST {{base_url}}/api/auth/login
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "SecurePass123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "role": "owner",
    "lastLogin": "2026-01-27T10:30:00.000Z"
  },
  "businesses": [
    {
      "id": "uuid",
      "businessName": "ABC Traders Pvt Ltd",
      "gstin": "27AAPFU0939F1ZV"
    }
  ]
}
```

**Postman Test Script:**
```javascript
pm.environment.set("token", pm.response.json().token);
pm.environment.set("business_id", pm.response.json().businesses[0].id);
```

**Use Case:** Existing user login to access the system.

---

#### 1.3 Get User Profile (Protected)
```http
GET {{base_url}}/api/auth/me
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "role": "owner",
    "emailVerified": false,
    "isActive": true,
    "createdAt": "2026-01-27T10:00:00.000Z",
    "businesses": [
      {
        "id": "uuid",
        "businessName": "ABC Traders Pvt Ltd",
        "gstin": "27AAPFU0939F1ZV"
      }
    ]
  }
}
```

**Use Case:** Get current logged-in user details.

---

#### 1.4 Change Password (Protected)
```http
POST {{base_url}}/api/auth/change-password
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "currentPassword": "SecurePass123",
  "newPassword": "NewSecurePass456"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Use Case:** User wants to update their password.

---

#### 1.5 Logout (Protected)
```http
POST {{base_url}}/api/auth/logout
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Use Case:** User wants to log out (clears session/token).

---

### **Module 2: Customer Management (Week 3-4)** ⭐⭐⭐ CRITICAL

#### 2.1 Create Customer (B2B)
```http
POST {{base_url}}/api/customers
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "customerName": "XYZ Corp Pvt Ltd",
  "gstin": "29ABCDE1234F1Z5",
  "pan": "ABCDE1234F",
  "customerType": "b2b",
  "billingAddress": "456 Customer Street",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001",
  "email": "contact@xyzcorp.com",
  "phone": "9876543210"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Customer created successfully",
  "customer": {
    "id": "uuid",
    "customerName": "XYZ Corp Pvt Ltd",
    "gstin": "29ABCDE1234F1Z5",
    "stateCode": "29",
    "customerType": "b2b",
    "billingAddress": "456 Customer Street",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001",
    "email": "contact@xyzcorp.com",
    "phone": "9876543210",
    "createdAt": "2026-01-27T10:30:00.000Z"
  }
}
```

**Postman Test Script:**
```javascript
pm.environment.set("customer_id", pm.response.json().customer.id);
```

**Use Case:** Add a new B2B customer with GSTIN for invoicing.

---

#### 2.2 Create Customer (B2C - No GSTIN)
```http
POST {{base_url}}/api/customers
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "customerName": "John Doe",
  "customerType": "b2c",
  "billingAddress": "789 Residential Area",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "phone": "9123456789"
}
```

**Use Case:** Add a retail customer without GSTIN.

---

#### 2.3 Get All Customers (Paginated)
```http
GET {{base_url}}/api/customers?page=1&limit=20&search=XYZ
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "customers": [
    {
      "id": "uuid",
      "customerName": "XYZ Corp Pvt Ltd",
      "gstin": "29ABCDE1234F1Z5",
      "customerType": "b2b",
      "city": "Bangalore",
      "state": "Karnataka",
      "phone": "9876543210",
      "createdAt": "2026-01-27T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

**Use Case:** List all customers with search and pagination.

---

#### 2.4 Get Customer by ID
```http
GET {{base_url}}/api/customers/{{customer_id}}
Authorization: Bearer {{token}}
```

**Use Case:** Get detailed information about a specific customer.

---

#### 2.5 Update Customer
```http
PUT {{base_url}}/api/customers/{{customer_id}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "phone": "9999888877",
  "email": "newemail@xyzcorp.com"
}
```

**Use Case:** Update customer contact information.

---

#### 2.6 Delete Customer (Soft Delete)
```http
DELETE {{base_url}}/api/customers/{{customer_id}}
Authorization: Bearer {{token}}
```

**Use Case:** Remove a customer (marks as inactive, doesn't delete).

---

#### 2.7 Get Customer Statistics
```http
GET {{base_url}}/api/customers/stats
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "stats": {
    "total": 50,
    "b2b": 35,
    "b2c": 10,
    "export": 5,
    "sez": 0
  }
}
```

**Use Case:** Get overview of customer distribution by type.

---

### **Module 3: Invoice Management (Week 3-4)** ⭐⭐⭐ CRITICAL

#### 3.1 Create Invoice (Inter-State → IGST)
```http
POST {{base_url}}/api/invoices
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "customerId": "{{customer_id}}",
  "invoiceDate": "2026-01-27",
  "items": [
    {
      "itemName": "Laptop Dell Inspiron",
      "description": "15 inch, 16GB RAM, 512GB SSD",
      "hsnCode": "84713000",
      "quantity": 2,
      "unit": "NOS",
      "unitPrice": 45000,
      "gstRate": 18,
      "cessRate": 0
    },
    {
      "itemName": "Wireless Mouse",
      "hsnCode": "84716060",
      "quantity": 5,
      "unit": "NOS",
      "unitPrice": 500,
      "gstRate": 18,
      "cessRate": 0
    }
  ],
  "notes": "Payment terms: 30 days",
  "termsAndConditions": "Late payment charges apply after due date"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "invoice": {
    "id": "uuid",
    "invoiceNumber": "INV-202601-0001",
    "invoiceDate": "2026-01-27",
    "invoiceType": "b2b",
    "subtotal": 92500.00,
    "discountAmount": 0.00,
    "taxableAmount": 92500.00,
    "cgstAmount": 0.00,
    "sgstAmount": 0.00,
    "igstAmount": 16650.00,
    "cessAmount": 0.00,
    "totalTaxAmount": 16650.00,
    "totalAmount": 109150.00,
    "customer": {
      "customerName": "XYZ Corp Pvt Ltd",
      "gstin": "29ABCDE1234F1Z5",
      "billingAddress": "456 Customer Street",
      "city": "Bangalore",
      "state": "Karnataka"
    },
    "items": [
      {
        "itemName": "Laptop Dell Inspiron",
        "hsnCode": "84713000",
        "quantity": 2,
        "unitPrice": 45000.00,
        "taxableAmount": 90000.00,
        "gstRate": 18,
        "igstRate": 18,
        "igstAmount": 16200.00,
        "totalAmount": 106200.00
      },
      {
        "itemName": "Wireless Mouse",
        "hsnCode": "84716060",
        "quantity": 5,
        "unitPrice": 500.00,
        "taxableAmount": 2500.00,
        "gstRate": 18,
        "igstRate": 18,
        "igstAmount": 450.00,
        "totalAmount": 2950.00
      }
    ]
  }
}
```

**Postman Test Script:**
```javascript
pm.environment.set("invoice_id", pm.response.json().invoice.id);

// Verify GST calculation (Inter-state: IGST only)
pm.test("IGST calculated correctly", function() {
    var invoice = pm.response.json().invoice;
    pm.expect(invoice.cgstAmount).to.equal(0);
    pm.expect(invoice.sgstAmount).to.equal(0);
    pm.expect(invoice.igstAmount).to.be.above(0);
});
```

**Use Case:** Create invoice for inter-state sale (seller in Maharashtra, buyer in Karnataka).

---

#### 3.2 Create Invoice (Intra-State → CGST+SGST)
```http
POST {{base_url}}/api/invoices
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "customerId": "{{customer_id_same_state}}",
  "invoiceDate": "2026-01-27",
  "items": [
    {
      "itemName": "Office Chair",
      "hsnCode": "94013000",
      "quantity": 10,
      "unit": "NOS",
      "unitPrice": 3000,
      "gstRate": 18,
      "cessRate": 0
    }
  ]
}
```

**Expected GST Split:**
- CGST: 9% (₹2,700)
- SGST: 9% (₹2,700)
- IGST: 0%

**Use Case:** Create invoice for intra-state sale (both in Maharashtra).

---

#### 3.3 Get All Invoices (With Filters)
```http
GET {{base_url}}/api/invoices?page=1&limit=20&startDate=2026-01-01&endDate=2026-01-31&invoiceType=b2b
Authorization: Bearer {{token}}
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `search`: Search by invoice number
- `invoiceType`: b2b, b2c, export, sez
- `customerId`: Filter by customer
- `startDate`: Filter by date (YYYY-MM-DD)
- `endDate`: Filter by date (YYYY-MM-DD)
- `filedInGstr1`: true/false

**Use Case:** List invoices with filters for reporting.

---

#### 3.4 Get Invoice by ID
```http
GET {{base_url}}/api/invoices/{{invoice_id}}
Authorization: Bearer {{token}}
```

**Use Case:** Get detailed invoice with line items.

---

#### 3.5 Update Invoice
```http
PUT {{base_url}}/api/invoices/{{invoice_id}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "notes": "Updated payment terms: 15 days",
  "isPaid": true,
  "paymentDate": "2026-01-30",
  "paymentMethod": "bank_transfer"
}
```

**Use Case:** Update invoice payment status and notes.

---

#### 3.6 Delete Invoice (Soft Delete)
```http
DELETE {{base_url}}/api/invoices/{{invoice_id}}
Authorization: Bearer {{token}}
```

**Use Case:** Cancel/remove an invoice (can't delete if filed in GSTR-1).

---

#### 3.7 Get Invoice Statistics
```http
GET {{base_url}}/api/invoices/stats?month=1&year=2026
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalInvoices": 45,
    "totalAmount": 2500000.00,
    "totalTax": 450000.00,
    "avgInvoiceValue": 55555.56,
    "paidInvoices": 30,
    "unpaidInvoices": 15
  }
}
```

**Use Case:** Get invoice summary for a specific month.

---

### **Module 4: PDF & Email (Week 9-10)** ⭐⭐

#### 4.1 Generate Invoice PDF
```http
POST {{base_url}}/api/invoices/{{invoice_id}}/generate-pdf
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "PDF generated successfully",
  "invoiceId": "uuid",
  "pdfPath": "backend/invoices/INV-202601-0001.pdf",
  "pdfGenerated": true,
  "generatedAt": "2026-01-27T10:30:00.000Z"
}
```

**Use Case:** Generate GST-compliant PDF invoice for printing/sharing.

---

#### 4.2 Download Invoice PDF
```http
GET {{base_url}}/api/invoices/{{invoice_id}}/download-pdf
Authorization: Bearer {{token}}
```

**Expected Response (200):**
- Content-Type: application/pdf
- File download stream

**Use Case:** Download generated PDF invoice.

---

#### 4.3 Send Invoice via Email
```http
POST {{base_url}}/api/invoices/{{invoice_id}}/send-email
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "recipient": "customer@example.com",
  "subject": "Invoice INV-202601-0001 from ABC Traders",
  "message": "Please find attached your invoice. Payment due in 30 days."
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Invoice email sent successfully",
  "emailSent": true,
  "recipient": "customer@example.com",
  "sentAt": "2026-01-27T10:30:00.000Z"
}
```

**Use Case:** Email invoice PDF to customer.

---

#### 4.4 Verify Email Configuration
```http
GET {{base_url}}/api/invoices/verify-email-config
Authorization: Bearer {{token}}
```

**Use Case:** Check if email service is properly configured.

---

#### 4.5 Test Email Service
```http
POST {{base_url}}/api/invoices/test-email
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "recipient": "test@example.com"
}
```

**Use Case:** Send a test email to verify SMTP configuration.

---

### **Module 5: Supplier Management (Week 5-6)** ⭐⭐

#### 5.1 Create Supplier (Registered with GSTIN)
```http
POST {{base_url}}/api/suppliers
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "supplierName": "TechCorp Supplies Pvt Ltd",
  "gstin": "29ABCDE1234F1Z5",
  "pan": "ABCDE1234F",
  "supplierType": "registered",
  "billingAddress": "789 Supplier Road",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001",
  "email": "sales@techcorp.com",
  "phone": "9876543210"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Supplier created successfully",
  "supplier": {
    "id": "uuid",
    "supplierName": "TechCorp Supplies Pvt Ltd",
    "gstin": "29ABCDE1234F1Z5",
    "stateCode": "29",
    "supplierType": "registered",
    "billingAddress": "789 Supplier Road",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001",
    "email": "sales@techcorp.com",
    "phone": "9876543210"
  }
}
```

**Postman Test Script:**
```javascript
pm.environment.set("supplier_id", pm.response.json().supplier.id);
```

**Use Case:** Add a GST-registered supplier for purchase tracking.

---

#### 5.2 Create Unregistered Supplier (No GSTIN)
```http
POST {{base_url}}/api/suppliers
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "supplierName": "Local Vendor",
  "supplierType": "unregistered",
  "billingAddress": "123 Market Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "phone": "9123456789"
}
```

**Use Case:** Add an unregistered supplier (small vendor).

---

#### 5.3 Get All Suppliers
```http
GET {{base_url}}/api/suppliers?page=1&limit=20
Authorization: Bearer {{token}}
```

**Use Case:** List all suppliers with pagination.

---

#### 5.4 Get Supplier by ID
```http
GET {{base_url}}/api/suppliers/{{supplier_id}}
Authorization: Bearer {{token}}
```

**Use Case:** Get detailed supplier information.

---

#### 5.5 Update Supplier
```http
PUT {{base_url}}/api/suppliers/{{supplier_id}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "phone": "9999888877",
  "email": "newsales@techcorp.com"
}
```

**Use Case:** Update supplier contact details.

---

#### 5.6 Delete Supplier
```http
DELETE {{base_url}}/api/suppliers/{{supplier_id}}
Authorization: Bearer {{token}}
```

**Use Case:** Remove a supplier (soft delete).

---

#### 5.7 Get Supplier Statistics
```http
GET {{base_url}}/api/suppliers/stats
Authorization: Bearer {{token}}
```

**Use Case:** Get supplier count by type (registered/unregistered).

---

### **Module 6: Purchase Invoice Management (Week 5-6)** ⭐⭐⭐ CRITICAL

#### 6.1 Create Purchase Invoice (With ITC)
```http
POST {{base_url}}/api/purchases
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "supplierId": "{{supplier_id}}",
  "supplierInvoiceNumber": "SUPP/2026/001",
  "supplierInvoiceDate": "2026-01-25",
  "purchaseType": "goods",
  "isItcEligible": true,
  "items": [
    {
      "itemName": "Raw Material - Steel",
      "hsnCode": "72101100",
      "quantity": 100,
      "unit": "KG",
      "unitPrice": 80,
      "gstRate": 18,
      "cessRate": 0
    }
  ],
  "notes": "Purchase for manufacturing"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Purchase invoice created successfully",
  "purchase": {
    "id": "uuid",
    "supplierInvoiceNumber": "SUPP/2026/001",
    "supplierInvoiceDate": "2026-01-25",
    "purchaseType": "goods",
    "subtotal": 8000.00,
    "taxableAmount": 8000.00,
    "cgstAmount": 720.00,
    "sgstAmount": 720.00,
    "igstAmount": 0.00,
    "totalTaxAmount": 1440.00,
    "totalAmount": 9440.00,
    "isItcEligible": true,
    "itcAmount": 1440.00,
    "supplier": {
      "supplierName": "TechCorp Supplies Pvt Ltd",
      "gstin": "29ABCDE1234F1Z5"
    },
    "items": [
      {
        "itemName": "Raw Material - Steel",
        "hsnCode": "72101100",
        "quantity": 100,
        "unitPrice": 80.00,
        "taxableAmount": 8000.00,
        "gstRate": 18,
        "cgstAmount": 720.00,
        "sgstAmount": 720.00,
        "itcAmount": 1440.00
      }
    ]
  }
}
```

**Postman Test Script:**
```javascript
pm.environment.set("purchase_id", pm.response.json().purchase.id);

// Verify ITC calculation
pm.test("ITC calculated correctly", function() {
    var purchase = pm.response.json().purchase;
    pm.expect(purchase.itcAmount).to.equal(purchase.totalTaxAmount);
});
```

**Use Case:** Record purchase invoice and claim Input Tax Credit (ITC).

---

#### 6.2 Get All Purchases
```http
GET {{base_url}}/api/purchases?page=1&limit=20&startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer {{token}}
```

**Use Case:** List all purchases with filters.

---

#### 6.3 Get Purchase by ID
```http
GET {{base_url}}/api/purchases/{{purchase_id}}
Authorization: Bearer {{token}}
```

**Use Case:** Get detailed purchase invoice with items.

---

#### 6.4 Update Purchase (Mark as Paid)
```http
PUT {{base_url}}/api/purchases/{{purchase_id}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "isPaid": true,
  "paymentDate": "2026-01-30",
  "paymentMethod": "bank_transfer",
  "notes": "Payment completed via NEFT"
}
```

**Use Case:** Update payment status for a purchase.

---

#### 6.5 Delete Purchase
```http
DELETE {{base_url}}/api/purchases/{{purchase_id}}
Authorization: Bearer {{token}}
```

**Use Case:** Remove a purchase invoice (can't delete if filed in GSTR-2).

---

#### 6.6 Get Purchase Statistics
```http
GET {{base_url}}/api/purchases/stats?month=1&year=2026
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalPurchases": 30,
    "totalPurchaseAmount": 500000.00,
    "totalItcAvailable": 90000.00,
    "eligibleItcPurchases": 25,
    "paidPurchases": 20,
    "unpaidPurchases": 10
  }
}
```

**Use Case:** Get purchase summary for a month.

---

#### 6.7 Calculate ITC for Period
```http
GET {{base_url}}/api/purchases/itc/2026/1
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "period": "2026-01",
  "itcBreakdown": {
    "totalItc": 90000.00,
    "cgstItc": 40000.00,
    "sgstItc": 40000.00,
    "igstItc": 10000.00,
    "cessItc": 0.00
  },
  "eligiblePurchases": 25,
  "ineligiblePurchases": 5
}
```

**Use Case:** Calculate total ITC available for a month (needed for GSTR-3B).

---

### **Module 7: Dashboard & Analytics (Week 5-6)** ⭐⭐

#### 7.1 Get Dashboard Overview
```http
GET {{base_url}}/api/dashboard/overview?month=1&year=2026
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "overview": {
    "period": "January 2026",
    "revenue": 2500000.00,
    "expenses": 800000.00,
    "profit": 1700000.00,
    "outputTax": 450000.00,
    "inputTaxCredit": 144000.00,
    "netTaxPayable": 306000.00,
    "totalInvoices": 45,
    "totalPurchases": 30,
    "totalCustomers": 50,
    "totalSuppliers": 20,
    "unpaidInvoices": 15,
    "unpaidPurchases": 10
  }
}
```

**Use Case:** Get monthly business summary for dashboard.

---

#### 7.2 Get Top Customers
```http
GET {{base_url}}/api/dashboard/top-customers?month=1&year=2026&limit=10
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "topCustomers": [
    {
      "customerId": "uuid",
      "customerName": "XYZ Corp Pvt Ltd",
      "totalRevenue": 500000.00,
      "invoiceCount": 10
    }
  ]
}
```

**Use Case:** Identify top revenue-generating customers.

---

#### 7.3 Get Top Suppliers
```http
GET {{base_url}}/api/dashboard/top-suppliers?month=1&year=2026&limit=10
Authorization: Bearer {{token}}
```

**Use Case:** Identify top suppliers by expenditure.

---

#### 7.4 Get Revenue Trend (6 Months)
```http
GET {{base_url}}/api/dashboard/revenue-trend
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "trend": [
    {
      "month": "2025-08",
      "revenue": 2000000.00,
      "expenses": 700000.00,
      "profit": 1300000.00
    },
    {
      "month": "2025-09",
      "revenue": 2200000.00,
      "expenses": 750000.00,
      "profit": 1450000.00
    }
    // ... more months
  ]
}
```

**Use Case:** Show revenue trend chart for last 6 months.

---

#### 7.5 Get GST Filing Deadlines
```http
GET {{base_url}}/api/dashboard/deadlines
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "deadlines": [
    {
      "returnType": "GSTR-1",
      "period": "January 2026",
      "deadline": "2026-02-11",
      "daysRemaining": 15,
      "status": "pending"
    },
    {
      "returnType": "GSTR-3B",
      "period": "January 2026",
      "deadline": "2026-02-20",
      "daysRemaining": 24,
      "status": "pending"
    }
  ]
}
```

**Use Case:** Show upcoming GST return filing deadlines.

---

#### 7.6 Get Quick Stats
```http
GET {{base_url}}/api/dashboard/quick-stats
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "stats": {
    "todayRevenue": 50000.00,
    "todayExpenses": 15000.00,
    "monthRevenue": 2500000.00,
    "monthExpenses": 800000.00,
    "outstandingReceivables": 500000.00,
    "outstandingPayables": 200000.00
  }
}
```

**Use Case:** Display key metrics on dashboard cards.

---

### **Module 8: GST Return Generation (Week 7-8)** ⭐⭐⭐ CRITICAL

#### 8.1 Generate GSTR-1 (Sales Return)
```http
POST {{base_url}}/api/gstr1/generate
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "month": 1,
  "year": 2026
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "GSTR-1 generated successfully",
  "gstr1": {
    "id": "uuid",
    "returnType": "GSTR-1",
    "filingMonth": "2026-01",
    "status": "draft",
    "returnData": {
      "gstin": "27AAPFU0939F1ZV",
      "fp": "012026",
      "b2b": [
        {
          "ctin": "29ABCDE1234F1Z5",
          "inv": [
            {
              "inum": "INV-202601-0001",
              "idt": "27-01-2026",
              "val": 109150.00,
              "pos": "29",
              "rchrg": "N",
              "inv_typ": "R",
              "itms": [
                {
                  "num": 1,
                  "itm_det": {
                    "rt": 18,
                    "txval": 92500.00,
                    "iamt": 16650.00,
                    "camt": 0,
                    "samt": 0,
                    "csamt": 0
                  }
                }
              ]
            }
          ]
        }
      ],
      "b2cl": [],
      "b2cs": [],
      "exp": [],
      "hsn": {
        "data": [
          {
            "hsn_sc": "84713000",
            "desc": "Laptops",
            "uqc": "NOS",
            "qty": 2,
            "val": 90000.00,
            "txval": 90000.00,
            "iamt": 16200.00,
            "camt": 0,
            "samt": 0,
            "csamt": 0
          }
        ]
      }
    },
    "summary": {
      "totalInvoices": 45,
      "totalTaxableValue": 2500000.00,
      "totalIgst": 200000.00,
      "totalCgst": 150000.00,
      "totalSgst": 150000.00,
      "totalCess": 0
    },
    "generatedAt": "2026-01-27T10:30:00.000Z"
  }
}
```

**Use Case:** Auto-generate GSTR-1 from all invoices for the month.

---

#### 8.2 Get GSTR-1
```http
GET {{base_url}}/api/gstr1/2026/1
Authorization: Bearer {{token}}
```

**Use Case:** Retrieve previously generated GSTR-1 for a period.

---

#### 8.3 Export GSTR-1 as JSON
```http
GET {{base_url}}/api/gstr1/2026/1/export/json
Authorization: Bearer {{token}}
```

**Expected Response (200):**
- Content-Type: application/json
- File download: GSTR1_27AAPFU0939F1ZV_202601.json

**Use Case:** Download GSTR-1 JSON file for uploading to GST Portal.

---

#### 8.4 Generate GSTR-3B (Summary Return)
```http
POST {{base_url}}/api/gstr3b/generate
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "month": 1,
  "year": 2026
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "GSTR-3B generated successfully",
  "gstr3b": {
    "id": "uuid",
    "returnType": "GSTR-3B",
    "filingMonth": "2026-01",
    "status": "draft",
    "returnData": {
      "gstin": "27AAPFU0939F1ZV",
      "ret_period": "012026",
      "sup_details": {
        "osup_det": {
          "txval": 2500000.00,
          "iamt": 200000.00,
          "camt": 150000.00,
          "samt": 150000.00,
          "csamt": 0
        }
      },
      "inter_sup": {
        "unreg_details": [],
        "comp_details": [],
        "uin_details": []
      },
      "itc_elg": {
        "itc_avl": [
          {
            "ty": "IMPG",
            "iamt": 10000.00,
            "camt": 40000.00,
            "samt": 40000.00,
            "csamt": 0
          }
        ],
        "itc_rev": [],
        "itc_net": {
          "iamt": 10000.00,
          "camt": 40000.00,
          "samt": 40000.00,
          "csamt": 0
        }
      },
      "inward_sup": {
        "isup_details": []
      },
      "tax_pay": {
        "other_amt": {
          "iamt": 190000.00,
          "camt": 110000.00,
          "samt": 110000.00,
          "csamt": 0
        }
      },
      "interest": {
        "intr_details": {}
      }
    },
    "summary": {
      "outputTax": {
        "igst": 200000.00,
        "cgst": 150000.00,
        "sgst": 150000.00,
        "cess": 0,
        "total": 500000.00
      },
      "inputTaxCredit": {
        "igst": 10000.00,
        "cgst": 40000.00,
        "sgst": 40000.00,
        "cess": 0,
        "total": 90000.00
      },
      "netTaxPayable": {
        "igst": 190000.00,
        "cgst": 110000.00,
        "sgst": 110000.00,
        "cess": 0,
        "total": 410000.00
      }
    },
    "generatedAt": "2026-01-27T10:30:00.000Z"
  }
}
```

**Use Case:** Auto-generate GSTR-3B summary return (Output Tax - ITC = Net Payable).

---

#### 8.5 Get GSTR-3B
```http
GET {{base_url}}/api/gstr3b/2026/1
Authorization: Bearer {{token}}
```

**Use Case:** Retrieve previously generated GSTR-3B for a period.

---

#### 8.6 Export GSTR-3B as JSON
```http
GET {{base_url}}/api/gstr3b/2026/1/export/json
Authorization: Bearer {{token}}
```

**Use Case:** Download GSTR-3B JSON for uploading to GST Portal.

---

### **Module 9: Subscription & Payments (Week 11-12)** ⭐

#### 9.1 Get Subscription Plans
```http
GET {{base_url}}/api/subscriptions/plans
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "plans": [
    {
      "id": "trial",
      "name": "Trial",
      "price": 0,
      "duration": 14,
      "limits": {
        "invoices": 10,
        "customers": 5,
        "suppliers": 5
      }
    },
    {
      "id": "starter",
      "name": "Starter",
      "price": 999,
      "duration": 30,
      "limits": {
        "invoices": 100,
        "customers": 50,
        "suppliers": 20
      }
    }
  ]
}
```

**Use Case:** Display available subscription plans to user.

---

#### 9.2 Get Current Subscription Status
```http
GET {{base_url}}/api/subscriptions/status
Authorization: Bearer {{token}}
```

**Use Case:** Check current plan, usage, and expiry.

---

#### 9.3 Create Payment Order (Razorpay)
```http
POST {{base_url}}/api/payments/create-order
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "planId": "starter",
  "billingCycle": "monthly"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "order": {
    "orderId": "order_MNOPxyz123",
    "amount": 117882,
    "currency": "INR",
    "planId": "starter",
    "receipt": "receipt_starter_uuid"
  },
  "razorpayKeyId": "rzp_test_xxxxx"
}
```

**Use Case:** Create Razorpay order for subscription payment.

---

#### 9.4 Verify Payment
```http
POST {{base_url}}/api/payments/verify
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "orderId": "order_MNOPxyz123",
  "paymentId": "pay_ABCxyz456",
  "signature": "signature_hash"
}
```

**Use Case:** Verify Razorpay payment after successful transaction.

---

---

## 🔄 Testing Workflows

### Workflow 1: Complete Sales Cycle (End-to-End)

```
1. Register/Login → Get auth token
   POST /api/auth/register or /api/auth/login

2. Create Customer (B2B)
   POST /api/customers

3. Create Invoice for Customer
   POST /api/invoices
   (Automatic GST calculation happens here)

4. Generate Invoice PDF
   POST /api/invoices/{id}/generate-pdf

5. Send Invoice via Email
   POST /api/invoices/{id}/send-email

6. Mark Invoice as Paid
   PUT /api/invoices/{id}
   { "isPaid": true, "paymentDate": "2026-01-30" }

7. Verify in Dashboard
   GET /api/dashboard/overview
```

**Expected Time:** 5-7 minutes

---

### Workflow 2: Complete Purchase Cycle (ITC Tracking)

```
1. Login → Get auth token
   POST /api/auth/login

2. Create Supplier
   POST /api/suppliers

3. Create Purchase Invoice
   POST /api/purchases
   (ITC automatically calculated)

4. View ITC Summary
   GET /api/purchases/itc/2026/1

5. Mark Purchase as Paid
   PUT /api/purchases/{id}
   { "isPaid": true }

6. Verify in Dashboard
   GET /api/dashboard/overview
   (Check "inputTaxCredit" and "netTaxPayable")
```

**Expected Time:** 5 minutes

---

### Workflow 3: GST Return Filing

```
1. Login → Get auth token
   POST /api/auth/login

2. Create Multiple Invoices (Sales)
   POST /api/invoices
   (Create 5-10 invoices for testing)

3. Create Multiple Purchases
   POST /api/purchases
   (Create 3-5 purchases for testing)

4. Generate GSTR-1 (Sales Return)
   POST /api/gstr1/generate
   { "month": 1, "year": 2026 }

5. Download GSTR-1 JSON
   GET /api/gstr1/2026/1/export/json

6. Generate GSTR-3B (Summary Return)
   POST /api/gstr3b/generate
   { "month": 1, "year": 2026 }

7. Download GSTR-3B JSON
   GET /api/gstr3b/2026/1/export/json

8. Verify Net Tax Payable
   Compare:
   - GSTR-1 total output tax
   - Purchase ITC
   - GSTR-3B net tax payable
   Formula: Output Tax - ITC = Net Payable
```

**Expected Time:** 10-15 minutes

---

### Workflow 4: Dashboard Analytics

```
1. Login → Get auth token

2. Get Monthly Overview
   GET /api/dashboard/overview?month=1&year=2026

3. Get Top Customers
   GET /api/dashboard/top-customers?limit=10

4. Get Top Suppliers
   GET /api/dashboard/top-suppliers?limit=10

5. Get Revenue Trend (6 months)
   GET /api/dashboard/revenue-trend

6. Get GST Deadlines
   GET /api/dashboard/deadlines

7. Get Quick Stats
   GET /api/dashboard/quick-stats
```

**Expected Time:** 3 minutes

---

## 🧪 Sample Postman Test Scripts

### Global Test Script (Add to Collection)

```javascript
// Parse response
const jsonData = pm.response.json();

// Common tests for all requests
pm.test("Response time is less than 2000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});

pm.test("Response has success field", function () {
    pm.expect(jsonData).to.have.property('success');
});

// If success=true, response should be 200/201
if (jsonData.success === true) {
    pm.test("Status code is 2xx", function () {
        pm.expect(pm.response.code).to.be.oneOf([200, 201]);
    });
}

// If success=false, response should be 4xx/5xx
if (jsonData.success === false) {
    pm.test("Status code is 4xx or 5xx", function () {
        pm.expect(pm.response.code).to.be.above(399);
    });
}

// Log errors for debugging
if (jsonData.success === false && jsonData.message) {
    console.log("API Error:", jsonData.message);
}
```

### Test Script for Invoice Creation

```javascript
const jsonData = pm.response.json();

pm.test("Invoice created successfully", function () {
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.invoice).to.exist;
});

pm.test("Invoice has valid number", function () {
    pm.expect(jsonData.invoice.invoiceNumber).to.match(/^INV-\d{6}-\d{4}$/);
});

pm.test("GST calculated correctly", function () {
    const invoice = jsonData.invoice;
    const totalTax = invoice.cgstAmount + invoice.sgstAmount + invoice.igstAmount + invoice.cessAmount;
    pm.expect(invoice.totalTaxAmount).to.equal(totalTax);
});

pm.test("Total amount is correct", function () {
    const invoice = jsonData.invoice;
    const expectedTotal = invoice.taxableAmount + invoice.totalTaxAmount - invoice.roundOffAmount;
    pm.expect(invoice.totalAmount).to.equal(expectedTotal);
});

// Save invoice ID for next requests
if (jsonData.success && jsonData.invoice) {
    pm.environment.set("invoice_id", jsonData.invoice.id);
    pm.environment.set("invoice_number", jsonData.invoice.invoiceNumber);
}
```

### Test Script for GST Return Generation

```javascript
const jsonData = pm.response.json();

pm.test("GSTR-1 generated successfully", function () {
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.gstr1).to.exist;
});

pm.test("GSTR-1 has return data", function () {
    pm.expect(jsonData.gstr1.returnData).to.exist;
    pm.expect(jsonData.gstr1.returnData.gstin).to.exist;
});

pm.test("B2B section exists", function () {
    pm.expect(jsonData.gstr1.returnData.b2b).to.be.an('array');
});

pm.test("HSN summary exists", function () {
    pm.expect(jsonData.gstr1.returnData.hsn).to.exist;
    pm.expect(jsonData.gstr1.returnData.hsn.data).to.be.an('array');
});

pm.test("Summary has tax totals", function () {
    const summary = jsonData.gstr1.summary;
    pm.expect(summary.totalIgst).to.be.a('number');
    pm.expect(summary.totalCgst).to.be.a('number');
    pm.expect(summary.totalSgst).to.be.a('number');
});

// Save return ID
if (jsonData.success && jsonData.gstr1) {
    pm.environment.set("gstr1_id", jsonData.gstr1.id);
}
```

---

## 🐛 Troubleshooting Guide

### Issue 1: "Cannot connect to database"

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```powershell
# Check Docker is running
docker ps

# If not running, start Docker containers
docker-compose down
docker-compose up -d

# Wait 10 seconds
Start-Sleep -Seconds 10

# Restart backend
npm run dev
```

---

### Issue 2: "JWT token expired"

**Symptoms:**
```json
{
  "success": false,
  "message": "Token expired"
}
```

**Solution:**
```
1. Login again to get a new token
   POST /api/auth/login

2. Update token in Postman environment
   Copy new token → Set as {{token}}

3. Retry the failed request
```

---

### Issue 3: "Invalid GSTIN format"

**Symptoms:**
```json
{
  "success": false,
  "message": "Invalid GSTIN: Checksum mismatch"
}
```

**Solution:**
```
Use a valid test GSTIN:
- Maharashtra: 27AAPFU0939F1ZV
- Karnataka: 29ABCDE1234F1Z5
- Delhi: 07ABCDE1234F1Z5

Format: XX YYYYYYYYYY Y Z
- XX: State code (2 digits)
- YYYYYYYYYY: PAN (10 chars)
- Y: Entity number (1 digit)
- Z: Checksum (1 char)
```

---

### Issue 4: "No active business found"

**Symptoms:**
```json
{
  "success": false,
  "message": "No active business found"
}
```

**Solution:**
```
This means the user doesn't have a business associated.

1. Logout and re-register:
   POST /api/auth/register
   (This creates user + business together)

OR

2. Check database:
   npx prisma studio
   → Go to "businesses" table
   → Verify "is_active" = true
   → Verify "user_id" matches your user
```

---

### Issue 5: "Missing required fields: businessId"

**Symptoms:**
```json
{
  "success": false,
  "message": "Missing required fields: businessId, customerId..."
}
```

**Solution:**
```
This error was fixed in recent updates.

1. Pull latest code:
   git pull origin main

2. Restart backend:
   npm run dev

3. Retry the request

If still failing, check:
- Authorization header is set
- Token is valid (not expired)
```

---

### Issue 6: "Taxable amount must be a positive number"

**Symptoms:**
```json
{
  "success": false,
  "message": "Taxable amount must be a positive number"
}
```

**Solution:**
```
Check your request body:

1. Ensure quantity > 0
2. Ensure unitPrice > 0
3. Ensure both are numbers, not strings

Correct format:
{
  "items": [
    {
      "quantity": 10,      ← Number, not "10"
      "unitPrice": 500     ← Number, not "500"
    }
  ]
}
```

---

### Issue 7: Email tests failing

**Symptoms:**
```
❌ Test 3: Verify Email Configuration
   Failed: Email not configured
```

**Solution:**
```
Email tests require SMTP configuration in .env:

1. Open backend\.env

2. Add email settings:
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your.email@gmail.com
   SMTP_PASSWORD=your_app_password
   EMAIL_FROM=your.email@gmail.com
   EMAIL_FROM_NAME=Your Business Name

3. Get Gmail App Password:
   https://myaccount.google.com/apppasswords

4. Restart backend:
   npm run dev

5. Retry email tests
```

---

### Issue 8: PDF not generating

**Symptoms:**
```
❌ PDF generated but file not found on disk
```

**Solution:**
```powershell
# Check if invoices directory exists
cd backend
Get-ChildItem invoices

# If not exists, create it
New-Item -ItemType Directory -Path invoices

# Restart backend
npm run dev

# Retry PDF generation
```

---

## ✅ Success Criteria

### Minimum Viable Testing (Essential)

Must pass for production-ready backend:

| Test | Must Pass |
|------|-----------|
| Authentication (7 tests) | ✅ 7/7 |
| GST Calculator (15 tests) | ✅ 15/15 |
| Customers & Invoices (8 tests) | ✅ 8/8 |
| GST Returns (6 tests) | ✅ 6/6 |
| **TOTAL** | **36/36** |

### Full Testing (Recommended)

All features working:

| Test | Target |
|------|--------|
| Authentication | ✅ 7/7 |
| GST Calculator | ✅ 15/15 |
| Customers & Invoices | ✅ 8/8 |
| Purchases & Suppliers | ✅ 12/12 |
| Dashboard | ✅ 7/7 |
| GST Returns | ✅ 6/6 |
| PDF & Email | ✅ 7/7 |
| **TOTAL** | **62/62** |

---

## 📊 Testing Completion Checklist

### Phase 1: Setup (15 minutes)
- [ ] Docker containers running
- [ ] Backend server started
- [ ] Health check passing
- [ ] Prisma migrations applied
- [ ] Postman collection created

### Phase 2: Automated Tests (30 minutes)
- [ ] test-auth.js → 7/7 passing
- [ ] test-gst-calculator.js → 15/15 passing
- [ ] test-customer-invoice.js → 8/8 passing
- [ ] test-purchases-suppliers.js → 12/12 passing
- [ ] test-dashboard.js → 7/7 passing
- [ ] test-gstr-returns.js → 6/6 passing
- [ ] test-pdf-email.js → 2-7/7 passing

### Phase 3: Manual API Testing (45 minutes)
- [ ] All authentication endpoints tested
- [ ] Customer CRUD tested
- [ ] Invoice creation tested (inter-state + intra-state)
- [ ] Purchase creation tested (with ITC)
- [ ] Dashboard APIs tested
- [ ] GSTR-1 generation tested
- [ ] GSTR-3B generation tested
- [ ] PDF generation tested
- [ ] Email sending tested (optional)

### Phase 4: Workflow Testing (30 minutes)
- [ ] Complete sales cycle tested
- [ ] Complete purchase cycle tested
- [ ] GST return filing workflow tested
- [ ] Dashboard analytics tested

### Phase 5: Edge Case Testing (30 minutes)
- [ ] Invalid GSTIN handling
- [ ] Duplicate customer/invoice handling
- [ ] Zero GST rate (exempt items)
- [ ] Export invoice (0% GST)
- [ ] Cess calculation (luxury items)
- [ ] Token expiration handling
- [ ] Missing required fields handling

---

## 🎉 Completion Certificate

Once you complete all tests:

```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║     GST Compliance SaaS Backend                   ║
║        TESTING COMPLETED ✅                       ║
║                                                   ║
║  Total Tests: 62                                  ║
║  Tests Passed: 62                                 ║
║  Success Rate: 100%                               ║
║                                                   ║
║  Modules Tested:                                  ║
║  ✅ Authentication                                ║
║  ✅ GST Calculation                               ║
║  ✅ Customer & Invoice Management                 ║
║  ✅ Supplier & Purchase Management                ║
║  ✅ Dashboard & Analytics                         ║
║  ✅ GST Return Generation (GSTR-1/3B)             ║
║  ✅ PDF & Email Service                           ║
║                                                   ║
║  Backend is PRODUCTION READY! 🚀                  ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

## 📖 Additional Resources

- **API Documentation:** See Postman collection
- **Database Schema:** `docs/02-DATABASE-SCHEMA.md`
- **GST Integration Guide:** `docs/06-GST-INTEGRATION-GUIDE.md`
- **Development Workflow:** `DEVELOPMENT-WORKFLOW.md`
- **Troubleshooting:** `TESTING-GUIDE.md`

---

**Happy Testing! 🧪✨**

If you encounter any issues not covered in this guide, check the error logs in the backend console or refer to the specific module documentation.
