# GST Compliance SaaS - Database Schema Design

## Overview
This document defines the complete database schema for the GST Compliance SaaS platform. We're using **PostgreSQL** for its robustness, ACID compliance, and complex query support.

---

## 🗄️ Database Selection: PostgreSQL

### Why PostgreSQL?
- ✅ **ACID Compliance:** Critical for financial data
- ✅ **JSON Support:** Store GST return JSON data
- ✅ **Complex Queries:** Joins, aggregations for reports
- ✅ **Scalability:** Handles millions of records
- ✅ **Open Source:** No licensing costs
- ✅ **Mature Ecosystem:** ORMs (Sequelize, TypeORM, Prisma)

### Alternative Considered:
- **MySQL:** Good, but PostgreSQL has better JSON support
- **MongoDB:** Not suitable for financial transactions (NoSQL risks)

---

## 📐 Schema Design Principles

1. **Normalization:** 3NF for data integrity
2. **Soft Deletes:** Never physically delete financial records
3. **Audit Trail:** Track who changed what and when
4. **Indexing:** Optimize for common queries
5. **Data Types:** Use appropriate types (DECIMAL for money, not FLOAT)
6. **Constraints:** Foreign keys, NOT NULL, CHECK constraints

---

## 📊 Entity-Relationship Diagram (ERD)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   users      │───┬───│  businesses  │───┬───│  customers   │
└──────────────┘   │   └──────────────┘   │   └──────────────┘
                   │                      │
                   │                      │   ┌──────────────┐
                   │                      └───│  products    │
                   │                          └──────────────┘
                   │
                   │   ┌──────────────┐       ┌──────────────┐
                   ├───│  invoices    │───────│invoice_items │
                   │   └──────────────┘       └──────────────┘
                   │
                   │   ┌──────────────┐
                   ├───│subscriptions │
                   │   └──────────────┘
                   │
                   │   ┌──────────────┐
                   ├───│gstr_returns  │
                   │   └──────────────┘
                   │
                   │   ┌──────────────┐
                   └───│ audit_logs   │
                       └──────────────┘
```

---

## 📋 Table Definitions

### 1. **users** (Authentication & User Management)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    role VARCHAR(50) DEFAULT 'owner', -- owner, accountant, viewer (for multi-user)
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL -- Soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;
```

**GST Integration:** None (standard user table)

---

### 2. **businesses** (Business Profile & GST Configuration)

```sql
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Business Details
    business_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    business_type VARCHAR(50) NOT NULL, -- regular, composition, sez, export
    
    -- GST Details ✅ CRITICAL FOR GST
    gstin VARCHAR(15) UNIQUE NOT NULL, -- 15-digit GSTIN
    pan VARCHAR(10) NOT NULL, -- 10-digit PAN
    state_code VARCHAR(2) NOT NULL, -- First 2 digits of GSTIN
    registration_date DATE NOT NULL,
    
    -- Address
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL, -- Full state name
    pincode VARCHAR(6) NOT NULL,
    
    -- Contact
    email VARCHAR(255),
    phone VARCHAR(15),
    website VARCHAR(255),
    
    -- Bank Details (for invoices)
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(50),
    bank_ifsc VARCHAR(11),
    bank_branch VARCHAR(255),
    
    -- GST Filing Configuration ✅ GST RULES
    filing_frequency VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly
    financial_year_start VARCHAR(10) DEFAULT '04-01', -- MM-DD format
    
    -- Branding
    logo_url VARCHAR(500),
    
    -- Subscription
    subscription_plan VARCHAR(50) DEFAULT 'free_trial', -- free_trial, starter, professional, business
    subscription_status VARCHAR(50) DEFAULT 'active', -- active, expired, cancelled
    subscription_valid_until DATE,
    invoice_limit INT DEFAULT 100, -- Based on plan
    invoice_count_current_month INT DEFAULT 0,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_businesses_user ON businesses(user_id);
CREATE INDEX idx_businesses_gstin ON businesses(gstin);
CREATE INDEX idx_businesses_active ON businesses(is_active) WHERE deleted_at IS NULL;

-- Constraint: GSTIN must start with state_code
ALTER TABLE businesses ADD CONSTRAINT chk_gstin_format 
    CHECK (gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$');
```

**GST Integration Points:**
- `gstin`: Validate format, fetch details from GST API
- `state_code`: Used for CGST/SGST vs IGST calculation
- `filing_frequency`: Determines GSTR-1 frequency

---

### 3. **customers** (Customer/Buyer Master)

```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Customer Details
    customer_name VARCHAR(255) NOT NULL,
    customer_type VARCHAR(20) NOT NULL, -- b2b, b2c, export, sez
    
    -- GST Details ✅ GST REQUIRED
    gstin VARCHAR(15), -- NULL for B2C/unregistered
    pan VARCHAR(10),
    state VARCHAR(50) NOT NULL,
    state_code VARCHAR(2), -- Derived from GSTIN or manual
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    pincode VARCHAR(6),
    country VARCHAR(100) DEFAULT 'India', -- For exports
    
    -- Contact
    email VARCHAR(255),
    phone VARCHAR(15),
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_customers_business ON customers(business_id);
CREATE INDEX idx_customers_gstin ON customers(gstin);
CREATE INDEX idx_customers_active ON customers(is_active) WHERE deleted_at IS NULL;
```

**GST Integration:**
- `customer_type`: Determines invoice classification in GSTR-1
- `gstin`: Used for B2B invoice validation
- `state_code`: Used for CGST/SGST vs IGST calculation

---

### 4. **products** (Product/Service Master)

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Product Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    product_type VARCHAR(20) DEFAULT 'goods', -- goods, services
    
    -- GST Details ✅ CRITICAL FOR TAX CALCULATION
    hsn_sac_code VARCHAR(8) NOT NULL, -- 4-8 digit HSN/SAC code
    gst_rate DECIMAL(5,2) NOT NULL, -- e.g., 18.00 for 18%
    cess_rate DECIMAL(5,2) DEFAULT 0.00, -- Cess if applicable
    
    -- Pricing
    unit_of_measurement VARCHAR(50) DEFAULT 'PCS', -- PCS, KG, LTR, etc.
    default_price DECIMAL(15,2), -- Optional
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_products_business ON products(business_id);
CREATE INDEX idx_products_hsn ON products(hsn_sac_code);
CREATE INDEX idx_products_active ON products(is_active) WHERE deleted_at IS NULL;

-- Constraint: GST rate must be valid
ALTER TABLE products ADD CONSTRAINT chk_gst_rate 
    CHECK (gst_rate IN (0, 0.1, 0.25, 3, 5, 12, 18, 28));
```

**GST Integration:**
- `hsn_sac_code`: Mandatory for GST returns (HSN summary in GSTR-1)
- `gst_rate`: Used for tax calculation
- `cess_rate`: For products like tobacco, luxury cars

---

### 5. **invoices** (Sales & Purchase Invoices)

```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Invoice Details
    invoice_number VARCHAR(100) NOT NULL,
    invoice_type VARCHAR(20) NOT NULL, -- sales, purchase
    invoice_date DATE NOT NULL,
    due_date DATE,
    financial_year VARCHAR(10) NOT NULL, -- e.g., "2025-26"
    
    -- Customer/Supplier Details
    customer_id UUID REFERENCES customers(id), -- NULL if ad-hoc customer
    customer_name VARCHAR(255) NOT NULL,
    customer_gstin VARCHAR(15), -- NULL for B2C
    customer_state VARCHAR(50) NOT NULL,
    customer_state_code VARCHAR(2),
    
    -- Invoice Classification ✅ GST CRITICAL
    supply_type VARCHAR(20) NOT NULL, -- intra_state, inter_state
    transaction_type VARCHAR(50) NOT NULL, -- regular_b2b, regular_b2c, export_with_payment, export_without_payment, sez_with_payment, sez_without_payment, deemed_export
    place_of_supply VARCHAR(50) NOT NULL, -- State name or "Export"
    
    -- Amounts (all in INR)
    subtotal DECIMAL(15,2) NOT NULL, -- Sum of all line items before tax
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    taxable_amount DECIMAL(15,2) NOT NULL, -- After discount
    
    -- Tax Breakdown ✅ GST AMOUNTS
    cgst_amount DECIMAL(15,2) DEFAULT 0.00,
    sgst_amount DECIMAL(15,2) DEFAULT 0.00,
    igst_amount DECIMAL(15,2) DEFAULT 0.00,
    cess_amount DECIMAL(15,2) DEFAULT 0.00,
    total_tax DECIMAL(15,2) NOT NULL,
    
    -- Other Charges
    shipping_charges DECIMAL(15,2) DEFAULT 0.00,
    other_charges DECIMAL(15,2) DEFAULT 0.00,
    
    -- Final Amount
    total_amount DECIMAL(15,2) NOT NULL, -- taxable_amount + total_tax + shipping + other
    
    -- Payment Details
    payment_status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, partial, paid
    amount_paid DECIMAL(15,2) DEFAULT 0.00,
    payment_date DATE,
    
    -- Special Cases ✅ GST SCENARIOS
    is_reverse_charge BOOLEAN DEFAULT FALSE, -- RCM applicable
    is_export BOOLEAN DEFAULT FALSE,
    is_sez BOOLEAN DEFAULT FALSE,
    is_nil_rated BOOLEAN DEFAULT FALSE,
    is_exempted BOOLEAN DEFAULT FALSE,
    
    -- ITC (for purchase invoices)
    is_itc_eligible BOOLEAN DEFAULT TRUE, -- For purchases
    itc_claimed DECIMAL(15,2) DEFAULT 0.00,
    
    -- Document References
    invoice_file_url VARCHAR(500), -- PDF storage path
    notes TEXT,
    terms_and_conditions TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, finalized, cancelled
    is_filed_in_gstr1 BOOLEAN DEFAULT FALSE, -- Marked true after GSTR-1 generated
    gstr1_period VARCHAR(10), -- e.g., "2025-09" (YYYY-MM)
    
    -- Audit
    finalized_at TIMESTAMP,
    finalized_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_invoices_business ON invoices(business_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_number ON invoices(business_id, invoice_number);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_type ON invoices(invoice_type);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_gstr1 ON invoices(business_id, gstr1_period) WHERE is_filed_in_gstr1 = FALSE;

-- Unique constraint: Invoice number per business
CREATE UNIQUE INDEX idx_unique_invoice_number ON invoices(business_id, invoice_number) WHERE deleted_at IS NULL;

-- Constraint: Cannot edit finalized invoices
-- (This is enforced in application logic, but we can add a trigger)
```

**GST Integration Points:**
- `supply_type`: Determines CGST+SGST vs IGST
- `transaction_type`: Maps to GSTR-1 tables (B2B → Table 4, B2C → Table 5/7)
- `cgst_amount`, `sgst_amount`, `igst_amount`: Pre-calculated for reporting
- `is_filed_in_gstr1`: Track if invoice is included in return

---

### 6. **invoice_items** (Line Items of Invoices)

```sql
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id), -- NULL if ad-hoc item
    
    -- Item Details
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    hsn_sac_code VARCHAR(8) NOT NULL, -- ✅ GST REQUIRED
    
    -- Quantity & Pricing
    quantity DECIMAL(15,3) NOT NULL,
    unit VARCHAR(50) DEFAULT 'PCS',
    rate DECIMAL(15,2) NOT NULL, -- Price per unit
    
    -- Amounts
    gross_amount DECIMAL(15,2) NOT NULL, -- quantity * rate
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    taxable_amount DECIMAL(15,2) NOT NULL, -- After discount
    
    -- Tax Details ✅ GST CALCULATION
    gst_rate DECIMAL(5,2) NOT NULL,
    cgst_rate DECIMAL(5,2) DEFAULT 0.00,
    sgst_rate DECIMAL(5,2) DEFAULT 0.00,
    igst_rate DECIMAL(5,2) DEFAULT 0.00,
    cess_rate DECIMAL(5,2) DEFAULT 0.00,
    
    cgst_amount DECIMAL(15,2) DEFAULT 0.00,
    sgst_amount DECIMAL(15,2) DEFAULT 0.00,
    igst_amount DECIMAL(15,2) DEFAULT 0.00,
    cess_amount DECIMAL(15,2) DEFAULT 0.00,
    
    total_tax DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL, -- taxable_amount + total_tax
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);
CREATE INDEX idx_invoice_items_hsn ON invoice_items(hsn_sac_code);
```

**GST Integration:**
- `hsn_sac_code`: Required for HSN summary in GSTR-1
- GST amounts calculated based on `supply_type` from parent invoice

---

### 7. **gstr_returns** (GST Return History)

```sql
CREATE TABLE gstr_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Return Details ✅ GST FILING
    return_type VARCHAR(20) NOT NULL, -- gstr1, gstr3b, gstr2a, gstr2b (future)
    tax_period VARCHAR(10) NOT NULL, -- YYYY-MM format (e.g., "2025-09")
    financial_year VARCHAR(10) NOT NULL,
    
    -- Filing Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, generated, filed, accepted, rejected
    generation_date TIMESTAMP,
    filing_date TIMESTAMP,
    acknowledgement_number VARCHAR(50), -- ARN from GST portal
    
    -- Return Data (JSON format) ✅ STORE ENTIRE GST RETURN
    return_json JSONB, -- Complete GSTR-1/3B JSON as per GST schema
    
    -- Summary (for quick access)
    total_invoices INT,
    total_taxable_value DECIMAL(15,2),
    total_tax_liability DECIMAL(15,2), -- For GSTR-3B
    total_itc_claimed DECIMAL(15,2), -- For GSTR-3B
    net_tax_payable DECIMAL(15,2), -- For GSTR-3B
    
    -- Files
    json_file_url VARCHAR(500), -- Download JSON
    summary_pdf_url VARCHAR(500), -- Summary report
    
    -- Audit
    generated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gstr_business ON gstr_returns(business_id);
CREATE INDEX idx_gstr_period ON gstr_returns(business_id, tax_period);
CREATE INDEX idx_gstr_type ON gstr_returns(return_type);
CREATE UNIQUE INDEX idx_unique_return ON gstr_returns(business_id, return_type, tax_period);
```

**GST Integration:**
- `return_json`: Store complete GSTR-1/3B as per GST portal schema
- This table archives all returns for compliance and audit

---

### 8. **subscriptions** (Subscription & Payment Tracking)

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Plan Details
    plan_name VARCHAR(50) NOT NULL, -- starter, professional, business
    plan_price DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL, -- monthly, annual
    invoice_limit INT NOT NULL,
    
    -- Subscription Period
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    
    -- Payment Details
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed
    payment_date TIMESTAMP,
    payment_method VARCHAR(50), -- razorpay, stripe, manual
    payment_reference VARCHAR(255), -- Razorpay order_id or payment_id
    
    -- Razorpay Integration
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_subscription_id VARCHAR(100), -- For recurring payments
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_business ON subscriptions(business_id);
CREATE INDEX idx_subscriptions_active ON subscriptions(is_active);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
```

**GST Integration:** None (subscription management)

---

### 9. **audit_logs** (Audit Trail for Compliance)

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id),
    user_id UUID REFERENCES users(id),
    
    -- Action Details
    action VARCHAR(100) NOT NULL, -- created, updated, deleted, finalized, filed
    entity_type VARCHAR(50) NOT NULL, -- invoice, return, customer, product
    entity_id UUID,
    
    -- Change Details
    old_data JSONB, -- Before state
    new_data JSONB, -- After state
    
    -- Metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_business ON audit_logs(business_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
```

**GST Integration:** Track all changes to financial records (required for audits)

---

### 10. **notifications** (User Notifications)

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id),
    
    -- Notification Details
    type VARCHAR(50) NOT NULL, -- deadline_reminder, invoice_created, return_generated, payment_received
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    -- Delivery
    send_email BOOLEAN DEFAULT TRUE,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP,
    
    -- Links
    action_url VARCHAR(500), -- Link to relevant page
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);
```

---

## 🔍 Sample Queries

### 1. Get all unpaid invoices for a business
```sql
SELECT 
    invoice_number,
    customer_name,
    invoice_date,
    total_amount,
    amount_paid,
    (total_amount - amount_paid) as balance
FROM invoices
WHERE business_id = 'xxx' 
    AND payment_status != 'paid'
    AND status = 'finalized'
    AND deleted_at IS NULL
ORDER BY invoice_date DESC;
```

### 2. Calculate tax liability for GSTR-3B (current month)
```sql
SELECT 
    SUM(cgst_amount) as total_cgst,
    SUM(sgst_amount) as total_sgst,
    SUM(igst_amount) as total_igst,
    SUM(cess_amount) as total_cess,
    SUM(total_tax) as total_tax_liability
FROM invoices
WHERE business_id = 'xxx'
    AND invoice_type = 'sales'
    AND status = 'finalized'
    AND DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', CURRENT_DATE)
    AND deleted_at IS NULL;
```

### 3. Get HSN-wise summary for GSTR-1
```sql
SELECT 
    hsn_sac_code,
    SUM(quantity) as total_quantity,
    SUM(taxable_amount) as total_taxable_value,
    SUM(igst_amount) as total_igst,
    SUM(cgst_amount) as total_cgst,
    SUM(sgst_amount) as total_sgst,
    SUM(cess_amount) as total_cess
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
WHERE i.business_id = 'xxx'
    AND i.invoice_type = 'sales'
    AND i.status = 'finalized'
    AND DATE_TRUNC('month', i.invoice_date) = '2025-09-01'
    AND i.deleted_at IS NULL
GROUP BY hsn_sac_code
ORDER BY total_taxable_value DESC;
```

### 4. Get B2B invoices for GSTR-1 Table 4
```sql
SELECT 
    customer_gstin,
    customer_name,
    invoice_number,
    invoice_date,
    taxable_amount,
    igst_amount,
    cgst_amount,
    sgst_amount,
    place_of_supply
FROM invoices
WHERE business_id = 'xxx'
    AND invoice_type = 'sales'
    AND transaction_type LIKE '%b2b%'
    AND status = 'finalized'
    AND DATE_TRUNC('month', invoice_date) = '2025-09-01'
    AND customer_gstin IS NOT NULL
    AND deleted_at IS NULL
ORDER BY invoice_date;
```

---

## 🛡️ Database Security

### 1. Encryption
- **At Rest:** Enable PostgreSQL encryption
- **In Transit:** Use SSL/TLS for all connections
- **Application Level:** Encrypt sensitive fields (bank details) using AES-256

### 2. Access Control
- **Principle of Least Privilege:** Application uses limited DB user
- **No Direct Access:** Users never connect directly to DB
- **Backup User:** Separate read-only user for backups

### 3. Backup Strategy
- **Daily Automated Backups:** Full DB backup at 2 AM IST
- **Point-in-Time Recovery (PITR):** WAL archiving enabled
- **Retention:** 30 days of daily backups, 12 months of monthly backups
- **Backup Storage:** AWS S3 with encryption

### 4. Data Retention
- **Financial Records:** 7 years (GST Act requirement)
- **Audit Logs:** 7 years
- **Soft Deletes:** Never physically delete invoices, customers, products
- **GDPR Compliance:** User can request data deletion (after legal retention period)

---

## 📈 Database Optimization

### 1. Indexing Strategy
- **Primary Keys:** UUID with B-tree index
- **Foreign Keys:** Indexed automatically
- **Query-Specific:** Indexes on frequently queried columns (invoice_date, gstin, etc.)
- **Partial Indexes:** For soft-deleted records (WHERE deleted_at IS NULL)

### 2. Partitioning (Future)
- **invoices Table:** Partition by year (when >10M records)
- **audit_logs Table:** Partition by month (when >100M records)

### 3. Query Optimization
- Use **EXPLAIN ANALYZE** before production
- Avoid **SELECT ***, specify columns
- Use **LIMIT** for paginated results
- Use **materialized views** for complex reports (if needed)

### 4. Connection Pooling
- Use **PgBouncer** or application-level pooling (Sequelize/Prisma)
- Max connections: 100 (adjust based on load)

---

## 🚀 Migration Strategy

### Tool: **Prisma Migrate** (or Sequelize Migrations)

#### Initial Setup:
```bash
# Install Prisma
npm install prisma --save-dev
npx prisma init

# Create migration
npx prisma migrate dev --name init

# Apply to production
npx prisma migrate deploy
```

#### Migration Files Location:
```
/database/migrations/
  - 20260124_001_create_users.sql
  - 20260124_002_create_businesses.sql
  - 20260124_003_create_customers.sql
  ...
```

---

## 📦 Sample Data (for Testing)

### Test Users:
```sql
INSERT INTO users (email, password_hash, email_verified) VALUES
('test@example.com', '$2b$10$...', TRUE);
```

### Test Business (with valid GSTIN):
```sql
INSERT INTO businesses (user_id, business_name, gstin, pan, state_code, state, ...) VALUES
('user-uuid', 'Test Company Pvt Ltd', '27AABCT1332L1ZM', 'AABCT1332L', '27', 'Maharashtra', ...);
```

---

## 🧪 Testing the Database

### 1. Unit Tests (with In-Memory DB)
```javascript
// Use SQLite in-memory for fast tests
const testDB = new Sequelize('sqlite::memory:');
```

### 2. Integration Tests (with Docker PostgreSQL)
```bash
docker run --name test-postgres -e POSTGRES_PASSWORD=test -p 5433:5432 -d postgres:15
```

### 3. Data Validation Tests
- Test GSTIN format validation
- Test GST rate constraints
- Test invoice finalization (no edits after)

---

## 📝 Next Steps

1. **Setup PostgreSQL Database** (local + RDS)
2. **Install Prisma/Sequelize ORM**
3. **Create Schema Migrations**
4. **Seed Test Data**
5. **Write Database Access Layer (DAL)** - `backend/db/models/`

---

**Document Version:** 1.0  
**Last Updated:** January 24, 2026  
**Owner:** Data Engineer + Software Engineer  
**Review:** Validate GST fields with CA team
