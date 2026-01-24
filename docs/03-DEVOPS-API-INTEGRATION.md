# GST Compliance SaaS - DevOps Strategy & API Integration

## Overview
This document outlines the DevOps infrastructure, CI/CD pipeline, API integrations, and deployment strategy for the GST Compliance SaaS platform.

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** React.js (with Next.js for SSR/SEO) or Vite + React
- **UI Library:** Material-UI (MUI) or Ant Design
- **State Management:** Redux Toolkit or Zustand
- **Forms:** React Hook Form + Yup validation
- **HTTP Client:** Axios
- **PDF Generation:** react-pdf or jsPDF

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js or Fastify
- **ORM:** Prisma (recommended) or Sequelize
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Joi or Zod
- **API Documentation:** Swagger/OpenAPI

### Database
- **Primary DB:** PostgreSQL 15+
- **Cache:** Redis (for sessions, rate limiting)
- **File Storage:** AWS S3 or DigitalOcean Spaces

### Infrastructure
- **Cloud Provider:** AWS or DigitalOcean (cost-effective for MVP)
- **Container:** Docker
- **Orchestration:** Docker Compose (MVP), Kubernetes (later)
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt (certbot)

---

## 🏛️ System Architecture

```
┌─────────────┐
│   Users     │
│ (Browsers)  │
└──────┬──────┘
       │
       │ HTTPS
       ▼
┌─────────────────────┐
│   Cloudflare CDN    │  ← DDoS protection, SSL
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Load Balancer     │  ← AWS ALB or Nginx
│   (nginx)           │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌─────────┐ ┌─────────┐
│ Frontend│ │ Backend │  ← Docker containers
│ (React) │ │ (Node)  │
└─────────┘ └────┬────┘
                 │
        ┌────────┼────────┐
        │        │        │
        ▼        ▼        ▼
    ┌─────┐  ┌──────┐ ┌─────┐
    │ DB  │  │Redis │ │ S3  │
    │(RDS)│  │Cache │ │Files│
    └─────┘  └──────┘ └─────┘
        │
        ▼
  ┌──────────────┐
  │ External APIs│
  │ - GST Portal │
  │ - Razorpay   │
  │ - Email SMTP │
  └──────────────┘
```

---

## 🐳 Docker Configuration

### Directory Structure
```
gst-compliance-saas/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── database/
│   └── init.sql
├── docker-compose.yml
├── docker-compose.prod.yml
└── nginx/
    └── nginx.conf
```

### docker-compose.yml (Development)
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:15
    container_name: gst_saas_db
    environment:
      POSTGRES_DB: gst_saas
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - gst_network

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: gst_saas_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - gst_network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: gst_saas_backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/gst_saas
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      PORT: 5000
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - db
      - redis
    networks:
      - gst_network
    command: npm run dev

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: gst_saas_frontend
    environment:
      REACT_APP_API_URL: http://localhost:5000/api
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - gst_network
    command: npm start

volumes:
  postgres_data:
  redis_data:

networks:
  gst_network:
    driver: bridge
```

### backend/Dockerfile
```dockerfile
# Development Stage
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]

# Production Stage
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["node", "dist/index.js"]
```

### frontend/Dockerfile
```dockerfile
# Development Stage
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]

# Production Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine AS production

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 🚀 CI/CD Pipeline

### Tool: GitHub Actions

### .github/workflows/ci-cd.yml
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # Linting & Testing
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: gst_saas_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      # Backend Tests
      - name: Install backend dependencies
        run: cd backend && npm ci
      
      - name: Run backend linter
        run: cd backend && npm run lint
      
      - name: Run backend tests
        run: cd backend && npm test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/gst_saas_test
      
      # Frontend Tests
      - name: Install frontend dependencies
        run: cd frontend && npm ci
      
      - name: Run frontend linter
        run: cd frontend && npm run lint
      
      - name: Run frontend tests
        run: cd frontend && npm test
      
      - name: Build frontend
        run: cd frontend && npm run build

  # Deploy to Staging (on develop branch)
  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Deploy to staging
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/gst-saas-staging
            git pull origin develop
            docker-compose -f docker-compose.prod.yml down
            docker-compose -f docker-compose.prod.yml up -d --build
            docker-compose exec -T backend npm run migrate

  # Deploy to Production (on main branch)
  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Build and push Docker images
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker build -t gst-saas-backend:${{ github.sha }} ./backend
          docker build -t gst-saas-frontend:${{ github.sha }} ./frontend
          docker push gst-saas-backend:${{ github.sha }}
          docker push gst-saas-frontend:${{ github.sha }}
      
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/gst-saas-prod
            docker-compose pull
            docker-compose up -d
            docker system prune -af
```

---

## 🌐 Nginx Configuration

### nginx/nginx.conf (Production)
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

# Upstream backend
upstream backend {
    server backend:5000;
}

server {
    listen 80;
    server_name gst-saas.com www.gst-saas.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gst-saas.com www.gst-saas.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/gst-saas.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gst-saas.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend (Static Files)
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Auth endpoints (stricter rate limiting)
    location /api/auth/ {
        limit_req zone=auth_limit burst=3 nodelay;
        
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Health Check
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

---

## 🔌 API Integrations

### 1. GST Portal API Integration ✅ CRITICAL

#### Overview:
The GST Portal provides APIs for:
- Fetching GSTR-2A/2B (purchase reconciliation)
- Filing GSTR-1, GSTR-3B
- Fetching business details from GSTIN
- E-way bill generation

#### GST Portal API Documentation:
- **Official API Docs:** https://developer.gst.gov.in/
- **Authentication:** Based on DSC (Digital Signature Certificate) or OTP

#### Implementation:

**File:** `backend/services/gstPortalAPI.js`

```javascript
const axios = require('axios');

class GSTPortalAPI {
  constructor() {
    this.baseURL = process.env.GST_API_BASE_URL || 'https://api.gst.gov.in';
    this.apiKey = process.env.GST_API_KEY;
  }

  /**
   * Fetch business details from GSTIN
   * ✅ GST INTEGRATION POINT
   */
  async fetchBusinessDetails(gstin) {
    try {
      const response = await axios.get(
        `${this.baseURL}/taxpayers/${gstin}`,
        {
          headers: {
            'X-API-KEY': this.apiKey,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching GST business details:', error);
      throw new Error('Failed to fetch business details from GST portal');
    }
  }

  /**
   * Fetch GSTR-2A (purchase invoices from suppliers)
   * ✅ GST INTEGRATION POINT - for ITC reconciliation
   */
  async fetchGSTR2A(gstin, taxPeriod) {
    try {
      const response = await axios.get(
        `${this.baseURL}/returns/gstr2a`,
        {
          params: {
            gstin: gstin,
            ret_period: taxPeriod, // Format: MMYYYY
          },
          headers: {
            'X-API-KEY': this.apiKey,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching GSTR-2A:', error);
      throw new Error('Failed to fetch GSTR-2A');
    }
  }

  /**
   * Submit GSTR-1 to GST Portal
   * ✅ GST INTEGRATION POINT - auto-filing
   */
  async submitGSTR1(gstin, taxPeriod, gstr1Data) {
    try {
      const response = await axios.post(
        `${this.baseURL}/returns/gstr1`,
        {
          gstin: gstin,
          ret_period: taxPeriod,
          data: gstr1Data, // JSON as per GST schema
        },
        {
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data; // Returns ARN (Acknowledgement Reference Number)
    } catch (error) {
      console.error('Error submitting GSTR-1:', error);
      throw new Error('Failed to submit GSTR-1');
    }
  }

  /**
   * Validate GSTIN format and checksum
   * ✅ GST INTEGRATION POINT
   */
  validateGSTIN(gstin) {
    // GSTIN Format: 22AAAAA0000A1Z5
    // 2 digits state code + 10 digits PAN + 1 digit entity number + 1 letter 'Z' + 1 checksum digit
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    
    if (!gstinRegex.test(gstin)) {
      return { valid: false, message: 'Invalid GSTIN format' };
    }

    // Checksum validation (simplified - implement full checksum logic)
    // Actual implementation: https://github.com/swarup4/gstin-validator
    
    return { valid: true, message: 'Valid GSTIN' };
  }
}

module.exports = new GSTPortalAPI();
```

#### GST API Endpoints Needed:

| API | Purpose | Priority | MVP? |
|-----|---------|----------|------|
| `/taxpayers/:gstin` | Fetch business details | P1 | ✅ Yes |
| `/returns/gstr2a` | Fetch purchase invoices (ITC) | P2 | ⏳ Post-MVP |
| `/returns/gstr2b` | Fetch auto-drafted GSTR-2B | P2 | ⏳ Post-MVP |
| `/returns/gstr1` | Submit GSTR-1 | P2 | ⏳ Post-MVP (manual upload first) |
| `/returns/gstr3b` | Submit GSTR-3B | P2 | ⏳ Post-MVP |
| `/ewb/generate` | E-way bill generation | P3 | ❌ Phase 2 |

**For MVP:** Focus on generating correct JSON files. Users will manually upload to GST portal.

---

### 2. Razorpay Payment Integration

#### Overview:
Razorpay handles subscription payments.

#### Implementation:

**File:** `backend/services/razorpayAPI.js`

```javascript
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class RazorpayAPI {
  /**
   * Create a subscription order
   */
  async createOrder(amount, currency = 'INR', receipt) {
    const options = {
      amount: amount * 100, // Amount in paise
      currency: currency,
      receipt: receipt,
      payment_capture: 1, // Auto-capture
    };

    try {
      const order = await razorpay.orders.create(options);
      return order;
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      throw new Error('Payment order creation failed');
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(orderId, paymentId, signature) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(orderId + '|' + paymentId);
    const generatedSignature = hmac.digest('hex');

    return generatedSignature === signature;
  }

  /**
   * Create recurring subscription
   */
  async createSubscription(planId, customerId, totalCount = 12) {
    const options = {
      plan_id: planId,
      customer_notify: 1,
      total_count: totalCount, // 12 months
    };

    try {
      const subscription = await razorpay.subscriptions.create(options);
      return subscription;
    } catch (error) {
      console.error('Razorpay subscription creation failed:', error);
      throw new Error('Subscription creation failed');
    }
  }
}

module.exports = new RazorpayAPI();
```

#### Razorpay Webhook (for payment confirmations):

**File:** `backend/routes/webhooks/razorpay.js`

```javascript
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

router.post('/razorpay-webhook', async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Verify webhook signature
  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  if (digest !== req.headers['x-razorpay-signature']) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body.event;
  const payload = req.body.payload;

  // Handle payment events
  if (event === 'payment.captured') {
    // Update subscription status in DB
    const paymentId = payload.payment.entity.id;
    const orderId = payload.payment.entity.order_id;
    const amount = payload.payment.entity.amount / 100;

    // Update database
    await updateSubscriptionPayment(orderId, paymentId, 'paid');
  }

  if (event === 'payment.failed') {
    // Handle failed payment
    await updateSubscriptionPayment(payload.payment.entity.order_id, null, 'failed');
  }

  res.status(200).send('OK');
});

module.exports = router;
```

---

### 3. Email Service (SMTP) - SendGrid or AWS SES

#### Implementation:

**File:** `backend/services/emailService.js`

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g., smtp.sendgrid.net
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

class EmailService {
  async sendEmail(to, subject, htmlContent) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@gst-saas.com',
      to: to,
      subject: subject,
      html: htmlContent,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  }

  // Send invoice to customer
  async sendInvoice(customerEmail, invoiceNumber, pdfUrl) {
    const subject = `Invoice ${invoiceNumber} from GST SaaS`;
    const html = `
      <h2>Invoice ${invoiceNumber}</h2>
      <p>Please find your invoice attached.</p>
      <a href="${pdfUrl}">Download Invoice</a>
    `;
    await this.sendEmail(customerEmail, subject, html);
  }

  // Send filing deadline reminder
  async sendDeadlineReminder(userEmail, returnType, deadline) {
    const subject = `Reminder: ${returnType} filing due on ${deadline}`;
    const html = `
      <h2>GST Filing Reminder</h2>
      <p>Your ${returnType} is due on <strong>${deadline}</strong>.</p>
      <p>Please file your return to avoid penalties.</p>
      <a href="https://gst-saas.com/returns">File Now</a>
    `;
    await this.sendEmail(userEmail, subject, html);
  }
}

module.exports = new EmailService();
```

---

### 4. AWS S3 (File Storage for PDFs, JSON files)

#### Implementation:

**File:** `backend/services/s3Service.js`

```javascript
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1',
});

class S3Service {
  async uploadFile(fileBuffer, fileName, contentType) {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'private', // Don't make files public
    };

    try {
      const result = await s3.upload(params).promise();
      return result.Location; // S3 URL
    } catch (error) {
      console.error('S3 upload failed:', error);
      throw new Error('File upload failed');
    }
  }

  async getSignedUrl(fileName, expiresIn = 3600) {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Expires: expiresIn, // URL valid for 1 hour
    };

    try {
      const url = await s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      console.error('S3 signed URL generation failed:', error);
      throw new Error('Failed to generate download URL');
    }
  }
}

module.exports = new S3Service();
```

---

## 🔐 Security Best Practices

### 1. Environment Variables
```bash
# .env file (NEVER commit to Git)
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379
JWT_SECRET=your-256-bit-secret
JWT_EXPIRES_IN=7d

# GST Portal API
GST_API_BASE_URL=https://api.gst.gov.in
GST_API_KEY=your-gst-api-key

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxx
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
```

### 2. Rate Limiting (Express middleware)
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: 'Too many requests, please try again later.',
});

app.use('/api/', apiLimiter);
```

### 3. Input Validation (Joi)
```javascript
const Joi = require('joi');

const invoiceSchema = Joi.object({
  customer_id: Joi.string().uuid().required(),
  invoice_date: Joi.date().required(),
  items: Joi.array().items(
    Joi.object({
      product_id: Joi.string().uuid().required(),
      quantity: Joi.number().min(0).required(),
      rate: Joi.number().min(0).required(),
    })
  ).min(1).required(),
});

// Usage
const { error, value } = invoiceSchema.validate(req.body);
if (error) {
  return res.status(400).json({ message: error.details[0].message });
}
```

---

## 📊 Monitoring & Logging

### 1. Application Monitoring: PM2 (Node.js process manager)
```bash
npm install -g pm2

# Start application
pm2 start backend/src/index.js --name gst-saas-api

# Monitor
pm2 monit

# Logs
pm2 logs gst-saas-api

# Auto-restart on crashes
pm2 startup
pm2 save
```

### 2. Error Tracking: Sentry
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Error handler middleware
app.use(Sentry.Handlers.errorHandler());
```

### 3. Logging: Winston
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;
```

---

## 🚨 Backup & Disaster Recovery

### 1. Database Backups (Automated)
```bash
# Cron job: Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-db.sh

# backup-db.sh
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="gst_saas_backup_$TIMESTAMP.sql"

pg_dump -U postgres -h localhost gst_saas > /backups/$BACKUP_FILE
gzip /backups/$BACKUP_FILE

# Upload to S3
aws s3 cp /backups/$BACKUP_FILE.gz s3://gst-saas-backups/

# Delete local backup (keep only last 7 days)
find /backups -name "*.sql.gz" -mtime +7 -delete
```

### 2. Application Backups
- **Code:** Git (GitHub/GitLab)
- **Files (PDFs, JSON):** AWS S3 with versioning enabled
- **Environment configs:** Encrypted and stored in AWS Secrets Manager

---

## 📈 Scalability Plan

### Phase 1 (MVP): Single Server
- 1 EC2 instance (t3.medium) or DigitalOcean Droplet ($24/month)
- Handles 100-500 users
- Vertical scaling (upgrade to larger instance)

### Phase 2 (Growth): Load Balancing
- 2-3 backend instances behind load balancer
- Separate DB server (AWS RDS with read replicas)
- Redis cluster for caching
- Handles 1,000-5,000 users

### Phase 3 (Scale): Microservices (Future)
- Separate services: Auth, Invoicing, Returns, Payments
- Kubernetes orchestration
- Auto-scaling based on load
- Handles 10,000+ users

---

## ✅ DevOps Checklist for MVP

- [ ] Setup AWS/DigitalOcean account
- [ ] Configure PostgreSQL RDS (or managed DB)
- [ ] Setup Redis (ElastiCache or managed Redis)
- [ ] Configure S3 bucket for file storage
- [ ] Setup domain & DNS (Cloudflare)
- [ ] Configure SSL certificate (Let's Encrypt)
- [ ] Setup Docker & Docker Compose
- [ ] Configure Nginx reverse proxy
- [ ] Setup CI/CD pipeline (GitHub Actions)
- [ ] Configure environment variables
- [ ] Setup monitoring (PM2, Sentry)
- [ ] Configure automated backups
- [ ] Setup email service (SendGrid/SES)
- [ ] Integrate Razorpay
- [ ] Test GST Portal API integration
- [ ] Configure rate limiting
- [ ] Setup logging (Winston)
- [ ] Create deployment documentation

---

**Document Version:** 1.0  
**Last Updated:** January 24, 2026  
**Owner:** Software Engineer (DevOps Lead)  
**Review:** Validate with Data Engineer for infrastructure needs
