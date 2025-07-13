/**
 * Shared Error Classes
 * 
 * Standardized error handling across frontend and backend
 */

import { ApiErrorCode, API_ERROR_CODES } from './api';

// Re-export for convenience
export { API_ERROR_CODES } from './api';

// ============================================================================
// Base API Error Class
// ============================================================================

export class ApiError extends Error {
  public readonly isApiError = true;
  public readonly timestamp: string;
  public readonly requestId?: string;

  constructor(
    message: string,
    public readonly status: number = 500,
    public readonly code: ApiErrorCode = API_ERROR_CODES.INTERNAL_ERROR,
    public readonly details?: any,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
        requestId: this.requestId
      }
    };
  }

  static isApiError(error: any): error is ApiError {
    return error && typeof error === 'object' && error.isApiError === true;
  }
}

// ============================================================================
// Specific Error Classes
// ============================================================================

export class ValidationError extends ApiError {
  constructor(message: string, details?: any, requestId?: string) {
    super(message, 400, API_ERROR_CODES.VALIDATION_ERROR, details, requestId);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string, requestId?: string) {
    const message = id 
      ? `${resource} with ID '${id}' not found`
      : `${resource} not found`;
    super(message, 404, API_ERROR_CODES.NOT_FOUND, { resource, id }, requestId);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication required', requestId?: string) {
    super(message, 401, API_ERROR_CODES.UNAUTHORIZED, undefined, requestId);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access forbidden', requestId?: string) {
    super(message, 403, API_ERROR_CODES.FORBIDDEN, undefined, requestId);
    this.name = 'ForbiddenError';
  }
}

export class RateLimitError extends ApiError {
  constructor(resetTime: number, requestId?: string) {
    const message = `Rate limit exceeded. Try again in ${Math.ceil((resetTime - Date.now()) / 1000)} seconds.`;
    super(message, 429, API_ERROR_CODES.RATE_LIMITED, { resetTime }, requestId);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string, details?: any, requestId?: string) {
    super(message, 500, API_ERROR_CODES.DATABASE_ERROR, details, requestId);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends ApiError {
  constructor(service: string, message: string, details?: any, requestId?: string) {
    super(`${service} error: ${message}`, 502, API_ERROR_CODES.EXTERNAL_SERVICE_ERROR, { service, ...details }, requestId);
    this.name = 'ExternalServiceError';
  }
}

// ============================================================================
// Business Logic Errors
// ============================================================================

export class WorkflowError extends ApiError {
  constructor(message: string, workflowId?: string, details?: any, requestId?: string) {
    super(message, 400, API_ERROR_CODES.INVALID_WORKFLOW_STATE, { workflowId, ...details }, requestId);
    this.name = 'WorkflowError';
  }
}

export class N8nIntegrationError extends ApiError {
  constructor(message: string, details?: any, requestId?: string) {
    super(message, 502, API_ERROR_CODES.N8N_INTEGRATION_ERROR, details, requestId);
    this.name = 'N8nIntegrationError';
  }
}

// ============================================================================
// Error Factory Functions
// ============================================================================

export const createApiError = (
  message: string,
  status: number = 500,
  code: ApiErrorCode = API_ERROR_CODES.INTERNAL_ERROR,
  details?: any,
  requestId?: string
): ApiError => {
  return new ApiError(message, status, code, details, requestId);
};

export const createValidationError = (message: string, details?: any, requestId?: string): ValidationError => {
  return new ValidationError(message, details, requestId);
};

export const createNotFoundError = (resource: string, id?: string, requestId?: string): NotFoundError => {
  return new NotFoundError(resource, id, requestId);
};

// ============================================================================
// Error Utilities
// ============================================================================

export const isApiError = (error: any): error is ApiError => {
  return ApiError.isApiError(error);
};

export const getErrorCode = (error: any): ApiErrorCode => {
  if (isApiError(error)) {
    return error.code;
  }
  return API_ERROR_CODES.INTERNAL_ERROR;
};

export const getErrorStatus = (error: any): number => {
  if (isApiError(error)) {
    return error.status;
  }
  return 500;
};