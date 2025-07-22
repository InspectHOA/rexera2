/**
 * Common formatting utilities for consistent display across the application
 */

// Date formatting utilities
export const formatDate = (date: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString();
    case 'long':
      return dateObj.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'relative':
      return formatRelativeTime(dateObj);
    default:
      return dateObj.toLocaleDateString();
  }
};

export const formatTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Time';
  }

  return dateObj.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
};

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Currency formatting
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Number formatting
export const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat('en-US', options).format(num);
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Duration formatting
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

// Text formatting
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

export const capitalizeFirst = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const formatCamelCase = (text: string): string => {
  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

export const formatSnakeCase = (text: string): string => {
  return text
    .split('_')
    .map(word => capitalizeFirst(word))
    .join(' ');
};

// URL formatting
export const formatWorkflowUrl = (workflowId: string): string => {
  return `/workflow/${workflowId}`;
};

export const formatApiUrl = (endpoint: string, params?: Record<string, string | number>): string => {
  let url = endpoint;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

// ID formatting
export const formatShortId = (id: string, length = 8): string => {
  if (!id) return '';
  return id.slice(0, length);
};

export const formatDisplayId = (id: string, prefix?: string): string => {
  const shortId = formatShortId(id);
  return prefix ? `${prefix}-${shortId}` : shortId;
};

// Error message formatting
export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  
  return 'An unexpected error occurred';
};

// Validation helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUuid = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};