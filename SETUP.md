# Setup Instructions - GST Compliance SaaS

## 🎯 You Are Here: Initial Project Setup

**Repository:** https://github.com/guptaumang769/gst-compliance-saas.git  
**Local Path:** `/Users/ugupta6/Downloads/AI-SaaS-Product/gst-compliance-saas/`

---

## ✅ Prerequisites Checklist

Before proceeding, ensure you have installed:

- [ ] **Node.js 20 LTS** - Check: `node --version` (should be v20.x.x)
- [ ] **npm 10+** - Check: `npm --version` (should be 10.x.x)
- [ ] **Docker Desktop** - Check: `docker --version` (should be 24.x.x+)
- [ ] **Docker Compose** - Check: `docker-compose --version` (should be v2.x.x)
- [ ] **Git** - Check: `git --version` (should be 2.x.x+)

If any are missing, install them first:
- Node.js: https://nodejs.org/
- Docker Desktop: https://www.docker.com/products/docker-desktop

---

## 🚀 Step-by-Step Setup

### Step 1: Start Database Services (PostgreSQL + Redis)

```bash
# Navigate to project directory
cd /Users/ugupta6/Downloads/AI-SaaS-Product/gst-compliance-saas

# Start PostgreSQL and Redis with Docker
docker-compose up -d

# Verify containers are running
docker ps

# You should see:
# - gst_saas_db (PostgreSQL on port 5432)
# - gst_saas_redis (Redis on port 6379)
```

**Check Database Connection:**
```bash
# Test PostgreSQL connection
docker exec -it gst_saas_db psql -U postgres -d gst_saas -c "SELECT 1;"

# Should output: 1
```

---

### Step 2: Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies (this will take 2-3 minutes)
npm install

# Copy environment file
cp .env.example .env

# Generate JWT secret (Mac/Linux)
openssl rand -base64 32

# Copy the output and paste it in .env file as JWT_SECRET value
# Edit .env with your favorite editor:
nano .env
# OR
code .env  # If using VS Code
```

**Important:** Edit `.env` and update:
- `JWT_SECRET` - Use the random string generated above
- Keep other values as-is for now (we'll update API keys later)

---

### Step 3: Setup Prisma (Database ORM)

```bash
# Still in backend directory

# Initialize Prisma
npx prisma init

# This creates:
# - prisma/schema.prisma (database schema definition)
# - Adds DATABASE_URL to .env (already done)
```

Now you need to create the Prisma schema. See: `docs/02-DATABASE-SCHEMA.md`

**For now, create a basic schema to test:**

Create/edit `backend/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model (basic for now)
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  emailVerified Boolean   @default(false) @map("email_verified")
  isActive      Boolean   @default(true) @map("is_active")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@map("users")
}
```

**Run migrations:**

```bash
# Create and run migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio to view database
npx prisma studio
# Opens at: http://localhost:5555
```

---

### Step 4: Create Basic Backend Server

Create `backend/src/index.js`:

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'GST SaaS Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes (to be added)
app.get('/api', (req, res) => {
  res.json({
    message: 'GST Compliance SaaS API',
    version: '1.0.0',
    docs: '/api/docs'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
});
```

**Test the backend:**

```bash
# Start backend server
npm run dev

# You should see:
# 🚀 Server running on http://localhost:5000
# 📊 Health check: http://localhost:5000/health

# Open browser: http://localhost:5000/health
# OR use curl:
curl http://localhost:5000/health
```

---

### Step 5: Setup Frontend

```bash
# Open NEW terminal (keep backend running)
# Navigate to project root
cd /Users/ugupta6/Downloads/AI-SaaS-Product/gst-compliance-saas

# Create React app in frontend directory
npx create-react-app frontend

# Navigate to frontend
cd frontend

# Install UI libraries
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material

# Install other dependencies
npm install react-router-dom axios @reduxjs/toolkit react-redux
npm install react-hook-form yup @hookform/resolvers date-fns

# Start frontend
npm start

# Opens browser at: http://localhost:3000
# You should see React logo
```

**Test API connection:**

Edit `frontend/src/App.js` to test backend connection:

```javascript
import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => console.error('Backend not reachable:', err));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>GST Compliance SaaS</h1>
        {health ? (
          <div>
            <p>✅ Backend Status: {health.status}</p>
            <p>📡 Message: {health.message}</p>
            <p>🕐 Time: {new Date(health.timestamp).toLocaleString()}</p>
          </div>
        ) : (
          <p>🔄 Connecting to backend...</p>
        )}
      </header>
    </div>
  );
}

export default App;
```

**If you see backend data on frontend → ✅ Setup successful!**

---

### Step 6: Commit Your Initial Setup

```bash
# Navigate to project root
cd /Users/ugupta6/Downloads/AI-SaaS-Product/gst-compliance-saas

# Check status
git status

# Add all files (excluding .env due to .gitignore)
git add .

# Commit
git commit -m "Initial project setup: Backend + Frontend + Docker + Database"

# Push to GitHub
git push origin main
```

---

## ✅ Setup Complete Checklist

After following all steps, verify:

- [ ] PostgreSQL running: `docker ps | grep gst_saas_db`
- [ ] Redis running: `docker ps | grep gst_saas_redis`
- [ ] Backend running: http://localhost:5000/health shows "OK"
- [ ] Prisma Studio accessible: http://localhost:5555
- [ ] Frontend running: http://localhost:3000 shows React app
- [ ] Frontend can connect to backend (shows backend status)
- [ ] Git repository is up to date: `git status` shows "nothing to commit"

---

## 🎯 What's Next?

Now that setup is complete, you're ready to start Week 2 tasks:

### **Week 2: Build Authentication Module**

Follow: [docs/05-PHASE-PLAN.md - Week 2](docs/05-PHASE-PLAN.md)

**Your next tasks:**
1. Create user authentication API (register, login)
2. Implement GSTIN validation
3. Create registration and login pages
4. Setup JWT authentication middleware

**Start here:** Create `backend/src/controllers/authController.js`

See detailed guide: [docs/04-DESIGN-DOCUMENT.md - Authentication Service](docs/04-DESIGN-DOCUMENT.md)

---

## 🛠️ Useful Commands Reference

### Docker Commands:
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

### Backend Commands:
```bash
cd backend

# Development mode (auto-reload)
npm run dev

# Production mode
npm start

# Database migrations
npm run prisma:migrate

# View database
npm run prisma:studio

# Run tests
npm test
```

### Frontend Commands:
```bash
cd frontend

# Development mode
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Git Commands:
```bash
# Check status
git status

# Add files
git add .

# Commit
git commit -m "Your message"

# Push to GitHub
git push origin main

# Pull latest
git pull origin main
```

---

## 🐛 Troubleshooting

### Issue: Docker containers won't start
```bash
# Check if ports are already in use
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# If occupied, kill the processes or change ports in docker-compose.yml
```

### Issue: Cannot connect to database
```bash
# Check if container is running
docker ps

# Check logs
docker logs gst_saas_db

# Verify DATABASE_URL in .env matches docker-compose.yml credentials
```

### Issue: "Module not found" errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Prisma errors
```bash
# Reset database
npx prisma migrate reset

# Regenerate client
npx prisma generate
```

---

## 📞 Need Help?

- **Documentation:** Check `/docs` folder
- **Quick Reference:** See `README.md`
- **Week Plan:** See `docs/05-PHASE-PLAN.md`
- **Technical Design:** See `docs/04-DESIGN-DOCUMENT.md`

---

**Setup completed? Great! Now start coding! 🚀**

**Next:** [Week 2 - Authentication Module](docs/05-PHASE-PLAN.md#week-2-authentication--user-management)
