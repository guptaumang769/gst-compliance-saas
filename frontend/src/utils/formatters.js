import { format } from 'date-fns';
import { CURRENCY, DATE_FORMATS } from './constants';

/**
 * Format number as Indian Rupee currency
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat(CURRENCY.LOCALE, {
    style: 'currency',
    currency: CURRENCY.CODE,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

/**
 * Format date to display format
 */
export const formatDate = (date, formatString = DATE_FORMATS.DISPLAY) => {
  if (!date) return 'N/A';
  try {
    return format(new Date(date), formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Calculate percentage change between two numbers
 */
export const calculateTrend = (current, previous) => {
  if (!previous || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  return {
    value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
    trend: change >= 0 ? 'up' : 'down',
  };
};

/**
 * Format large numbers with K, M, B suffixes
 */
export const formatCompactNumber = (num) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
