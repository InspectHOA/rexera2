/**
 * @fileoverview Main tRPC application router for Rexera 2.0.
 *
 * This module orchestrates all individual tRPC routers into a unified API surface,
 * providing type-safe, end-to-end communication between the frontend and backend.
 * The router architecture enables modular organization while maintaining a cohesive
 * API structure for the Rexera real estate workflow automation platform.
 *
 * Router Architecture:
 * - Modular design with domain-specific routers
 * - Type-safe API contracts with automatic inference
 * - Centralized routing for consistent API structure
 * - Scalable organization supporting feature growth
 *
 * API Domains:
 * - workflows: Core workflow orchestration and management
 * - tasks: Individual task management and execution
 * - health: System health monitoring and diagnostics
 * - interrupts: Human-in-the-Loop intervention management
 * - agents: AI agent coordination and performance monitoring
 * - activities: Activity tracking and audit trail management
 *
 * Key Benefits:
 * - End-to-end type safety from database to frontend
 * - Automatic API documentation and validation
 * - Consistent error handling and response formats
 * - Real-time subscriptions and optimistic updates
 * - Built-in request/response transformation
 *
 * Business Context:
 * - Enables rapid frontend development with type safety
 * - Supports real-time workflow monitoring and updates
 * - Facilitates API versioning and backward compatibility
 * - Provides foundation for mobile and third-party integrations
 *
 * Integration Points:
 * - Express server mounts tRPC router at /api/trpc
 * - Frontend clients use generated types for API calls
 * - Real-time subscriptions support live dashboard updates
 * - Error boundaries provide consistent error handling
 *
 * @module AppRouter
 * @requires ./trpc - Core tRPC router factory
 * @requires ./routers/* - Domain-specific router implementations
 */

import { router } from './trpc';
import { workflowsRouter } from './routers/workflows';
import { tasksRouter } from './routers/tasks';
import { healthRouter } from './routers/health';
import { interruptsRouter } from './routers/interrupts';
import { agentsRouter } from './routers/agents';
import { activitiesRouter } from './routers/activities';

/**
 * Main application router combining all domain-specific routers.
 *
 * Business Context:
 * - Provides unified API surface for Rexera workflow automation
 * - Enables type-safe communication between frontend and backend
 * - Supports modular development and feature organization
 * - Facilitates API documentation and client generation
 *
 * Router Organization:
 * - workflows: Core business logic for real estate workflow automation
 * - tasks: Granular task management for AI agents and human experts
 * - health: System monitoring and operational visibility
 * - interrupts: Exception handling and human intervention workflows
 * - agents: AI agent coordination and performance optimization
 * - activities: Comprehensive audit trails and activity tracking
 *
 * Type Safety Benefits:
 * - Compile-time validation of API contracts
 * - Automatic type inference for frontend clients
 * - IntelliSense support for API development
 * - Runtime validation with Zod schemas
 * - Consistent error handling and response formats
 *
 * Performance Considerations:
 * - Efficient request routing and procedure resolution
 * - Optimized serialization and deserialization
 * - Built-in caching and request deduplication
 * - Real-time subscriptions with minimal overhead
 */
export const appRouter = router({
  /** Workflow orchestration and management endpoints */
  workflows: workflowsRouter,
  /** Task management and execution endpoints */
  tasks: tasksRouter,
  /** System health monitoring and diagnostics */
  health: healthRouter,
  /** Human-in-the-Loop intervention management */
  interrupts: interruptsRouter,
  /** AI agent coordination and monitoring */
  agents: agentsRouter,
  /** Activity tracking and audit trail management */
  activities: activitiesRouter,
});

/**
 * Type definition for the complete application router.
 *
 * Business Context:
 * - Enables type-safe frontend development with automatic inference
 * - Supports API client generation and documentation
 * - Provides compile-time validation of API usage
 * - Facilitates refactoring and maintenance with type checking
 *
 * Usage:
 * - Frontend clients import this type for tRPC client configuration
 * - API documentation tools use this type for schema generation
 * - Development tools provide IntelliSense based on this type
 * - Testing frameworks validate API contracts using this type
 */
export type AppRouter = typeof appRouter;