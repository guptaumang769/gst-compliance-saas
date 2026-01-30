import { toast } from 'react-toastify';
import { MESSAGES } from './constants';

/**
 * Extract error message from various error formats
 */
export const getErrorMessage = (error) => {
  // Check for response data message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Check for response data error
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  // Check for error message
  if (error.message) {
    return error.message;
  }
  
  // Network errors
  if (error.code === 'ERR_NETWORK') {
    return MESSAGES.ERROR_NETWORK;
  }
  
  // Default error
  return MESSAGES.ERROR_GENERIC;
};

/**
 * Handle API errors and show toast notifications
 */
export const handleApiError = (error, customMessage = null) => {
  const message = customMessage || getErrorMessage(error);
  console.error('API Error:', error);
  toast.error(message);
  return message;
};

/**
 * Handle success messages
 */
export const handleSuccess = (message) => {
  toast.success(message);
};

/**
 * Handle info messages
 */
export const handleInfo = (message) => {
  toast.info(message);
};

/**
 * Handle warning messages
 */
export const handleWarning = (message) => {
  toast.warning(message);
};

/**
 * Log error for debugging
 */
export const logError = (error, context = '') => {
  console.error(`[${context}]`, error);
  
  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error);
  }
};

/**
 * Check if error is authentication error
 */
export const isAuthError = (error) => {
  return error.response?.status === 401;
};

/**
 * Check if error is permission error
 */
export const isPermissionError = (error) => {
  return error.response?.status === 403;
};

/**
 * Check if error is not found error
 */
export const isNotFoundError = (error) => {
  return error.response?.status === 404;
};

/**
 * Check if error is validation error
 */
export const isValidationError = (error) => {
  return error.response?.status === 400 || error.response?.status === 422;
};

/**
 * Get validation errors from API response
 */
export const getValidationErrors = (error) => {
  if (error.response?.data?.errors) {
    return error.response.data.errors;
  }
  return {};
};
