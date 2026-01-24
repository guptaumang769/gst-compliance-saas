# Testing Guide - For Personal Laptop

## 🎯 Overview

This guide is for testing the GST Compliance SaaS on your **personal laptop** where Docker works properly.

**Repository:** https://github.com/guptaumang769/gst-compliance-saas.git

---

## 🚀 Setup on Personal Laptop (One-Time Setup)

### **Step 1: Clone Repository**

```bash
# Choose a location (e.g., your projects folder)
cd ~/Projects  # or wherever you keep projects

# Clone the repository
git clone https://github.com/guptaumang769/gst-compliance-saas.git

cd gst-compliance-saas
```

---

### **Step 2: Start Database Services**

```bash
# Make sure Docker Desktop is running
docker ps  # Should work without errors

# Start PostgreSQL and Redis
docker-compose up -d

# Verify containers are running
docker ps
# Should show:
# - gst_saas_db (postgres:15-alpine)
# - gst_saas_redis (redis:7-alpine)
```

---

### **Step 3: Setup Backend**

```bash
cd backend

# Install dependencies (first time only, takes 2-3 minutes)
npm install

# Check if .env file exists
cat .env

# If JWT_SECRET is still the placeholder, generate a real one:
openssl rand -base64 32
# Copy the output and replace JWT_SECRET in .env

# Run database migrations
npx prisma migrate dev --name init

# Should see:
# ✔ Generated Prisma Client
# ✔ Migration applied successfully

# Generate Prisma Client
npx prisma generate

# Optional: View database in Prisma Studio
npx prisma studio
# Opens at: http://localhost:5555
```

---

### **Step 4: Start Backend Server**

```bash
# Still in backend directory
npm run dev

# Should see:
# 🚀 ==========================================
#    GST Compliance SaaS Backend
#    Server: http://localhost:5000
#    Health: http://localhost:5000/health
#    Environment: development
#    Node.js: vX.X.X
# ========================================== 🚀
```

**Test the backend:**

```bash
# Open new terminal
curl http://localhost:5000/health

# Should return:
# {
#   "status": "OK",
#   "message": "GST SaaS Backend is running!",
#   ...
# }

# Or open in browser: http://localhost:5000/health
```

---

### **Step 5: Setup Frontend (When Ready)**

```bash
# Open new terminal (keep backend running)
cd gst-compliance-saas/frontend

# If frontend folder doesn't exist yet, create it:
npx create-react-app .

# Install dependencies
npm install

# Install UI libraries
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
npm install react-router-dom axios @reduxjs/toolkit react-redux
npm install react-hook-form yup @hookform/resolvers date-fns

# Start frontend
npm start

# Opens browser at: http://localhost:3000
```

---

## 🔄 Daily Testing Workflow

### **When You Pull New Code from GitHub:**

```bash
cd ~/Projects/gst-compliance-saas

# Pull latest changes
git pull origin main

# Check what changed
git log -5

# If backend code changed:
cd backend
npm install  # In case new dependencies were added
npx prisma generate  # If schema changed
npx prisma migrate dev  # If new migrations

# If frontend code changed:
cd frontend
npm install  # In case new dependencies were added

# Restart servers (if they're running)
# Ctrl+C to stop, then:
npm run dev  # In backend
npm start    # In frontend
```

---

## ✅ Testing Checklist

### **Basic Health Check:**
- [ ] `docker ps` shows 2 containers running
- [ ] Backend responds at http://localhost:5000/health
- [ ] Frontend loads at http://localhost:3000 (when ready)
- [ ] No errors in terminal logs

### **Database Check:**
```bash
# View database
cd backend
npx prisma studio
# Opens at: http://localhost:5555

# Check tables exist
docker exec -it gst_saas_db psql -U postgres -d gst_saas -c "\dt"
# Should show: users, businesses tables
```

### **API Testing (Week 2 onwards):**
```bash
# Test registration API (example)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "businessName": "Test Company",
    "gstin": "27AABCT1332L1ZM"
  }'

# Use Postman for easier API testing
```

---

## 🐛 Troubleshooting on Personal Laptop

### **Issue: Docker containers won't start**
```bash
# Check if ports are free
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# If occupied, stop local services:
brew services stop postgresql
brew services stop redis

# Restart Docker containers
docker-compose down
docker-compose up -d
```

### **Issue: Backend fails to connect to database**
```bash
# Check DATABASE_URL in backend/.env
cat backend/.env | grep DATABASE_URL

# Should be: postgresql://postgres:postgres123@localhost:5432/gst_saas

# Test direct connection
docker exec -it gst_saas_db psql -U postgres -d gst_saas -c "SELECT 1;"
```

### **Issue: Prisma errors**
```bash
cd backend

# Reset and recreate database
npx prisma migrate reset
npx prisma migrate dev --name init
npx prisma generate
```

### **Issue: "Module not found" errors**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Testing Features (Week-by-Week)

### **Week 1: Infrastructure**
- [ ] Backend server starts successfully
- [ ] Database migrations run without errors
- [ ] Health check endpoint responds
- [ ] Prisma Studio shows tables

### **Week 2: Authentication**
- [ ] User registration works
- [ ] GSTIN validation works
- [ ] Login returns JWT token
- [ ] Protected routes require authentication

### **Week 3-4: Masters**
- [ ] Can create products with HSN codes
- [ ] Can create customers with GSTIN
- [ ] Data persists in database

### **Week 5: GST Calculator (CRITICAL)**
- [ ] Intra-state tax calculation (CGST + SGST) is correct
- [ ] Inter-state tax calculation (IGST) is correct
- [ ] All GST rates (5%, 12%, 18%, 28%) work
- [ ] Rounding is accurate to 2 decimals
- [ ] **CA team validates 100% accuracy**

### **Week 6-7: Invoices**
- [ ] Can create sales invoices
- [ ] GST is calculated automatically
- [ ] Invoices can be finalized
- [ ] PDF generation works

### **Week 11-12: GSTR-1**
- [ ] GSTR-1 JSON is generated
- [ ] All invoice types are classified correctly
- [ ] HSN summary is accurate
- [ ] **JSON uploads to GST portal successfully**

### **Week 13-14: GSTR-3B**
- [ ] Tax liability is calculated correctly
- [ ] ITC is calculated from purchases
- [ ] Net tax payable matches manual calculation
- [ ] **CA team validates accuracy**

---

## 📝 Reporting Issues

When you find bugs or issues, create a note with:

1. **What were you testing?** (e.g., "User registration")
2. **What did you do?** (step-by-step)
3. **What happened?** (error message, unexpected behavior)
4. **What should have happened?**
5. **Screenshots** (if UI issue)
6. **Terminal logs** (if backend issue)

**Example:**
```
Issue: User registration fails with 500 error

Steps:
1. Started backend with `npm run dev`
2. Sent POST request to /api/auth/register
3. Got 500 Internal Server Error

Error in terminal:
TypeError: Cannot read property 'create' of undefined
at authService.js:25

Expected: Should create user and return JWT token
```

---

## 🔄 Syncing with Development Laptop

### **Company Laptop (Development):**
```bash
# After writing code
git add .
git commit -m "Week 2: Add user authentication"
git push origin main
```

### **Personal Laptop (Testing):**
```bash
# Pull latest code
cd ~/Projects/gst-compliance-saas
git pull origin main

# Restart servers to test new code
# ... test ...

# Report any issues
```

---

## 🎯 Weekly Testing Goals

| Week | What to Test | Success Criteria |
|------|-------------|------------------|
| Week 1 | Infrastructure | Backend + DB working |
| Week 2 | Authentication | Can register/login |
| Week 3-4 | Masters | Can add products/customers |
| Week 5 | GST Calculator | 100% accurate (CA validated) |
| Week 6-7 | Invoices | Can create & finalize invoices |
| Week 11-12 | GSTR-1 | JSON accepted by GST portal |
| Week 13-14 | GSTR-3B | Matches manual calculation |
| Week 16 | Full MVP | All features working |

---

## 🚀 Quick Command Reference

```bash
# Start everything
docker-compose up -d              # Databases
cd backend && npm run dev         # Backend (Terminal 1)
cd frontend && npm start          # Frontend (Terminal 2)

# Stop everything
docker-compose down               # Stop databases
Ctrl+C in backend/frontend terminals

# Pull latest code & restart
git pull origin main
# Restart backend & frontend

# View database
cd backend && npx prisma studio

# Check logs
docker-compose logs -f postgres   # Database logs
# Backend logs are in terminal where npm run dev is running
```

---

## ✅ Setup Complete Checklist

First-time setup on personal laptop:

- [ ] Repository cloned from GitHub
- [ ] Docker Desktop is running
- [ ] `docker-compose up -d` successful (2 containers)
- [ ] Backend dependencies installed (`npm install`)
- [ ] Database migrations run (`npx prisma migrate dev`)
- [ ] Backend starts successfully (`npm run dev`)
- [ ] Health check responds: http://localhost:5000/health
- [ ] (Later) Frontend dependencies installed
- [ ] (Later) Frontend starts: http://localhost:3000

---

**Ready to test! Pull the latest code and start testing.** 🎉

**Any issues? Note them down and we'll fix them together.**
