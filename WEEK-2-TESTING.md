# Week 2 Testing Guide - Authentication Module

**Quick reference for testing the authentication system**

---

## 🚀 Quick Start (Company Laptop - Coding)

### 1. Pull Latest Code
```bash
cd /Users/ugupta6/Downloads/AI-SaaS-Product/gst-compliance-saas
git pull origin main
```

### 2. View What's New
Week 2 files created:
- `backend/src/services/authService.js`
- `backend/src/controllers/authController.js`
- `backend/src/middleware/authMiddleware.js`
- `backend/src/routes/authRoutes.js`
- `backend/src/test-auth.js`
- Updated: `backend/src/index.js` (auth routes enabled)

### 3. Push When Ready
```bash
git add .
git commit -m "Week 2: Authentication module complete"
git push origin main
```

---

## 🧪 Testing (Personal Windows Laptop)

### Step 1: Pull Code
```powershell
cd C:\path\to\gst-compliance-saas
git pull origin main
```

### Step 2: Restart Docker
```powershell
# Stop containers
docker-compose down

# Start containers
docker-compose up -d

# Wait 10 seconds for containers to start

# Check status
docker-compose ps
```

### Step 3: Restart Backend
```powershell
cd backend

# Kill existing process (Ctrl+C if running)

# Start backend
npm run dev
```

Wait for:
```
🚀 ==========================================
   GST Compliance SaaS Backend
   Server: http://localhost:5000
==========================================🚀
```

### Step 4: Run Authentication Tests
**Open a new terminal/PowerShell window:**

```powershell
cd C:\path\to\gst-compliance-saas\backend
node src/test-auth.js
```

### Expected Output:
```
🚀 ==========================================
   GST Compliance SaaS - Authentication Tests
   Week 2: Authentication Module
==========================================🚀

📝 TEST 1: User Registration
✅ Registration successful!

📝 TEST 2: Invalid GSTIN Registration (Should Fail)
✅ Correctly rejected invalid GSTIN

📝 TEST 3: User Login
✅ Login successful!

📝 TEST 4: Get User Profile (Protected Route)
✅ Profile fetched successfully!

📝 TEST 5: Unauthorized Access (Should Fail)
✅ Correctly blocked unauthorized access

📝 TEST 6: Change Password
✅ Password changed successfully!

📝 TEST 7: Login with New Password
✅ Login with new password successful!

📊 ==========================================
   TEST SUMMARY
==========================================
Total Tests:  7
✅ Passed:    7
❌ Failed:    0
Success Rate: 100.0%
==========================================📊

🎉 All tests passed! Authentication module is working perfectly!
```

---

## 🔍 Manual Testing with Postman/Thunder Client

### 1. Register User
**POST** `http://localhost:5000/api/auth/register`

**Body (JSON):**
```json
{
  "email": "yourname@example.com",
  "password": "YourSecurePassword123",
  "businessName": "Your Business Name Pvt Ltd",
  "gstin": "27AAPFU0939F1ZV",
  "pan": "AAPFU0939F",
  "state": "Maharashtra",
  "address": "123 Your Street, Mumbai",
  "phone": "9876543210"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... },
  "business": { ... }
}
```

**Copy the `token` value for next steps!**

### 2. Login
**POST** `http://localhost:5000/api/auth/login`

**Body (JSON):**
```json
{
  "email": "yourname@example.com",
  "password": "YourSecurePassword123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... },
  "businesses": [ ... ]
}
```

### 3. Get Profile (Protected Route)
**GET** `http://localhost:5000/api/auth/me`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "yourname@example.com",
    "role": "owner",
    "businesses": [ ... ]
  }
}
```

### 4. Change Password
**POST** `http://localhost:5000/api/auth/change-password`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body (JSON):**
```json
{
  "oldPassword": "YourSecurePassword123",
  "newPassword": "NewSecurePassword456"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 🧪 Test Different GSTINs

### Valid GSTINs for Testing
```
27AAPFU0939F1ZV - Maharashtra
06AABCU9603R1ZM - Haryana
09AAACH7409R1ZZ - Uttar Pradesh
07AAACN2082N1Z3 - Delhi
29AABCT3518Q1ZV - Karnataka
33AAACN2082N1Z5 - Tamil Nadu
```

### Invalid GSTINs (Should Fail)
```
INVALID123456789 - Invalid format
123456789012345 - No letters
AAPFU0939F1ZVAA - Wrong length
```

---

## 🔧 Troubleshooting

### Issue 1: "Cannot connect to database"
**Solution:**
```powershell
docker-compose ps  # Check if postgres is running
docker-compose logs postgres  # Check logs
docker-compose restart postgres  # Restart
```

### Issue 2: "JWT_SECRET is not defined"
**Solution:**
Check `backend/.env` file has:
```
JWT_SECRET=your_secret_key_here
```

### Issue 3: "Port 5000 already in use"
**Solution:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue 4: "Module not found: authRoutes"
**Solution:**
```powershell
# Make sure you pulled latest code
git pull origin main

# Check file exists
ls backend/src/routes/authRoutes.js
```

### Issue 5: Tests failing with "ECONNREFUSED"
**Solution:**
```powershell
# Make sure backend is running
# Check http://localhost:5000/health in browser
# Should return: {"status":"OK", ...}
```

---

## 📝 What to Report Back

After testing, report:

### ✅ If All Tests Pass:
```
✅ Week 2 Complete!
- All 7 authentication tests passed
- Manual testing successful
- Ready for Week 3 (Invoice Management)
```

### ❌ If Tests Fail:
```
❌ Issue encountered:
- Which test failed: [test name]
- Error message: [exact error]
- Logs from terminal: [paste relevant logs]
```

---

## 🎯 Success Criteria

Week 2 is complete when:
- [x] Code pulled from Git
- [x] Docker containers running
- [x] Backend server running
- [x] All 7 tests passing (100% success rate)
- [x] Can register new user
- [x] Can login
- [x] Can access protected routes
- [x] Invalid GSTIN rejected

---

## 📊 Database Check (Optional)

### View Data in Prisma Studio
```powershell
cd backend
npx prisma studio
```

Opens in browser: `http://localhost:5555`

You can see:
- Users table with registered users
- Businesses table with GSTINs
- Verify data is being saved correctly

---

## 🚀 Next: Week 3 Preview

**Invoice Management Module** will include:
1. Create invoices with GST calculation
2. List/view/edit invoices
3. GST Calculator (CGST/SGST vs IGST logic)
4. Customer management
5. Invoice PDF generation

**Estimated Time:** Week 3 (5-7 days)

---

## 📞 Quick Commands Reference

### Company Laptop (macOS)
```bash
# Pull code
git pull origin main

# Push code
git add .
git commit -m "message"
git push origin main
```

### Personal Laptop (Windows)
```powershell
# Pull code
git pull origin main

# Start Docker
docker-compose up -d

# Start backend
cd backend
npm run dev

# Run tests (in new terminal)
node src/test-auth.js

# View database
npx prisma studio
```

---

**Happy Testing! 🎉**
