# 🎨 Frontend Setup Guide - Week 13-14

**Welcome to Frontend Development!** This guide will help you set up and run the React frontend for GST Compliance SaaS.

---

## 📋 What's Been Created

### ✅ Complete Frontend Structure:

```
frontend/
├── public/                    # Static assets
├── src/
│   ├── components/           # Reusable UI components
│   │   └── layout/          # Layout components
│   │       └── MainLayout.jsx
│   ├── pages/               # Page components
│   │   ├── auth/           # Authentication pages
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── CustomersPage.jsx
│   │   ├── InvoicesPage.jsx
│   │   ├── SuppliersPage.jsx
│   │   ├── PurchasesPage.jsx
│   │   ├── GSTReturnsPage.jsx
│   │   └── SettingsPage.jsx
│   ├── services/           # API service layer
│   │   └── api.js
│   ├── context/            # React Context (state management)
│   │   └── AuthContext.jsx
│   ├── utils/              # Utility functions
│   ├── styles/             # Global styles
│   ├── App.jsx             # Main app component with routing
│   └── main.jsx            # Application entry point
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies
├── .gitignore             # Git ignore rules
└── env.example            # Environment variables template
```

### ✅ Tech Stack:

- **React 18** - Modern UI library
- **Vite** - Fast build tool (faster than Create React App)
- **Material-UI (MUI)** - Beautiful, professional UI components
- **React Router v6** - Navigation and routing
- **Axios** - HTTP client for API calls
- **Formik + Yup** - Form handling and validation
- **React Context** - State management for auth
- **React Toastify** - Toast notifications

---

## 🚀 Setup Instructions

### **Step 1: Install Dependencies (Mac)**

```bash
cd /Users/ugupta6/Downloads/AI-SaaS-Product/gst-compliance-saas/frontend

# Install all npm packages
npm install
```

**This will take 2-3 minutes.** It installs all the libraries needed for the frontend.

---

### **Step 2: Configure Environment Variables**

```bash
# Copy env.example to .env
cp env.example .env

# The default configuration should work:
# VITE_API_URL=http://localhost:5000
```

**Note:** The frontend runs on port 3000, backend on port 5000.

---

### **Step 3: Start Frontend Development Server**

```bash
# Make sure you're in the frontend directory
npm run dev
```

**Expected output:**
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**✅ Frontend is now running on http://localhost:3000**

---

### **Step 4: Test the Application**

1. **Open browser:** http://localhost:3000
2. You should see the **Login Page**
3. Click **"Register here"** to create an account

---

## 🖥️ Setup on Windows Laptop

### **Step 1: Clone/Pull Latest Code**

```powershell
cd C:\Users\gupta\AI-SaaS-Project\gst-compliance-saas
git pull origin main
```

### **Step 2: Install Dependencies**

```powershell
cd frontend
npm install
```

### **Step 3: Configure Environment**

```powershell
# Copy env.example to .env
Copy-Item env.example .env
```

### **Step 4: Start Frontend**

```powershell
npm run dev
```

**Open browser:** http://localhost:3000

---

## 🧪 Testing the Authentication Flow

### **Test 1: Register New Account**

1. Go to http://localhost:3000 (will redirect to `/login`)
2. Click **"Register here"**
3. **Step 1 - User Details:**
   - Email: `test@gstcompliance.com`
   - Password: `SecurePassword123`
   - Confirm Password: `SecurePassword123`
   - Click **Next**

4. **Step 2 - Business Details:**
   - Business Name: `Test Business Ltd`
   - Business Type: `Private Limited`
   - GSTIN: `27AABCT1332L1ZM`
   - PAN: `AABCT1332L`
   - Address Line 1: `123 Test Street`
   - City: `Mumbai`
   - State: `Maharashtra`
   - Pincode: `400001`
   - Phone: `9876543210`
   - Business Email: `business@test.com`
   - Click **Register**

5. **Expected Result:**
   - ✅ Success toast notification
   - ✅ Redirected to Dashboard
   - ✅ Sidebar navigation visible
   - ✅ User avatar in top-right

---

### **Test 2: Login**

1. Logout (click avatar → Logout)
2. Go to `/login`
3. Enter:
   - Email: `test@gstcompliance.com`
   - Password: `SecurePassword123`
4. Click **Sign In**

**Expected Result:**
- ✅ Success toast
- ✅ Redirected to Dashboard

---

### **Test 3: Navigation**

Click each sidebar menu item:
- ✅ Dashboard (works)
- ✅ Customers (placeholder page)
- ✅ Invoices (placeholder page)
- ✅ Suppliers (placeholder page)
- ✅ Purchases (placeholder page)
- ✅ GST Returns (placeholder page)
- ✅ Settings (placeholder page)

**Expected:** Each page loads with "Coming soon" message.

---

## 📱 Features Implemented (Week 13-14)

### ✅ **Authentication:**
- [x] Login page with email/password
- [x] Registration page (2-step form)
- [x] GSTIN validation
- [x] PAN validation
- [x] Password strength validation
- [x] JWT token management
- [x] Protected routes (require login)
- [x] Public routes (redirect if logged in)
- [x] Logout functionality

### ✅ **Layout:**
- [x] Responsive sidebar navigation
- [x] Top app bar with user info
- [x] Mobile-friendly menu
- [x] User avatar and profile menu
- [x] Active route highlighting

### ✅ **API Integration:**
- [x] Axios interceptors for auth token
- [x] Auto-redirect on 401 (unauthorized)
- [x] API service layer for all backend endpoints
- [x] Error handling with toast notifications

### ✅ **UI/UX:**
- [x] Material-UI theme
- [x] Form validation with Formik + Yup
- [x] Loading states
- [x] Success/error toast notifications
- [x] Clean, professional design

---

## 🔧 Troubleshooting

### **Issue 1: Port 3000 already in use**

```bash
# Kill process on port 3000
# Mac:
lsof -ti:3000 | xargs kill -9

# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

---

### **Issue 2: Backend API not connecting**

**Check:**
1. Backend is running: http://localhost:5000/health
2. Docker containers are up: `docker-compose ps`
3. Frontend `.env` has correct API URL

---

### **Issue 3: "Module not found" errors**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### **Issue 4: GSTIN validation failing**

**Valid GSTIN format:** `27AABCT1332L1ZM`
- 2 digits (state code)
- 10 characters (PAN)
- 1 digit (entity number)
- 1 character (Z for default)
- 1 alphanumeric (checksum)

---

## 📂 Project Structure Explained

### **`src/main.jsx`**
- Application entry point
- Sets up React Router, Material-UI theme, AuthContext

### **`src/App.jsx`**
- Defines all routes
- Implements ProtectedRoute and PublicRoute logic

### **`src/context/AuthContext.jsx`**
- Manages authentication state
- Provides `login`, `register`, `logout` functions
- Stores JWT token and user data

### **`src/services/api.js`**
- Axios instance with base URL
- Interceptors for adding auth token
- API functions for all backend endpoints

### **`src/pages/auth/`**
- Login and Register pages
- Form validation
- API integration

### **`src/components/layout/MainLayout.jsx`**
- Sidebar navigation
- Top app bar
- User menu

---

## 🎯 What's Next? (Week 15-16)

After you verify Week 13-14 is working:

### **Week 15-16: Dashboard & Charts**
- Real-time stats (total customers, invoices, tax liability)
- Charts for sales trends, tax breakdown
- Top customers/suppliers tables
- Quick actions (create invoice, add customer)

---

## ✅ Verification Checklist

Before proceeding to Week 15-16, verify:

- [ ] Frontend runs on http://localhost:3000
- [ ] Backend runs on http://localhost:5000
- [ ] Docker containers are up
- [ ] Can register a new user with GSTIN
- [ ] Can login with registered credentials
- [ ] Dashboard loads after login
- [ ] All sidebar menu items are clickable
- [ ] Logout works and redirects to login
- [ ] Toast notifications appear for success/error
- [ ] Mobile responsive (try resizing browser)

---

## 📝 Important Commands

### **Development:**
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check for code issues
```

### **Debugging:**
```bash
# View console logs in browser
# Chrome: F12 → Console tab
# Firefox: F12 → Console tab

# Check Network tab for API calls
# Chrome: F12 → Network tab
```

---

## 🔐 Security Features

- [x] JWT token stored in localStorage
- [x] Token included in all API requests (Authorization header)
- [x] Auto-logout on 401 response
- [x] Password validation (min 8 chars, uppercase, number)
- [x] GSTIN format validation
- [x] PAN format validation
- [x] Protected routes (redirect to login if not authenticated)

---

## 🎨 UI Customization

### **Change Theme Colors:**

Edit `frontend/src/main.jsx`:

```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',  // Change this to your brand color
    },
    secondary: {
      main: '#dc004e',  // Change this too
    },
  },
});
```

---

## 📞 Support

If you encounter any issues:
1. Check the browser console (F12)
2. Check backend logs (`npm run dev` output)
3. Verify Docker containers are running
4. Check `.env` file configuration

---

## 🎉 Congratulations!

You now have a **fully functional authentication system** with:
- ✅ Beautiful Material-UI design
- ✅ Responsive layout
- ✅ Form validation
- ✅ API integration
- ✅ Protected routes
- ✅ Professional user experience

**Ready to move to Week 15-16: Dashboard & Charts!**

---

**Generated:** January 28, 2026  
**Week:** 13-14 (Authentication & Layout)  
**Status:** ✅ Ready for Testing
