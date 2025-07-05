/**
 * @fileoverview Core tRPC configuration and initialization for Rexera 2.0.
 *
 * This module initializes the tRPC instance with custom error formatting and
 * context typing, providing the foundation for type-safe API development.
 * The configuration ensures consistent error handling and optimal developer
 * experience across the entire Rexera application.
 *
 * tRPC Configuration:
 * - Context typing for authenticated database access
 * - Enhanced error formatting with Zod validation details
 * - Consistent error structure for frontend consumption
 * - Type-safe procedure and router creation
 *
 * Key Features:
 * - End-to-end type safety from database to frontend
 * - Automatic input validation with detailed error messages
 * - Consistent error handling and response formats
 * - Runtime type checking with compile-time inference
 *
 * Business Context:
 * - Enables rapid, type-safe API development
 * - Reduces runtime errors through compile-time validation
 * - Provides excellent developer experience with IntelliSense
 * - Supports maintainable and scalable API architecture
 *
 * Error Handling Strategy:
 * - Zod validation errors include field-specific details
 * - Consistent error structure for frontend error boundaries
 * - Detailed error information for debugging and troubleshooting
 * - User-friendly error messages for customer-facing interfaces
 *
 * @module TRPCCore
 * @requires @trpc/server - Core tRPC server functionality
 * @requires zod - Runtime type validation and error handling
 * @requires ./context - tRPC context type definitions
 */

import { initTRPC } from '@trpc/server';
import { ZodError } from 'zod';
import type { Context } from './context';

/**
 * Core tRPC instance with custom configuration for Rexera application.
 *
 * Business Context:
 * - Provides foundation for all tRPC routers and procedures
 * - Ensures consistent error handling across the application
 * - Enables type-safe API development with excellent DX
 * - Supports scalable API architecture and maintenance
 *
 * Configuration Features:
 * - Context typing for authenticated database access
 * - Enhanced error formatting with validation details
 * - Consistent error structure for frontend consumption
 * - Optimal performance with minimal overhead
 *
 * Error Formatting Strategy:
 * - Preserves original error shape for compatibility
 * - Adds Zod validation details for field-specific errors
 * - Provides structured error data for frontend error handling
 * - Enables detailed debugging while maintaining security
 *
 * Type Safety Benefits:
 * - Compile-time validation of procedure implementations
 * - Automatic type inference for frontend clients
 * - IntelliSense support for API development
 * - Runtime validation with detailed error reporting
 */
const t = initTRPC.context<Context>().create({
  /**
   * Custom error formatter that enhances error information for better debugging.
   *
   * Business Context:
   * - Provides detailed validation errors for form handling
   * - Enables field-specific error messages in frontend
   * - Supports debugging and troubleshooting workflows
   * - Maintains consistent error structure across API
   *
   * Error Enhancement:
   * - Preserves original tRPC error shape and metadata
   * - Adds flattened Zod validation errors for easy consumption
   * - Provides field-level error details for form validation
   * - Maintains error codes and HTTP status information
   *
   * Frontend Integration:
   * - Error boundaries can handle consistent error structure
   * - Form libraries can display field-specific validation errors
   * - Debugging tools receive detailed error information
   * - User interfaces show meaningful error messages
   */
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Router factory for creating tRPC routers with consistent configuration.
 *
 * Business Context:
 * - Enables modular API organization by domain
 * - Provides consistent error handling across all routers
 * - Supports scalable API architecture and feature development
 * - Maintains type safety and validation across router boundaries
 */
export const router = t.router;

/**
 * Procedure factory for creating tRPC procedures with context and validation.
 *
 * Business Context:
 * - Provides foundation for all API endpoints and operations
 * - Ensures consistent authentication and database access
 * - Enables input validation and type-safe implementations
 * - Supports middleware composition and request processing
 */
export const procedure = t.procedure;