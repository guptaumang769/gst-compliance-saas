import axios from 'axios';

function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  // Ensure the URL ends with /api
  return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  updateProfile: (data) => api.put('/auth/profile', data),
  // Also accepts invoice numbering settings: { invoicePrefix, invoiceNumberFormat, invoiceNextNumber }
  updateSettings: (data) => api.put('/auth/settings', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendVerification: (data) => api.post('/auth/resend-verification', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Business API (logo upload as multipart FormData, field name `logo`)
export const businessAPI = {
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/auth/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Helper to build a multipart FormData upload for a CSV file (field name `file`)
const buildFileUpload = (endpoint) => (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Customer API
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getStats: () => api.get('/customers/stats'),
  import: buildFileUpload('/customers/import'),
  importTemplate: () => api.get('/customers/import/template', { responseType: 'blob' }),
};

// Invoice API
export const invoiceAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  getStats: () => api.get('/invoices/stats'),
  generatePDF: (id) => api.post(`/invoices/${id}/generate-pdf`),
  downloadPDF: (id) => api.get(`/invoices/${id}/download-pdf`, { responseType: 'blob' }),
  sendEmail: (id, data) => api.post(`/invoices/${id}/send-email`, data),
  markAsFiled: (id, data) => api.patch(`/invoices/${id}/mark-filed`, data),
};

// Supplier API
export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  getStats: () => api.get('/suppliers/stats'),
  import: buildFileUpload('/suppliers/import'),
  importTemplate: () => api.get('/suppliers/import/template', { responseType: 'blob' }),
};

// Purchase API
export const purchaseAPI = {
  getAll: (params) => api.get('/purchases', { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  delete: (id) => api.delete(`/purchases/${id}`),
  markAsPaid: (id, data) => api.patch(`/purchases/${id}/mark-paid`, data),
  markAsFiled: (id, data) => api.patch(`/purchases/${id}/mark-filed`, data),
  getStats: () => api.get('/purchases/stats'),
  calculateITC: (year, month) => api.get(`/purchases/itc/${year}/${month}`),
};

// Dashboard API
export const dashboardAPI = {
  getSummary: (params) => api.get('/dashboard/summary', { params }),
  getTaxLiability: (params) => api.get('/dashboard/tax-liability', { params }),
  getITCSummary: (params) => api.get('/dashboard/itc-summary', { params }),
  getNetTaxPayable: (params) => api.get('/dashboard/net-tax-payable', { params }),
  getTopCustomers: (params) => api.get('/dashboard/top-customers', { params }),
  getTopSuppliers: (params) => api.get('/dashboard/top-suppliers', { params }),
};

// GSTR-1 API
export const gstr1API = {
  generate: (data) => api.post('/gstr1/generate', data),
  getAll: (params) => api.get('/gstr1', { params }),
  getById: (id) => api.get(`/gstr1/${id}`),
  exportJSON: (id) => api.get(`/gstr1/${id}/export`, { responseType: 'blob' }),
};

// GSTR-3B API
export const gstr3bAPI = {
  generate: (data) => api.post('/gstr3b/generate', data),
  getAll: (params) => api.get('/gstr3b', { params }),
  getById: (id) => api.get(`/gstr3b/${id}`),
  exportJSON: (id) => api.get(`/gstr3b/${id}/export`, { responseType: 'blob' }),
};

// Unified GSTR API (combines GSTR-1 and GSTR-3B)
export const gstrAPI = {
  generate: (data) => {
    const endpoint = data.returnType === 'GSTR1' ? '/gstr1/generate' : '/gstr3b/generate';
    return api.post(endpoint, data);
  },
  getAll: () => {
    // Get both GSTR-1 and GSTR-3B returns
    return Promise.all([
      api.get('/gstr1'),
      api.get('/gstr3b')
    ]).then(([gstr1Response, gstr3bResponse]) => {
      const gstr1Returns = gstr1Response.data.returns || [];
      const gstr3bReturns = gstr3bResponse.data.returns || [];
      return {
        data: {
          returns: [...gstr1Returns, ...gstr3bReturns].sort((a, b) => 
            new Date(b.generatedDate) - new Date(a.generatedDate)
          ),
        }
      };
    });
  },
  getByPeriod: (returnType, year, month) => {
    const endpoint = returnType === 'GSTR1' ? `/gstr1/${year}/${month}` : `/gstr3b/${year}/${month}`;
    return api.get(endpoint);
  },
  download: (returnType, year, month) => {
    const endpoint = returnType === 'GSTR1' 
      ? `/gstr1/${year}/${month}/export/json` 
      : `/gstr3b/${year}/${month}/export/json`;
    return api.get(endpoint);
  },
  updateStatus: (returnType, id, status, acknowledgeNumber) => {
    const endpoint = returnType === 'GSTR1' 
      ? `/gstr1/${id}/status` 
      : `/gstr3b/${id}/status`;
    return api.put(endpoint, { status, acknowledgeNumber });
  },
};

// Payment API
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getAll: (params) => api.get('/payments/history', { params }),
};

// Subscription API
export const subscriptionAPI = {
  getPlans: () => api.get('/subscriptions/plans'),
  getCurrent: () => api.get('/subscriptions/status'),
  getUsage: () => api.get('/subscriptions/usage'),
  checkLimit: (feature) => api.post('/subscriptions/check-limit', { feature }),
};

// Credit/Debit Note API
export const creditDebitNoteAPI = {
  getAll: (params) => api.get('/credit-debit-notes', { params }),
  getById: (id) => api.get(`/credit-debit-notes/${id}`),
  create: (data) => api.post('/credit-debit-notes', data),
  update: (id, data) => api.put(`/credit-debit-notes/${id}`, data),
  delete: (id) => api.delete(`/credit-debit-notes/${id}`),
};

// GSTR-2A/2B Reconciliation API
export const gstr2ReconciliationAPI = {
  // Get available filing periods
  getPeriods: () => api.get('/gstr2-reconciliation/periods'),
  
  // Get reconciliation entries with filters
  getEntries: (params) => api.get('/gstr2-reconciliation/entries', { params }),
  
  // Get single entry by ID
  getEntryById: (id) => api.get(`/gstr2-reconciliation/entries/${id}`),
  
  // Get reconciliation summary for a period
  getSummary: (filingPeriod) => api.get(`/gstr2-reconciliation/summary/${filingPeriod}`),
  
  // Get ITC report from GSTR-2B
  getItcReport: (filingPeriod) => api.get(`/gstr2-reconciliation/itc-report/${filingPeriod}`),
  
  // Get purchases not in GSTR-2A/2B
  getUnmatchedPurchases: (filingPeriod) => api.get(`/gstr2-reconciliation/unmatched-purchases/${filingPeriod}`),
  
  // Import single GSTR-2A/2B entry
  importEntry: (data) => api.post('/gstr2-reconciliation/import', data),
  
  // Import bulk entries
  importBulk: (data) => api.post('/gstr2-reconciliation/import/bulk', data),
  
  // Run reconciliation
  runReconciliation: (filingPeriod) => api.post('/gstr2-reconciliation/reconcile', { filingPeriod }),
  
  // Update entry (edit)
  updateEntry: (id, data) => api.put(`/gstr2-reconciliation/entries/${id}`, data),
  
  // Update action on entry
  updateAction: (id, data) => api.put(`/gstr2-reconciliation/entries/${id}/action`, data),
  
  // Delete entry
  deleteEntry: (id) => api.delete(`/gstr2-reconciliation/entries/${id}`),
};

// Reports API
// Each report supports CSV export by passing { format: 'csv' } and responseType 'blob'.
export const reportsAPI = {
  salesRegister: (params) => api.get('/reports/sales-register', { params }),
  purchaseRegister: (params) => api.get('/reports/purchase-register', { params }),
  taxRateSummary: (params) => api.get('/reports/tax-rate-summary', { params }),
  hsnSummary: (params) => api.get('/reports/hsn-summary', { params }),
  itcAnalysis: (params) => api.get('/reports/itc-analysis', { params }),
  // CSV export helper: name is one of the report slugs above
  exportCSV: (name, params) =>
    api.get(`/reports/${name}`, {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    }),
};

// Product API
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  import: buildFileUpload('/products/import'),
  importTemplate: () => api.get('/products/import/template', { responseType: 'blob' }),
};

// Team API
export const teamAPI = {
  getAll: () => api.get('/team'),
  invite: (data) => api.post('/team/invite', data),
  updateRole: (id, { role }) => api.put(`/team/${id}/role`, { role }),
  remove: (id) => api.delete(`/team/${id}`),
};

// Audit Log API
export const auditAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
};

// E-Way Bill API
export const ewayBillAPI = {
  getAll: (params) => api.get('/eway-bills', { params }),
  getById: (id) => api.get(`/eway-bills/${id}`),
  create: (data) => api.post('/eway-bills', data),
  update: (id, data) => api.put(`/eway-bills/${id}`, data),
  delete: (id) => api.delete(`/eway-bills/${id}`),
  generate: (id) => api.post(`/eway-bills/${id}/generate`),
  cancel: (id, data) => api.post(`/eway-bills/${id}/cancel`, data),
  fromInvoice: (invoiceId) => api.post(`/eway-bills/from-invoice/${invoiceId}`),
};

// E-Invoice API (IRN generation)
export const eInvoiceAPI = {
  generate: (invoiceId) => api.post(`/einvoice/generate/${invoiceId}`),
  get: (invoiceId) => api.get(`/einvoice/${invoiceId}`),
  cancel: (invoiceId, data) => api.post(`/einvoice/cancel/${invoiceId}`, data),
  getAll: (params) => api.get('/einvoice', { params }),
};

// TDS / TCS API
export const tdsTcsAPI = {
  getAll: (params) => api.get('/tds-tcs', { params }),
  getById: (id) => api.get(`/tds-tcs/${id}`),
  create: (data) => api.post('/tds-tcs', data),
  update: (id, data) => api.put(`/tds-tcs/${id}`, data),
  delete: (id) => api.delete(`/tds-tcs/${id}`),
  getSummary: (params) => api.get('/tds-tcs/summary', { params }),
};

// Inventory API
export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  adjust: (data) => api.post('/inventory/adjust', data),
  getMovements: (params) => api.get('/inventory/movements', { params }),
  getLowStock: () => api.get('/inventory/low-stock'),
};

// Bank Reconciliation API
export const bankAPI = {
  uploadStatement: (fileOrData) => {
    // Accepts a File (CSV, multipart) or a plain object { name, rows } (JSON).
    if (typeof File !== 'undefined' && fileOrData instanceof File) {
      const formData = new FormData();
      formData.append('file', fileOrData);
      return api.post('/bank/statements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/bank/statements', fileOrData);
  },
  getStatements: (params) => api.get('/bank/statements', { params }),
  getTransactions: (params) => api.get('/bank/transactions', { params }),
  reconcile: (data) => api.post('/bank/reconcile', data),
  updateTransaction: (id, data) => api.put(`/bank/transactions/${id}`, data),
  getSummary: () => api.get('/bank/summary'),
};

// Financials API (P&L + Balance Sheet)
export const financialsAPI = {
  getPnl: (params) => api.get('/financials/pnl', { params }),
  getBalanceSheet: (params) => api.get('/financials/balance-sheet', { params }),
};

// Insights API
export const insightsAPI = {
  getAll: (params) => api.get('/insights', { params }),
};

// Admin API
export const adminAPI = {
  getOverview: () => api.get('/admin/overview'),
  getActivity: (params) => api.get('/admin/activity', { params }),
  getHealth: () => api.get('/admin/health'),
};

// GST Filing stub API
export const gstFilingAPI = {
  file: (data) => api.post('/gst-filing/file', data),
};

// WhatsApp API
export const whatsappAPI = {
  getInvoiceLink: (invoiceId) => api.get(`/whatsapp/invoice-link/${invoiceId}`),
};

// Chatbot API
export const chatbotAPI = {
  query: (message) => api.post('/chatbot/query', { message }),
};

export default api;
