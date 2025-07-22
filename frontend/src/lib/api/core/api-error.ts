/**
 * API Error handling for Rexera 2.0 frontend.
 * Extends shared ApiError with frontend-specific functionality.
 */

import { 
  ApiError as SharedApiError,
  API_ERROR_CODES
} from '@rexera/shared';

/**
 * Frontend API Error class extending shared ApiError
 * Provides consistent error handling across the frontend application
 */
export class ApiError extends SharedApiError {
  constructor(
    message: string,
    status: number,
    details?: Record<string, unknown>
  ) {
    super(message, status, API_ERROR_CODES.INTERNAL_ERROR, details);
    this.name = 'ApiError';
  }
}

// Re-export shared error codes for convenience
export { API_ERROR_CODES } from '@rexera/shared';