// Utility to extract a user-friendly error message from various error shapes
export function getErrorMessage(error: any, fallback = 'An error occurred'): string {
  if (!error) return fallback;

  // Handle network errors
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Handle timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Handle API response errors
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // Handle HTML error pages (Django 404/500 pages)
    if (typeof data === 'string' && data.includes('<!doctype html>')) {
      switch (status) {
        case 404:
          return 'The requested resource was not found. Please try again or contact support.';
        case 500:
          return 'Server error occurred. Please try again in a moment.';
        case 502:
          return 'Service temporarily unavailable. Please try again in a moment.';
        case 503:
          return 'Service is under maintenance. Please try again later.';
        default:
          return `Server error (${status}). Please try again.`;
      }
    }

    // Handle structured error responses
    if (typeof data === 'object' && data !== null) {
      // Django REST Framework style errors
      if (data.detail) {
        return formatErrorDetail(data.detail);
      }

      // Custom error message
      if (data.message) {
        return formatErrorDetail(data.message);
      }

      // Generic error field
      if (data.error) {
        return formatErrorDetail(data.error);
      }

      // Validation errors (field-specific)
      const validationErrors = extractValidationErrors(data);
      if (validationErrors.length > 0) {
        return validationErrors.join('. ');
      }

      // Non-field errors (common in Django)
      if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
        return data.non_field_errors.join('. ');
      }
    }

    // Handle plain string responses
    if (typeof data === 'string' && data.trim()) {
      return formatErrorDetail(data);
    }

    // Status-specific fallback messages
    return getStatusMessage(status);
  }

  // Handle generic Error objects
  if (error.message && typeof error.message === 'string') {
    // Clean up axios error messages
    if (error.message.includes('Request failed with status code')) {
      const match = error.message.match(/status code (\d+)/);
      if (match) {
        return getStatusMessage(parseInt(match[1]));
      }
    }
    return error.message;
  }

  // Last resort: try to stringify
  try {
    const str = String(error);
    if (str && str !== '[object Object]') {
      return str;
    }
  } catch (e) {
    // ignore
  }

  return fallback;
}

// Format error detail to be more user-friendly
function formatErrorDetail(detail: any): string {
  if (typeof detail === 'string') {
    // Remove technical jargon
    let message = detail
      .replace(/\[ErrorDetail\(string='(.+?)', code='(.+?)'\)\]/g, '$1')
      .replace(/ErrorDetail\(string='(.+?)', code='(.+?)'\)/g, '$1')
      .trim();

    // Capitalize first letter
    if (message.length > 0) {
      message = message.charAt(0).toUpperCase() + message.slice(1);
    }

    // Ensure it ends with a period
    if (message.length > 0 && !message.endsWith('.') && !message.endsWith('!') && !message.endsWith('?')) {
      message += '.';
    }

    return message;
  }

  if (Array.isArray(detail)) {
    return detail.map(d => formatErrorDetail(d)).join(' ');
  }

  return String(detail);
}

// Extract validation errors from response data
function extractValidationErrors(data: any): string[] {
  const errors: string[] = [];

  for (const [field, value] of Object.entries(data)) {
    // Skip known non-validation fields
    if (['detail', 'message', 'error', 'status', 'code'].includes(field)) {
      continue;
    }

    if (typeof value === 'string') {
      errors.push(`${formatFieldName(field)}: ${formatErrorDetail(value)}`);
    } else if (Array.isArray(value)) {
      const fieldErrors = value
        .filter(v => v && typeof v === 'string')
        .map(v => formatErrorDetail(v));
      
      if (fieldErrors.length > 0) {
        errors.push(`${formatFieldName(field)}: ${fieldErrors.join(', ')}`);
      }
    }
  }

  return errors;
}

// Format field names to be more readable
function formatFieldName(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

// Get user-friendly message based on HTTP status code
function getStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Authentication required. Please log in and try again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 405:
      return 'This action is not allowed.';
    case 408:
      return 'Request timed out. Please try again.';
    case 409:
      return 'This action conflicts with existing data.';
    case 422:
      return 'Invalid data provided. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error occurred. Please try again in a moment.';
    case 502:
      return 'Service temporarily unavailable. Please try again.';
    case 503:
      return 'Service is under maintenance. Please try again later.';
    case 504:
      return 'Request timed out. Please try again.';
    default:
      if (status >= 500) {
        return 'Server error occurred. Please try again later.';
      }
      if (status >= 400) {
        return 'Request failed. Please try again.';
      }
      return 'An unexpected error occurred.';
  }
}

// Get a short, actionable error message for toasts
export function getShortErrorMessage(error: any): string {
  const fullMessage = getErrorMessage(error);
  
  // If message is too long, truncate it
  if (fullMessage.length > 100) {
    return fullMessage.substring(0, 97) + '...';
  }
  
  return fullMessage;
}

// Check if error is a specific type
export function isNetworkError(error: any): boolean {
  return error?.code === 'ERR_NETWORK' || error?.message === 'Network Error';
}

export function isAuthError(error: any): boolean {
  return error?.response?.status === 401;
}

export function isPermissionError(error: any): boolean {
  return error?.response?.status === 403;
}

export function isValidationError(error: any): boolean {
  return error?.response?.status === 400 || error?.response?.status === 422;
}

export function isServerError(error: any): boolean {
  return error?.response?.status >= 500;
}
