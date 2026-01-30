import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
  getProfile: () => api.get('/auth/profile'),
};

// Customer API
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getStats: () => api.get('/customers/stats'),
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
};

// Supplier API
export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  getStats: () => api.get('/suppliers/stats'),
};

// Purchase API
export const purchaseAPI = {
  getAll: (params) => api.get('/purchases', { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  delete: (id) => api.delete(`/purchases/${id}`),
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
  getAll: (params) => {
    // Get both GSTR-1 and GSTR-3B returns
    return Promise.all([
      api.get('/gstr1', { params }),
      api.get('/gstr3b', { params })
    ]).then(([gstr1Response, gstr3bResponse]) => {
      const gstr1Returns = (gstr1Response.data.returns || []).map(r => ({ ...r, returnType: 'GSTR1' }));
      const gstr3bReturns = (gstr3bResponse.data.returns || []).map(r => ({ ...r, returnType: 'GSTR3B' }));
      return {
        data: {
          returns: [...gstr1Returns, ...gstr3bReturns].sort((a, b) => 
            new Date(b.generatedDate) - new Date(a.generatedDate)
          ),
        }
      };
    });
  },
  download: (id) => {
    // Download return JSON
    return api.get(`/gstr1/${id}`, {}).catch(() => api.get(`/gstr3b/${id}`, {}));
  },
};

// Payment API
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getAll: (params) => api.get('/payments', { params }),
};

// Subscription API
export const subscriptionAPI = {
  getPlans: () => api.get('/subscriptions/plans'),
  getCurrent: () => api.get('/subscriptions/current'),
  getUsage: () => api.get('/subscriptions/usage'),
  checkLimit: (feature) => api.post('/subscriptions/check-limit', { feature }),
};

export default api;
