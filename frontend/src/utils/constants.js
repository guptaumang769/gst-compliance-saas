// App Constants

// Indian States
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

// Business Types
export const BUSINESS_TYPES = [
  'Proprietorship',
  'Partnership',
  'Private Limited',
  'Public Limited',
  'LLP',
];

// Invoice Status
export const INVOICE_STATUS = {
  PAID: 'Paid',
  PENDING: 'Pending',
  OVERDUE: 'Overdue',
  DRAFT: 'Draft',
  FILED: 'Filed',
  GENERATED: 'Generated',
  SENT: 'Sent',
};

// Invoice Status Colors
export const INVOICE_STATUS_COLORS = {
  [INVOICE_STATUS.PAID]: 'success',
  [INVOICE_STATUS.PENDING]: 'warning',
  [INVOICE_STATUS.OVERDUE]: 'error',
  [INVOICE_STATUS.DRAFT]: 'default',
  [INVOICE_STATUS.FILED]: 'info',
  [INVOICE_STATUS.GENERATED]: 'primary',
  [INVOICE_STATUS.SENT]: 'secondary',
};

// Navigation Items
export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'Dashboard' },
  { label: 'Invoices', path: '/invoices', icon: 'Receipt' },
  { label: 'Customers', path: '/customers', icon: 'People' },
  { label: 'Purchases', path: '/purchases', icon: 'ShoppingCart' },
  { label: 'GST Returns', path: '/gst-returns', icon: 'Assessment' },
];

// Stat Card Colors
export const STAT_COLORS = {
  REVENUE: '#6366F1',
  INVOICES: '#8B5CF6',
  CUSTOMERS: '#10B981',
  TAX: '#F59E0B',
};

// Messages
export const MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully',
  REGISTRATION_SUCCESS: 'Registration successful!',
  
  // Dashboard
  DASHBOARD_WELCOME: 'Welcome back',
  DASHBOARD_SUBTITLE: "Here's what's happening with your business today.",
  NO_DATA_AVAILABLE: 'No data available. Create your first invoice to see the chart!',
  NO_INVOICES_YET: 'No invoices yet',
  NO_INVOICES_MESSAGE: 'Create your first invoice to start tracking revenue',
  NO_GST_DATA: 'No GST data available yet',
  
  // Errors
  ERROR_LOADING_DATA: 'Failed to load dashboard data',
  ERROR_GENERIC: 'An error occurred. Please try again.',
  ERROR_NETWORK: 'Network error. Please check your connection.',
  
  // Stats
  VS_LAST_MONTH: 'vs last month',
  
  // Buttons
  BTN_NEW_INVOICE: 'New Invoice',
  BTN_CREATE_INVOICE: 'Create Invoice',
  BTN_RETRY: 'Retry',
  BTN_BACK: 'Back',
  BTN_NEXT: 'Next',
  BTN_CONTINUE: 'Continue',
  BTN_SUBMIT: 'Submit',
  BTN_CANCEL: 'Cancel',
  BTN_SAVE: 'Save',
  BTN_DELETE: 'Delete',
  
  // Labels
  TOTAL_REVENUE: 'Total Revenue',
  TOTAL_INVOICES: 'Total Invoices',
  TOTAL_CUSTOMERS: 'Total Customers',
  GST_TAX_COLLECTED: 'GST Tax Collected',
  REVENUE_OVERVIEW: 'Revenue Overview',
  REVENUE_OVERVIEW_SUBTITLE: 'Monthly revenue and tax collection',
  GST_BREAKDOWN: 'GST Breakdown',
  GST_BREAKDOWN_SUBTITLE: 'Current month tax collection',
  RECENT_INVOICES: 'Recent Invoices',
  RECENT_INVOICES_SUBTITLE: 'Latest invoices from your business',
  
  // Table Headers
  INVOICE_ID: 'Invoice Number',
  CUSTOMER: 'Customer',
  AMOUNT: 'Amount',
  STATUS: 'Status',
  DATE: 'Date',
  ACTIONS: 'Actions',
};

// Validation Messages
export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Invalid email address',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
  PASSWORDS_MUST_MATCH: 'Passwords must match',
  CONFIRM_PASSWORD_REQUIRED: 'Confirm password is required',
  BUSINESS_NAME_REQUIRED: 'Business name is required',
  GSTIN_REQUIRED: 'GSTIN is required',
  GSTIN_INVALID: 'Invalid GSTIN format',
  PAN_REQUIRED: 'PAN is required',
  PAN_INVALID: 'Invalid PAN format',
  ADDRESS_REQUIRED: 'Address is required',
  CITY_REQUIRED: 'City is required',
  STATE_REQUIRED: 'State is required',
  PINCODE_REQUIRED: 'Pincode is required',
  PINCODE_INVALID: 'Invalid pincode',
  BUSINESS_TYPE_REQUIRED: 'Business type is required',
  PHONE_REQUIRED: 'Phone number is required',
  PHONE_INVALID: 'Invalid phone number',
};

// GSTIN State Code to State Name mapping
export const GSTIN_STATE_MAP = {
  '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
  '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
  '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
  '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '25': 'Dadra and Nagar Haveli and Daman and Diu', '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra', '28': 'Andhra Pradesh', '29': 'Karnataka',
  '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala',
  '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
};

export function getStateFromGSTIN(gstin) {
  if (!gstin || gstin.length < 2) return null;
  return GSTIN_STATE_MAP[gstin.substring(0, 2)] || null;
}

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy',
  INPUT: 'yyyy-MM-dd',
  FULL: 'dd MMMM yyyy',
  SHORT: 'dd/MM/yyyy',
};

// Currency
export const CURRENCY = {
  CODE: 'INR',
  SYMBOL: '₹',
  LOCALE: 'en-IN',
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
  },
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',
    TAX_LIABILITY: '/dashboard/tax-liability',
    ITC_SUMMARY: '/dashboard/itc-summary',
    NET_TAX_PAYABLE: '/dashboard/net-tax-payable',
    TOP_CUSTOMERS: '/dashboard/top-customers',
    TOP_SUPPLIERS: '/dashboard/top-suppliers',
  },
  CUSTOMERS: '/customers',
  INVOICES: '/invoices',
  SUPPLIERS: '/suppliers',
  PURCHASES: '/purchases',
  GSTR1: '/gstr1',
  GSTR3B: '/gstr3b',
  PAYMENTS: '/payments',
  SUBSCRIPTIONS: '/subscriptions',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
};

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#6366F1',
  SECONDARY: '#8B5CF6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
};
