const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'GST SaaS Backend is running!',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'GST Compliance SaaS API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth ✅',
      customers: '/api/customers ✅',
      invoices: '/api/invoices ✅',
      suppliers: '/api/suppliers ✅',
      purchases: '/api/purchases ✅',
      dashboard: '/api/dashboard ✅',
      gstr1: '/api/gstr1 ✅ NEW',
      gstr3b: '/api/gstr3b ✅ NEW'
    },
    documentation: 'See /docs folder in repository'
  });
});

// ============================================
// API Routes - Week 2: Authentication
// ============================================
app.use('/api/auth', require('./routes/authRoutes'));

// ============================================
// API Routes - Week 3-4: Invoice & Customer Management
// ============================================
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));

// ============================================
// API Routes - Week 5-6: Purchase & Dashboard
// ============================================
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// ============================================
// API Routes - Week 7-8: GST Return Generation
// ============================================
app.use('/api/gstr1', require('./routes/gstr1Routes'));
app.use('/api/gstr3b', require('./routes/gstr3bRoutes'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: ['/health', '/api']
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('🚀 ========================================');
  console.log(`   GST Compliance SaaS Backend`);
  console.log(`   Server: http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   API Info: http://localhost:${PORT}/api`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Node.js: ${process.version}`);
  console.log('========================================== 🚀');
});

module.exports = app;
