/**
 * Shared API types for Rexera 2.0 frontend.
 * Common types used across multiple API endpoints.
 */

// Re-export shared types from @rexera/shared for convenience
export type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginationMeta
} from '@rexera/shared';

// Re-export frontend-specific API types
export type {
  ApiRequestOptions,
  PaginatedFilters,
  SearchFilters,
  ApiErrorDetails
} from '@/types/api';