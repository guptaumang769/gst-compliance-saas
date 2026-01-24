# Development Workflow - Split Development & Testing

## 🎯 Overview

**Your Setup:**
- **Company Laptop:** Code development (no Docker needed)
- **Personal Laptop:** Testing & running the application

**Repository:** https://github.com/guptaumang769/gst-compliance-saas.git

---

## 💻 Company Laptop (Development Machine)

### **What You'll Do:**
✅ Write code in VS Code or any editor  
✅ Review documentation  
✅ Git commits after each feature  
✅ Push to GitHub  
❌ **No need to run Docker, backend, or frontend!**

### **Setup (One-Time):**

```bash
# Already done! Your repository is at:
cd /Users/ugupta6/Downloads/AI-SaaS-Product/gst-compliance-saas

# Verify Git is configured
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Check remote
git remote -v
# Should show: https://github.com/guptaumang769/gst-compliance-saas.git
```

### **Daily Workflow:**

#### **1. Check What Needs to Be Done**
```bash
# Review weekly plan
cat docs/05-PHASE-PLAN.md

# Or open in editor
code docs/05-PHASE-PLAN.md
```

#### **2. Write Code**
```bash
cd /Users/ugupta6/Downloads/AI-SaaS-Product/gst-compliance-saas

# Example: Week 2 - Authentication
# Create authentication controller
code backend/src/controllers/authController.js

# Refer to design document for implementation
code docs/04-DESIGN-DOCUMENT.md
```

#### **3. Commit & Push After Each Feature**
```bash
# Check what changed
git status

# Add files
git add .

# Commit with descriptive message
git commit -m "Week 2: Add user registration endpoint"

# Push to GitHub
git push origin main
```

#### **4. Notify Your Personal Laptop**
```
Send yourself a message:
"Pushed new code - authentication endpoint added. Please test on personal laptop."
```

---

## 🏠 Personal Laptop (Testing Machine)

### **What You'll Do:**
✅ Clone repository  
✅ Run Docker containers  
✅ Run backend & frontend  
✅ Test features  
✅ Report bugs/issues  
✅ Pull latest code regularly

### **Setup (One-Time):**

Follow: **TESTING-GUIDE.md**

```bash
# Clone repository
git clone https://github.com/guptaumang769/gst-compliance-saas.git
cd gst-compliance-saas

# Start databases
docker-compose up -d

# Setup backend
cd backend
npm install
npx prisma migrate dev --name init

# Start backend
npm run dev
```

### **Daily Workflow:**

#### **1. Pull Latest Code**
```bash
cd ~/Projects/gst-compliance-saas  # or wherever you cloned

# Pull changes from GitHub
git pull origin main

# Check what changed
git log -3
```

#### **2. Update Dependencies (if needed)**
```bash
# If package.json changed
cd backend && npm install
# OR
cd frontend && npm install
```

#### **3. Run Migrations (if database schema changed)**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

#### **4. Start Services & Test**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend (when ready)
cd frontend
npm start

# Terminal 3: Testing
curl http://localhost:5000/health
# Or use Postman, browser, etc.
```

#### **5. Report Issues**
- Note down any bugs, errors, or unexpected behavior
- Take screenshots if UI issue
- Copy error logs from terminal
- Message back to company laptop for fixes

---

## 🔄 Complete Workflow Example

### **Scenario: Implementing User Authentication (Week 2)**

#### **Company Laptop:**

```bash
# Day 1: Morning
cd /Users/ugupta6/Downloads/AI-SaaS-Product/gst-compliance-saas

# Read implementation guide
code docs/04-DESIGN-DOCUMENT.md
# Section: Authentication Service

# Create authentication controller
code backend/src/controllers/authController.js
# Write registration logic...

# Create authentication service
code backend/src/services/authService.js
# Write business logic...

# Commit
git add backend/src/controllers/authController.js
git add backend/src/services/authService.js
git commit -m "Week 2: Add registration controller and service"
git push origin main

# Evening: Message yourself
"Pushed registration API. Please test POST /api/auth/register"
```

#### **Personal Laptop:**

```bash
# Day 1: Evening (after work)
cd ~/Projects/gst-compliance-saas

# Pull latest code
git pull origin main

# Check what changed
git log -1

# Update dependencies (if needed)
cd backend && npm install

# Restart backend
npm run dev

# Test the API
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "businessName": "Test Company",
    "gstin": "27AABCT1332L1ZM"
  }'

# Results:
# ✅ Works: "Great! Registration working perfectly."
# ❌ Error: "Getting 500 error: 'Cannot read property...'" 
#          → Message back with error details
```

#### **Company Laptop (Next Day):**

```bash
# Read the error report
# Fix the bug
code backend/src/services/authService.js

# Test locally (just read code, no need to run)
# Commit fix
git add backend/src/services/authService.js
git commit -m "Fix: Handle null GSTIN in registration"
git push origin main

# Message: "Fixed the registration error. Please test again."
```

---

## 📅 Weekly Workflow

### **Monday (Company Laptop):**
- Review week's tasks from `docs/05-PHASE-PLAN.md`
- Read relevant sections in design docs
- Start implementing first feature

### **Tuesday-Thursday (Company Laptop):**
- Write code for features
- Commit after each small feature
- Push to GitHub at least once per day

### **Thursday Evening (Personal Laptop):**
- Pull all week's code
- Test all features
- Report any issues

### **Friday (Company Laptop):**
- Fix bugs reported from personal laptop
- Finalize week's features
- Update documentation if needed

### **Saturday:**
- Team sync call at 10 AM
- Demo working features (from personal laptop)
- Plan next week

---

## 🛠️ Tools & Tips

### **Company Laptop - Recommended Tools:**
- **VS Code** - Code editor
- **Git** - Version control
- **Postman** (optional) - API documentation
- **Markdown Preview** - Read docs easily

### **Personal Laptop - Recommended Tools:**
- **Docker Desktop** - Run databases
- **VS Code** - For viewing code
- **Postman** - API testing
- **Browser DevTools** - Frontend testing
- **Prisma Studio** - Database viewer

### **Communication:**
- Quick messages about code pushes
- Detailed bug reports with screenshots/logs
- Weekly sync for bigger discussions

---

## 📊 File Organization

### **What Goes in Git (Gets Synced):**
✅ All source code (`src/`, `controllers/`, etc.)  
✅ Configuration templates (`.env.example`)  
✅ Documentation (`docs/`, `*.md`)  
✅ Docker configs (`docker-compose.yml`)  
✅ Dependencies list (`package.json`)

### **What Doesn't Go in Git (Local Only):**
❌ `.env` (environment variables with secrets)  
❌ `node_modules/` (dependencies - too large)  
❌ Database files (local data)  
❌ Log files  
❌ Build artifacts

**Note:** Already configured in `.gitignore`!

---

## ⚠️ Important Notes

### **For Company Laptop:**
1. ✅ **DO commit frequently** (after each small feature)
2. ✅ **DO write descriptive commit messages**
3. ✅ **DO push to GitHub at least daily**
4. ❌ **DON'T commit `.env` files** (has secrets!)
5. ❌ **DON'T commit `node_modules/`** (too large)

### **For Personal Laptop:**
1. ✅ **DO pull before starting testing**
2. ✅ **DO test thoroughly**
3. ✅ **DO report issues promptly**
4. ❌ **DON'T make code changes here** (use company laptop)
5. ❌ **DON'T push from personal laptop** (unless agreed)

---

## 🐛 Troubleshooting

### **Company Laptop: "Can't push to GitHub"**
```bash
# Check if you're logged in
git config --list | grep user

# If not configured:
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# If authentication fails, use GitHub token
# Settings → Developer Settings → Personal Access Tokens
# Generate token and use as password
```

### **Personal Laptop: "Code not updating"**
```bash
# Make sure you're on main branch
git branch
# Should show: * main

# Force pull if needed
git fetch origin
git reset --hard origin/main

# WARNING: This discards local changes!
```

### **Out of Sync Issues:**
```bash
# If both laptops have different code:

# Company Laptop: Force push (be careful!)
git push --force origin main

# Personal Laptop: Force pull
git fetch origin
git reset --hard origin/main
```

---

## ✅ Quick Checklist

### **Before Pushing Code (Company Laptop):**
- [ ] Code works (no syntax errors)
- [ ] Removed console.logs and debug code
- [ ] Updated comments
- [ ] `.env` is not being committed
- [ ] Commit message is descriptive
- [ ] Pushed to GitHub successfully

### **Before Testing (Personal Laptop):**
- [ ] Pulled latest code (`git pull`)
- [ ] Docker containers running
- [ ] Backend dependencies updated if needed
- [ ] Database migrations run if schema changed
- [ ] Backend starts without errors

---

## 🎯 Success Metrics

### **Good Workflow:**
- Code pushed daily ✅
- Features tested within 1 day ✅
- Bugs fixed quickly ✅
- Weekly progress visible ✅
- No merge conflicts ✅

### **Issues to Avoid:**
- Code not pushed for days ❌
- Features not tested ❌
- Bugs piling up ❌
- Unclear commit messages ❌
- Merge conflicts ❌

---

## 📞 Need Help?

### **Technical Issues:**
- Check SETUP.md or TESTING-GUIDE.md
- Review relevant docs in `/docs` folder
- Team sync on Saturday

### **Git Issues:**
- Git documentation: https://git-scm.com/doc
- GitHub guides: https://guides.github.com/

### **Workflow Issues:**
- Review this guide
- Discuss in team chat
- Adjust workflow as needed

---

**This workflow lets you develop productively on your company laptop while testing on your personal laptop!** 🚀

**Remember:**
- **Company Laptop = Write Code**
- **Personal Laptop = Test Code**
- **GitHub = Bridge Between Both**

---

**Ready to start? Check what's been set up for you next!** ✅
