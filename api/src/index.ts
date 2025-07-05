/**
 * @fileoverview Main entry point and type exports for Rexera 2.0 API.
 * 
 * This module serves as the primary entry point for the Rexera API package,
 * providing type exports for external consumption and client-side integration.
 * It enables type-safe client development by exposing the main tRPC router
 * type for use in client applications and external integrations.
 * 
 * Package Architecture:
 * - Centralized type exports for external consumption
 * - tRPC router type exposure for client-side type safety
 * - Clean API surface for package consumers
 * - Type-only exports to prevent runtime dependencies
 * 
 * Key Capabilities:
 * - AppRouter type export for tRPC client configuration
 * - Type-safe client development support
 * - External package integration capabilities
 * - Clean separation of types and implementation
 * 
 * Business Context:
 * - Enables type-safe client application development
 * - Supports external system integration with type safety
 * - Facilitates API documentation and contract validation
 * - Provides compile-time guarantees for API consumers
 * 
 * Integration Points:
 * - Client applications using tRPC for type-safe API calls
 * - External packages requiring Rexera API type definitions
 * - Development tools and IDE support for API integration
 * - API documentation generation and contract validation
 * 
 * Usage Patterns:
 * - Import AppRouter type in client applications
 * - Configure tRPC clients with proper type inference
 * - Enable IDE autocompletion and type checking
 * - Support API contract validation and testing
 * 
 * @module RexeraAPI
 * @requires ./trpc/router - Main tRPC application router
 */

export type { AppRouter } from './trpc/router';