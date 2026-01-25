# GST Compliance SaaS - Backend

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- PostgreSQL 15+ (via Docker)
- Redis 7+ (via Docker)

### Installation

```bash
# Install dependencies
npm install

# Create .env file
cp env.example .env
# Edit .env and add your JWT_SECRET

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with nodemon

# Production
npm start                # Start production server

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio (http://localhost:5555)

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode

# Linting
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

### Testing Files

```bash
# Test Prisma connection
node src/test-prisma.js

# Test GST validation utilities
node src/utils/testGstValidation.js
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/       # HTTP request handlers
│   ├── services/          # Business logic
│   ├── models/            # Database models (Prisma)
│   ├── routes/            # API route definitions
│   ├── middleware/        # Express middleware
│   ├── utils/             # Utility functions (GST validation, etc.)
│   ├── config/            # Configuration files
│   ├── index.js           # Main application entry point
│   ├── test-prisma.js     # Prisma connection tests
│   └── utils/
│       ├── gstValidation.js      # ✅ GST validation utilities
│       └── testGstValidation.js  # GST validation tests
├── prisma/
│   └── schema.prisma      # Database schema
├── .env                   # Environment variables (create from .env.example)
├── .env.example           # Environment template
├── package.json           # Dependencies
└── README.md              # This file
```

## 🔑 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/gst_saas
JWT_SECRET=your-secure-random-secret-here

# Optional (for later)
RAZORPAY_KEY_ID=your-razorpay-key
AWS_ACCESS_KEY_ID=your-aws-key
SMTP_PASSWORD=your-sendgrid-key
```

## 🗄️ Database

### Prisma Commands

```bash
# View database in browser
npx prisma studio

# Create new migration
npx prisma migrate dev --name description_of_change

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Format schema file
npx prisma format
```

### Current Schema

- **users** - User authentication and profiles
- **businesses** - Business information with GSTIN

More tables will be added in Week 3-4:
- customers
- products
- invoices
- invoice_items
- gstr_returns
- subscriptions
- audit_logs

## 🔌 API Endpoints

### Current Endpoints

- `GET /health` - Health check
- `GET /api` - API information

### Coming Soon (Week 2)

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

See `docs/01-MVP-FEATURES.md` for complete API documentation.

## 🧪 Testing

### Test Prisma Connection

```bash
node src/test-prisma.js
```

This will:
- Test database connection
- Create, read, update, delete a test user
- Verify all Prisma operations work

### Test GST Validation

```bash
node src/utils/testGstValidation.js
```

This will:
- Validate GSTIN format
- Validate PAN format
- Extract state code from GSTIN
- Validate HSN/SAC codes
- Validate GST rates

## ✅ GST Integration Points

### `src/utils/gstValidation.js`

Contains critical GST validation functions:

- `validateGSTIN(gstin)` - Validates GSTIN format and checksum
- `validatePAN(pan)` - Validates PAN format
- `extractStateCode(gstin)` - Extracts state code from GSTIN
- `getStateName(stateCode)` - Gets state name from code
- `validateHSNSAC(code, type)` - Validates HSN/SAC codes
- `validateGSTRate(rate)` - Validates GST tax rates

**These will be used in:**
- User registration (GSTIN validation)
- Business setup (GSTIN validation)
- Product creation (HSN code validation)
- Invoice creation (GST rate validation)
- GST Calculator (state code extraction)

## 🔐 Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Input validation with Joi
- SQL injection prevented by Prisma
- CORS configured for allowed origins
- Rate limiting on API endpoints
- Helmet.js for security headers

## 📚 Documentation

See the `/docs` folder in project root:

- `01-MVP-FEATURES.md` - Feature specifications
- `02-DATABASE-SCHEMA.md` - Database design
- `03-DEVOPS-API-INTEGRATION.md` - Infrastructure
- `04-DESIGN-DOCUMENT.md` - Implementation guide
- `05-PHASE-PLAN.md` - Development roadmap
- `06-GST-INTEGRATION-GUIDE.md` - GST rules reference

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if Docker containers are running
docker ps

# Should show: gst_saas_db and gst_saas_redis

# If not, start them:
docker-compose up -d

# Test database connection
docker exec -it gst_saas_db psql -U postgres -d gst_saas -c "SELECT 1;"
```

### Prisma Issues

```bash
# Regenerate Prisma Client
npx prisma generate

# Reset database
npx prisma migrate reset
npx prisma migrate dev --name init
```

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process or change PORT in .env
```

## 🎯 Next Steps

1. **Week 2:** Build authentication module
   - Create authController.js
   - Create authService.js
   - Create authRoutes.js
   - Implement JWT authentication

2. **Week 3-4:** Build master data modules
   - Products with HSN codes
   - Customers with GSTIN
   - Business configuration

3. **Week 5:** Build GST Calculator ⭐ CRITICAL
   - CGST/SGST vs IGST logic
   - All GST rates
   - 100% accuracy required

See `docs/05-PHASE-PLAN.md` for detailed weekly plan.

## 🤝 Contributing

This is a team project. Follow the development workflow:

1. Company laptop: Write code
2. Push to GitHub
3. Personal laptop: Pull and test
4. Report issues
5. Fix and repeat

See `DEVELOPMENT-WORKFLOW.md` for details.

---

**Status:** Week 1 Complete ✅  
**Next:** Week 2 - Authentication Module  
**Repository:** https://github.com/guptaumang769/gst-compliance-saas.git
