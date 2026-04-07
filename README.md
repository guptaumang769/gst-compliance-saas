# GST Compliance SaaS Platform

## 🎯 Project Overview

A comprehensive SaaS platform to help Indian SMEs manage GST compliance easily. Automates invoice creation, GST calculations, and return generation (GSTR-1, GSTR-3B).

**Target Customers:** Small & Medium Businesses with ₹20L - ₹10Cr annual turnover

---

## 📂 Project Structure 

```
gst-compliance-saas/
├── docs/                          # All technical documentation
│   ├── 01-MVP-FEATURES.md         # Complete feature list for MVP
│   ├── 02-DATABASE-SCHEMA.md      # Database design & schema
│   ├── 03-DEVOPS-API-INTEGRATION.md # DevOps, APIs, infrastructure
│   ├── 04-DESIGN-DOCUMENT.md      # Technical design & architecture
│   ├── 05-PHASE-PLAN.md           # Week-by-week development plan
│   └── 06-GST-INTEGRATION-GUIDE.md # Where GST rules are applied
├── backend/                       # Node.js backend (Express/Fastify)
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── gstCalculator.js   ✅ CRITICAL GST COMPONENT
│   │   │   ├── gstr1Generator.js  ✅ CRITICAL GST COMPONENT
│   │   │   └── gstr3bGenerator.js ✅ CRITICAL GST COMPONENT
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── index.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/                      # React.js frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── redux/
│   │   ├── utils/
│   │   └── App.js
│   ├── Dockerfile
│   └── package.json
├── database/                      # Database migrations & seeds
│   ├── migrations/
│   └── seeds/
├── devops/                        # DevOps configs
│   ├── nginx/
│   └── scripts/
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites:
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+
- Git

### Local Development Setup:

```bash
# 1. Clone the repository
git clone https://github.com/your-org/gst-compliance-saas.git
cd gst-compliance-saas

# 2. Create environment file
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# 3. Start all services with Docker
docker-compose up -d

# 4. Run database migrations
cd backend
npm install
npx prisma migrate dev

# 5. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Database: localhost:5432
```

---

## 📚 Documentation

### For Software Engineers:
1. **Start Here:** [01-MVP-FEATURES.md](docs/01-MVP-FEATURES.md)
   - Complete feature list
   - What to build in MVP
   - Priority levels

2. **Database Design:** [02-DATABASE-SCHEMA.md](docs/02-DATABASE-SCHEMA.md)
   - All tables with relationships
   - Indexes, constraints
   - Sample queries

3. **Architecture:** [04-DESIGN-DOCUMENT.md](docs/04-DESIGN-DOCUMENT.md)
   - System architecture
   - Component design
   - **GST calculation logic** ✅
   - **GSTR-1/3B generation logic** ✅

4. **Development Plan:** [05-PHASE-PLAN.md](docs/05-PHASE-PLAN.md)
   - Week-by-week tasks
   - 16-week roadmap to MVP
   - Team responsibilities

### For Data Engineers:
1. **Database Schema:** [02-DATABASE-SCHEMA.md](docs/02-DATABASE-SCHEMA.md)
2. **DevOps & APIs:** [03-DEVOPS-API-INTEGRATION.md](docs/03-DEVOPS-API-INTEGRATION.md)
   - Infrastructure setup
   - API integrations (GST Portal, Razorpay, Email)
   - CI/CD pipeline

### For CA Team:
1. **GST Integration Guide:** [docs/06-GST-INTEGRATION-GUIDE.md](docs/06-GST-INTEGRATION-GUIDE.md)
   - Where GST rules are applied in code
   - What validation is needed
   - Test scenarios required

---

## ✅ Critical GST Components

### 1. GST Calculator (`backend/src/services/gstCalculator.js`)
**Responsibility:** Calculate CGST/SGST or IGST based on supply type

**Key Functions:**
- `calculateGST(taxableAmount, gstRate, supplyType)`
- `determineSupplyType(businessStateCode, customerStateCode)`
- `calculateIntraStateGST()` → Returns CGST + SGST
- `calculateInterStateGST()` → Returns IGST

**GST Rules Applied:**
- **Intra-state supply** (same state): CGST + SGST (split equally)
- **Inter-state supply** (different states): IGST (full rate)
- Rounding to 2 decimal places

**Where Used:**
- Invoice creation
- Invoice item calculation
- Purchase invoice recording

---

### 2. GSTR-1 Generator (`backend/src/services/gstr1Generator.js`)
**Responsibility:** Generate GSTR-1 return from sales invoices

**Key Functions:**
- `generateGSTR1(businessId, taxPeriod)`
- `generateB2BTable()` → Table 4 (B2B invoices)
- `generateB2CLTable()` → Table 5 (B2C large invoices >₹2.5L)
- `generateB2CSTable()` → Table 7 (B2C small, state-wise summary)
- `generateHSNSummary()` → Table 12 (HSN-wise summary)

**GST Rules Applied:**
- Invoice classification (B2B vs B2C vs Export)
- HSN code aggregation
- Place of supply rules
- JSON format as per GST portal schema

**Where Used:**
- Monthly/quarterly GSTR-1 generation
- Return filing page

---

### 3. GSTR-3B Generator (`backend/src/services/gstr3bGenerator.js`)
**Responsibility:** Generate GSTR-3B summary return with tax liability

**Key Functions:**
- `generateGSTR3B(businessId, taxPeriod)`
- `calculateTable31()` → Outward supplies
- `calculateTable4ITC()` → Input Tax Credit available
- `calculateTaxLiability()` → Final tax payable after ITC

**GST Rules Applied:**
- Tax liability calculation (CGST + SGST + IGST)
- ITC eligibility rules
- ITC reversal (if any)
- Net tax payable = Tax liability - ITC

**Where Used:**
- Monthly/quarterly GSTR-3B generation
- Tax liability dashboard

---

## 🔑 Where GST Rules Are Integrated (Quick Reference)

| Module | File | GST Rule Applied |
|--------|------|------------------|
| **User Registration** | `authService.js` | GSTIN format validation (15 digits, checksum) |
| **Business Setup** | `businessService.js` | GSTIN validation, State code extraction |
| **Customer Master** | `customerService.js` | GSTIN validation, State detection |
| **Product Master** | `productService.js` | HSN/SAC code validation |
| **Invoice Creation** | `invoiceService.js` | Determine supply type (intra/inter state) |
| **GST Calculation** | `gstCalculator.js` ✅ | **CORE: CGST+SGST vs IGST logic** |
| **Invoice Finalization** | `invoiceService.js` | Re-validate GST calculations, lock invoice |
| **GSTR-1 Generation** | `gstr1Generator.js` ✅ | **Invoice classification, HSN summary, JSON schema** |
| **GSTR-3B Generation** | `gstr3bGenerator.js` ✅ | **Tax liability, ITC calculation, net payable** |
| **Dashboard** | `dashboardService.js` | Aggregate tax liability, ITC available |

---

## 🧪 Testing GST Components

### Unit Tests:
```bash
cd backend
npm test

# Test specific module
npm test -- gstCalculator.test.js
```

### Test Cases (from CA Team):
- Located in: `backend/tests/gst-test-cases/`
- 50+ scenarios covering:
  - All GST rates (0%, 5%, 12%, 18%, 28%)
  - Intra-state vs inter-state
  - B2B vs B2C
  - Exports, SEZ, reverse charge

### CA Validation Required:
- [ ] GST Calculator (Week 5)
- [ ] GSTR-1 Generator (Week 12)
- [ ] GSTR-3B Generator (Week 14)

---

## 🔐 Environment Variables

Create `backend/.env` file:

```bash
# Node Environment
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/gst_saas

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-256-bit-secret
JWT_EXPIRES_IN=7d

# GST Portal API (if available)
GST_API_BASE_URL=https://api.gst.gov.in
GST_API_KEY=your-gst-api-key

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# AWS S3
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=ap-south-1
S3_BUCKET_NAME=gst-saas-documents

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@gst-saas.com

# Sentry (Error Tracking)
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## 📦 Tech Stack

### Backend:
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js
- **Database:** PostgreSQL 15
- **ORM:** Prisma
- **Cache:** Redis
- **Authentication:** JWT
- **Validation:** Joi

### Frontend:
- **Framework:** React.js 18
- **UI Library:** Material-UI (MUI)
- **State Management:** Redux Toolkit
- **Forms:** React Hook Form + Yup
- **HTTP Client:** Axios

### DevOps:
- **Containerization:** Docker
- **Reverse Proxy:** Nginx
- **CI/CD:** GitHub Actions
- **Cloud:** AWS or DigitalOcean
- **Monitoring:** PM2, Sentry, Winston

### External APIs:
- **GST Portal API** (for GSTIN validation, GSTR-2A/2B fetch)
- **Razorpay** (payments)
- **SendGrid/AWS SES** (emails)
- **AWS S3** (file storage)

---

## 🗓️ Development Timeline

**Total Duration:** 16 weeks (4 months)

### Phase 1: Foundation (Week 1-4)
- Setup infrastructure
- User authentication
- Business configuration
- Product/Customer masters

### Phase 2: Core Features (Week 5-10)
- ✅ **GST Calculation Engine** (Week 5 - CRITICAL)
- Invoice creation & management
- Purchase invoices
- Subscription & payments

### Phase 3: GST Returns (Week 11-14)
- ✅ **GSTR-1 Generation** (Week 11-12 - CRITICAL)
- ✅ **GSTR-3B Generation** (Week 13-14 - CRITICAL)

### Phase 4: Testing & Launch (Week 15-16)
- Beta testing
- Bug fixes
- Production deployment
- Marketing launch

**Detailed Plan:** See [05-PHASE-PLAN.md](docs/05-PHASE-PLAN.md)

---

## 👥 Team Structure

### Software Engineer (You):
- Full-stack development
- GST calculation logic
- GSTR-1/3B generators
- Frontend UI/UX
- DevOps setup

### Data Engineer:
- Database schema design
- Query optimization
- Data pipelines
- Reporting queries
- Reconciliation logic

### CA #1 (Product Lead):
- GST rules documentation
- Test case creation
- Product validation
- User support (GST queries)

### CA #2 (Business Lead):
- Market research
- Sales & partnerships
- Beta tester onboarding
- Marketing

---

## 📊 Success Criteria

### MVP Complete When:
- [ ] User can create GST-compliant invoices
- [ ] GST is calculated 100% accurately (CA validated)
- [ ] GSTR-1 JSON is accepted by GST portal
- [ ] GSTR-3B JSON is accepted by GST portal
- [ ] 10 beta users file returns successfully
- [ ] Payment system working
- [ ] System is secure and stable

### Post-Launch (Month 1):
- [ ] 10 paying customers
- [ ] 50+ invoices created
- [ ] 5+ returns filed
- [ ] 0 critical bugs

---

## 🚨 Critical Notes

### For Development:
1. **Never skip CA validation** for GST components
2. **Test with real data** from CA team
3. **Follow GST portal JSON schema** exactly
4. **Log all GST calculations** for debugging
5. **Never delete financial records** (soft delete only)

### For CA Team:
1. **Provide detailed test scenarios** before coding starts
2. **Validate GST Calculator** before invoice module (Week 5)
3. **Validate GSTR-1** before GSTR-3B (Week 12)
4. **Sample JSON files** from GST portal are critical

### For Data Engineer:
1. **Financial data = DECIMAL type** (not FLOAT)
2. **Index all foreign keys**
3. **Soft deletes** for all financial tables
4. **Audit trail** for all changes

---

## 📞 Support & Communication

### Weekly Sync:
- **Every Saturday 10 AM** (Video call)
- Demo progress
- Discuss blockers
- Plan next week

### Communication Channels:
- **Slack/WhatsApp Group** - Daily updates
- **GitHub Issues** - Bug tracking
- **Google Drive** - Document sharing

### Code Review:
- All code must be reviewed before merge
- GST-critical code reviewed by CA + Engineer

---

## 📖 Additional Resources

### GST Portal:
- Official API Docs: https://developer.gst.gov.in/
- JSON Schema: Download from GST portal
- User Manual: https://tutorial.gst.gov.in/

### Learning Resources:
- GST Basics: [YouTube - CA Tutorials]
- Express.js: https://expressjs.com/
- Prisma ORM: https://www.prisma.io/docs/
- React.js: https://react.dev/

---

## 🎉 Let's Build This!

**Ready to start?** Begin with:
1. **Week 1 tasks** from [05-PHASE-PLAN.md](docs/05-PHASE-PLAN.md)
2. **Setup infrastructure** from [03-DEVOPS-API-INTEGRATION.md](docs/03-DEVOPS-API-INTEGRATION.md)
3. **Review features** from [01-MVP-FEATURES.md](docs/01-MVP-FEATURES.md)

**Questions?** Create a GitHub Issue or message in the team group.

---

**Project Start Date:** January 27, 2026  
**Expected Launch:** Mid May 2026  
**Status:** Ready to Code 🚀

---

## 📄 License

This is a proprietary project. All rights reserved.

**Team:** Your Names Here  
**Contact:** your-email@example.com
