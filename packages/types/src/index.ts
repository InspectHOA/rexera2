/**
 * Rexera 2.0 Types Package
 * 
 * This package contains:
 * ✅ Shared enums
 * ✅ Utility TS-only types  
 * ✅ External service interfaces (Supabase, Stripe, etc.)
 * 
 * For API validation schemas, use @rexera/schemas instead
 */

// =====================================================
// CORE EXPORTS
// =====================================================

// Shared enums used across the application
export * from './enums';

// Utility TypeScript types
export * from './utilities';

// External service interfaces
export * from './external';

// =====================================================
// LEGACY EXPORTS (TO BE MIGRATED TO SCHEMAS)
// =====================================================
// TODO: These should gradually move to @rexera/schemas as Zod schemas

// Database entity types (should become Zod schemas)
export * from './database';

// API types (should become Zod schemas) 
export * from './api';

// Agent types (should become Zod schemas)
export * from './agents';

// Workflow types (should become Zod schemas)
export * from './workflows';

// =====================================================
// CONSTANTS
// =====================================================

export const TYPES_VERSION = '1.0.0';
export const SCHEMA_VERSION = '2.0.0';