/**
 * Utility TypeScript types for Rexera 2.0
 * Generic helper types used across the application
 */

// =====================================================
// GENERIC UTILITY TYPES
// =====================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type PartialRequired<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>;

// =====================================================
// API UTILITY TYPES
// =====================================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TimestampFields {
  created_at: string;
  updated_at: string;
}

export interface SoftDeleteFields extends TimestampFields {
  deleted_at?: string;
}

// =====================================================
// ERROR HANDLING TYPES
// =====================================================

export interface ErrorDetails {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

export interface ApiError {
  success: false;
  error: ErrorDetails;
  timestamp: string;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

// =====================================================
// REAL-TIME TYPES
// =====================================================

export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: string;
}

export interface SubscriptionRequest {
  event: string;
  filters?: Record<string, any>;
}

// =====================================================
// METADATA TYPES
// =====================================================

export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export interface JsonArray extends Array<JsonValue> {}

export type Metadata = JsonObject;

// =====================================================
// AUDIT TYPES
// =====================================================

export interface AuditTrail {
  action: string;
  user_id: string;
  timestamp: string;
  changes: Record<string, { from: any; to: any }>;
  metadata?: Metadata;
}