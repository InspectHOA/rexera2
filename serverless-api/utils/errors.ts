/**
 * @fileoverview Error handling and response utilities for Rexera 2.0.
 * 
 * This module provides comprehensive error handling, response formatting, and
 * API response standardization for the Rexera real estate workflow automation
 * platform. It ensures consistent error responses across all endpoints,
 * proper error logging, and secure error information disclosure.
 * 
 * Error Handling Architecture:
 * - Standardized API response formats for success and error cases
 * - Custom error classes with operational error classification
 * - Environment-aware error detail disclosure for security
 * - Comprehensive error logging and debugging support
 * 
 * Key Capabilities:
 * - Consistent API response formatting across all endpoints
 * - Custom error classes with HTTP status code mapping
 * - Environment-specific error detail disclosure
 * - Database error handling and classification
 * - Pagination support for list responses
 * 
 * Business Context:
 * - Consistent error responses enable reliable client integration
 * - Proper error classification supports debugging and monitoring
 * - Security-aware error disclosure protects sensitive information
 * - Standardized responses facilitate API documentation and testing
 * 
 * Security Considerations:
 * - Error details only exposed in development environment
 * - Sensitive information filtered from production error responses
 * - Proper error logging for security monitoring and audit
 * - Stack trace protection in production environments
 * 
 * Integration Points:
 * - REST API endpoints for consistent error responses
 * - tRPC error handling and response formatting
 * - Middleware error handling and logging
 * - External system integration error management
 * 
 * @module ErrorUtils
 * @requires express - Express response object for HTTP responses
 */

import { Response } from 'express';

/**
 * Standardized API error response interface.
 * 
 * Business Context:
 * - Provides consistent error response format across all API endpoints
 * - Enables client applications to handle errors programmatically
 * - Supports debugging and troubleshooting with detailed error information
 * - Maintains security by controlling error detail disclosure
 * 
 * Response Structure:
 * - success: Always false for error responses
 * - error: High-level error category or type
 * - message: Human-readable error description
 * - details: Optional detailed error information (development only)
 * 
 * @interface ApiError
 */
export interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: any;
}

/**
 * Standardized API success response interface with optional pagination.
 * 
 * Business Context:
 * - Provides consistent success response format across all API endpoints
 * - Supports paginated responses for list operations
 * - Enables client applications to handle responses programmatically
 * - Facilitates API documentation and testing
 * 
 * Response Structure:
 * - success: Always true for success responses
 * - data: Response payload with type safety
 * - pagination: Optional pagination metadata for list responses
 * 
 * Pagination Support:
 * - page: Current page number
 * - limit: Results per page
 * - total: Total number of results
 * - totalPages: Total number of pages
 * 
 * @interface ApiSuccess
 * @template T - Type of the response data
 */
export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Union type for all possible API responses.
 * 
 * Business Context:
 * - Provides type safety for API response handling
 * - Enables discriminated union pattern for response processing
 * - Supports consistent error and success response handling
 * - Facilitates API client development and testing
 * 
 * @type ApiResponse
 * @template T - Type of the success response data
 */
export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

/**
 * Custom application error class with operational error classification.
 * 
 * Business Context:
 * - Provides structured error handling with HTTP status code mapping
 * - Distinguishes between operational and programming errors
 * - Enables proper error logging and monitoring
 * - Supports error recovery and graceful degradation
 * 
 * Error Classification:
 * - Operational errors: Expected errors that can be handled gracefully
 * - Programming errors: Unexpected errors indicating bugs or system issues
 * - Status code mapping for proper HTTP response handling
 * - Stack trace capture for debugging and troubleshooting
 * 
 * Usage Patterns:
 * - Validation errors with 400 status codes
 * - Authentication errors with 401 status codes
 * - Authorization errors with 403 status codes
 * - Not found errors with 404 status codes
 * - Business logic errors with appropriate status codes
 * 
 * @class AppError
 * @extends Error
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  /**
   * Creates a new application error with status code and operational classification.
   * 
   * @param message - Human-readable error message
   * @param statusCode - HTTP status code (default: 500)
   * @param isOperational - Whether error is operational (default: true)
   */
  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized error handling function with environment-aware error disclosure.
 * 
 * Business Context:
 * - Provides consistent error response formatting across all endpoints
 * - Handles different error types with appropriate status codes
 * - Protects sensitive information in production environments
 * - Enables comprehensive error logging for monitoring and debugging
 * 
 * Error Type Handling:
 * - AppError: Custom application errors with predefined status codes
 * - Database errors: Supabase/PostgreSQL errors with generic responses
 * - Generic errors: Unexpected errors with fallback handling
 * - Environment-specific error detail disclosure
 * 
 * Security Considerations:
 * - Error details only exposed in development environment
 * - Database error messages sanitized for production
 * - Stack traces protected from client exposure
 * - Comprehensive server-side error logging
 * 
 * Response Format:
 * - Consistent JSON structure for all error types
 * - Success flag for programmatic error detection
 * - Error category and human-readable message
 * - Optional details for development debugging
 * 
 * @param error - Error object or exception to handle
 * @param res - Express response object for HTTP response
 * @param defaultMessage - Default error message for generic errors
 */
export function handleError(error: any, res: Response, defaultMessage: string = 'Internal server error') {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      message: error.message
    });
  }

  // Database errors (Supabase/PostgreSQL)
  // Sanitize database errors to prevent information disclosure
  if (error.code) {
    return res.status(500).json({
      success: false,
      error: 'Database Error',
      message: 'A database error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  // Generic error handling with environment-aware detail disclosure
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: defaultMessage,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}

/**
 * Sends standardized success response with optional pagination metadata.
 * 
 * Business Context:
 * - Provides consistent success response formatting across all endpoints
 * - Supports paginated responses for list operations and large datasets
 * - Enables client applications to handle responses programmatically
 * - Facilitates API documentation and testing
 * 
 * Response Structure:
 * - Type-safe data payload with generic type support
 * - Optional pagination metadata for list responses
 * - Consistent success flag for programmatic handling
 * - Proper HTTP status code (200) for success responses
 * 
 * Pagination Support:
 * - Automatically includes pagination metadata when provided
 * - Supports standard pagination parameters (page, limit, total, totalPages)
 * - Enables client-side pagination controls and navigation
 * - Facilitates large dataset handling and performance optimization
 * 
 * @template T - Type of the response data
 * @param res - Express response object for HTTP response
 * @param data - Response data payload
 * @param pagination - Optional pagination metadata
 */
export function sendSuccess<T>(res: Response, data: T, pagination?: any) {
  const response: ApiSuccess<T> = {
    success: true,
    data
  };

  if (pagination) {
    response.pagination = pagination;
  }

  res.json(response);
}

/**
 * Sends standardized error response with environment-aware detail disclosure.
 * 
 * Business Context:
 * - Provides consistent error response formatting for manual error handling
 * - Enables custom error responses with specific status codes and messages
 * - Supports detailed error information for debugging and troubleshooting
 * - Maintains security by controlling error detail disclosure
 * 
 * Error Response Structure:
 * - Custom HTTP status code for proper client handling
 * - Error category and human-readable message
 * - Optional detailed error information (development only)
 * - Consistent success flag for programmatic error detection
 * 
 * Security Considerations:
 * - Error details only exposed in development environment
 * - Sensitive information filtered from production responses
 * - Proper error categorization for client handling
 * - Comprehensive server-side error logging
 * 
 * Usage Patterns:
 * - Validation errors with detailed field information
 * - Business logic errors with context-specific messages
 * - External service errors with sanitized error details
 * - Custom error responses for specific use cases
 * 
 * @param res - Express response object for HTTP response
 * @param statusCode - HTTP status code for the error
 * @param error - Error category or type
 * @param message - Human-readable error message
 * @param details - Optional detailed error information
 */
export function sendError(res: Response, statusCode: number, error: string, message: string, details?: any) {
  const response: ApiError = {
    success: false,
    error,
    message
  };

  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }

  res.status(statusCode).json(response);
}