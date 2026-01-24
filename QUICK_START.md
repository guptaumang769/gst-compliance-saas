# Quick Start Guide - GST Compliance SaaS

## 🎯 For Software Engineers: Your First Steps

Welcome! This guide will help you get started with coding the GST Compliance SaaS platform.

---

## 📖 Before You Code

### 1. Read These Documents (in order):
1. **[README.md](README.md)** - Project overview (10 min read)
2. **[docs/01-MVP-FEATURES.md](docs/01-MVP-FEATURES.md)** - What to build (30 min read)
3. **[docs/02-DATABASE-SCHEMA.md](docs/02-DATABASE-SCHEMA.md)** - Database structure (20 min read)
4. **[docs/04-DESIGN-DOCUMENT.md](docs/04-DESIGN-DOCUMENT.md)** - Technical design (40 min read)
5. **[docs/06-GST-INTEGRATION-GUIDE.md](docs/06-GST-INTEGRATION-GUIDE.md)** - GST rules (30 min read)

**Total reading time:** ~2 hours (worth it!)

### 2. Understand the Big Picture

```
User creates invoice → System determines supply type → Calculates GST 
→ Stores in DB → Generates GSTR-1/3B → Downloads JSON → User files on GST portal
```

**Your job:** Build the system that automates this flow with 100% accuracy.

---

## 🚀 Setup Your Development Environment

### Step 1: Install Prerequisites

```bash
# Check Node.js version (should be 20+)
node --version

# Check Docker
docker --version
docker-compose --version

# Check Git
git --version
```

If any missing, install:
- **Node.js 20 LTS:** https://nodejs.org/
- **Docker Desktop:** https://www.docker.com/products/docker-desktop
- **Git:** https://git-scm.com/

---

### Step 2: Clone & Setup Project

```bash
# 1. Navigate to project directory
cd /Users/ugupta6/Downloads/gst-compliance-saas

# 2. Initialize Git repository (if not already)
git init
git add .
git commit -m "Initial project setup with documentation"

# 3. Create GitHub repository and push (optional)
# git remote add origin https://github.com/your-org/gst-compliance-saas.git
# git push -u origin main
```

---

### Step 3: Setup Backend

```bash
cd backend

# 1. Initialize Node.js project
npm init -y

# 2. Install dependencies
npm install express prisma @prisma/client bcrypt jsonwebtoken joi cors dotenv
npm install --save-dev nodemon typescript @types/node @types/express

# 3. Install additional packages (PDF, email, AWS)
npm install puppeteer nodemailer aws-sdk redis ioredis

# 4. Install Razorpay SDK
npm install razorpay

# 5. Install testing framework
npm install --save-dev jest supertest

# 6. Create folder structure
mkdir -p src/controllers
mkdir -p src/services
mkdir -p src/models
mkdir -p src/routes
mkdir -p src/middleware
mkdir -p src/utils
mkdir -p tests

# 7. Copy environment file
cp .env.example .env

# 8. Edit .env file with your settings
# Use your favorite editor: nano, vim, or VS Code
code .env  # If using VS Code
```

**Edit `.env` file:**
- Set `DATABASE_URL` with your PostgreSQL credentials
- Set `JWT_SECRET` to a random string (generate one: `openssl rand -base64 32`)

---

### Step 4: Setup Database (PostgreSQL)

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL & Redis with Docker Compose
cd /Users/ugupta6/Downloads/gst-compliance-saas
docker-compose up -d

# Check if containers are running
docker ps

# You should see:
# - gst_saas_db (PostgreSQL)
# - gst_saas_redis (Redis)
```

#### Option B: Local PostgreSQL
```bash
# Install PostgreSQL (if not using Docker)
brew install postgresql  # macOS
# OR
sudo apt install postgresql  # Ubuntu

# Start PostgreSQL
brew services start postgresql  # macOS

# Create database
psql postgres
CREATE DATABASE gst_saas;
\q
```

---

### Step 5: Setup Prisma (Database ORM)

```bash
cd backend

# 1. Initialize Prisma
npx prisma init

# 2. This creates:
#    - prisma/schema.prisma (define your tables here)
#    - .env (already exists)

# 3. Copy the database schema from docs
# See: docs/02-DATABASE-SCHEMA.md
# Convert SQL tables to Prisma schema format

# 4. Run migrations
npx prisma migrate dev --name init

# 5. Generate Prisma Client
npx prisma generate

# 6. (Optional) Open Prisma Studio to view data
npx prisma studio
# Opens at: http://localhost:5555
```

**Sample Prisma Schema** (add to `prisma/schema.prisma`):
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                    String    @id @default(uuid())
  email                 String    @unique
  passwordHash          String    @map("password_hash")
  emailVerified         Boolean   @default(false) @map("email_verified")
  role                  String    @default("owner")
  isActive              Boolean   @default(true) @map("is_active")
  lastLogin             DateTime? @map("last_login")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  deletedAt             DateTime? @map("deleted_at")

  businesses            Business[]

  @@map("users")
}

// Add other models from docs/02-DATABASE-SCHEMA.md
```

---

### Step 6: Setup Frontend

```bash
cd /Users/ugupta6/Downloads/gst-compliance-saas

# 1. Create React app
npx create-react-app frontend

cd frontend

# 2. Install UI library (Material-UI)
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material

# 3. Install routing
npm install react-router-dom

# 4. Install form library
npm install react-hook-form yup @hookform/resolvers

# 5. Install HTTP client
npm install axios

# 6. Install state management
npm install @reduxjs/toolkit react-redux

# 7. Create folder structure
mkdir -p src/pages
mkdir -p src/components
mkdir -p src/redux/slices
mkdir -p src/utils
mkdir -p src/services
```

---

### Step 7: Test Your Setup

#### Test Backend:
```bash
cd backend

# Create a simple test file
cat > src/index.js << 'EOF'
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
EOF

# Run the server
node src/index.js

# Open browser: http://localhost:5000/health
# You should see: {"status":"OK","message":"Backend is running!"}
```

#### Test Frontend:
```bash
cd frontend

# Start React app
npm start

# Opens browser at: http://localhost:3000
# You should see React logo
```

---

## 📅 Your First Week Tasks (Week 1)

Follow the detailed plan in [docs/05-PHASE-PLAN.md](docs/05-PHASE-PLAN.md)

### Day 1-2: Project Setup ✅ DONE
- [x] Read documentation
- [x] Setup Git repository
- [x] Install dependencies
- [x] Setup backend & frontend

### Day 3-4: Database Setup
- [ ] Create Prisma schema (based on docs/02-DATABASE-SCHEMA.md)
- [ ] Run migrations
- [ ] Seed test data (1 user, 1 business)
- [ ] Test database connection

### Day 5-6: Basic Server Setup
- [ ] Create Express server
- [ ] Setup routes structure
- [ ] Setup middleware (CORS, body-parser, error handler)
- [ ] Test API with Postman

### Day 7: Frontend Structure
- [ ] Setup React Router
- [ ] Create basic layout (Header, Sidebar, Content)
- [ ] Create login page (UI only)
- [ ] Test routing

---

## 🔑 Key Files You'll Create (Next 2 Weeks)

### Week 2: Authentication Module

```
backend/src/
├── controllers/
│   └── authController.js          ← Handle HTTP requests
├── services/
│   └── authService.js              ← Business logic (register, login)
├── middleware/
│   └── authMiddleware.js           ← JWT verification
├── routes/
│   └── authRoutes.js               ← Define API endpoints
└── utils/
    └── gstValidation.js            ← ✅ GSTIN validation logic

frontend/src/
├── pages/
│   ├── Login.jsx
│   └── Register.jsx
├── components/
│   └── AuthForm.jsx
└── services/
    └── authService.js              ← API calls
```

**Start here:**
1. Create `authController.js` first
2. Then `authService.js`
3. Then `authRoutes.js`
4. Test with Postman before building frontend

---

## 🧪 Testing Your Code

### Backend API Testing (Postman):

**1. Register User:**
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password@123",
  "businessName": "Test Company Pvt Ltd",
  "gstin": "27AABCT1332L1ZM",
  "pan": "AABCT1332L",
  "state": "Maharashtra"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com"
  }
}
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot find module 'express'"
**Solution:** Run `npm install` in backend folder

### Issue 2: "Database connection failed"
**Solution:** 
- Check if PostgreSQL is running: `docker ps` or `brew services list`
- Verify DATABASE_URL in .env file
- Test connection: `psql postgresql://postgres:password@localhost:5432/gst_saas`

### Issue 3: "Port 5000 already in use"
**Solution:** 
- Change PORT in .env to 5001
- Or kill existing process: `lsof -ti:5000 | xargs kill`

### Issue 4: Prisma errors
**Solution:**
- Delete `prisma/migrations` folder
- Run `npx prisma migrate reset`
- Run `npx prisma migrate dev --name init`

---

## 📞 Getting Help

### Where to Find Answers:
1. **Documentation:** Check `/docs` folder first
2. **Code Comments:** All critical functions have JSDoc comments
3. **Team:** Ask in WhatsApp/Slack group
4. **Stack Overflow:** For general Node.js/React questions

### CA Team Support:
- **GST Questions:** Ask CA team (they'll respond in 24 hours)
- **GST Validation:** Schedule review calls every Saturday

---

## 🎯 Success Checklist (End of Week 1)

- [ ] All documentation read and understood
- [ ] Development environment setup complete
- [ ] Backend server running on http://localhost:5000
- [ ] Frontend running on http://localhost:3000
- [ ] PostgreSQL database connected
- [ ] Redis connected
- [ ] Can create a test user in database (via Prisma Studio)
- [ ] Folder structure created as per design doc
- [ ] Git repository initialized and first commit done

**Once all checked, you're ready to start coding! 🚀**

---

## 🔜 What's Next?

### Week 2: Build Authentication Module
See detailed tasks in: [docs/05-PHASE-PLAN.md](docs/05-PHASE-PLAN.md#week-2-authentication--user-management)

**Your first coding task:**
Create `backend/src/controllers/authController.js` with registration logic.

**Start here:**
```javascript
// backend/src/controllers/authController.js
const authService = require('../services/authService');

exports.register = async (req, res) => {
  try {
    const { email, password, businessName, gstin, pan, state } = req.body;
    
    // TODO: Validate input
    // TODO: Check if user exists
    // TODO: Validate GSTIN format ✅ GST VALIDATION
    // TODO: Hash password
    // TODO: Create user & business records
    // TODO: Generate JWT token
    // TODO: Send verification email
    
    res.status(201).json({ success: true, message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 💡 Pro Tips

1. **Commit Often:** Commit after every small feature (not just at end of day)
2. **Test Early:** Test each function before moving to next
3. **Ask Questions:** Don't spend >2 hours stuck on one issue
4. **Follow the Plan:** Stick to the week-by-week plan (don't skip ahead)
5. **CA Validation:** Get CA approval before marking GST features as "done"

---

**Ready to code? Let's build this! 🎉**

**Next Step:** [Week 2 Tasks - Authentication Module](docs/05-PHASE-PLAN.md#week-2-authentication--user-management)
