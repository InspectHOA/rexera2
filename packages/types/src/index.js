"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCHEMA_VERSION = exports.TYPES_VERSION = void 0;
// =====================================================
// CORE EXPORTS
// =====================================================
// Shared enums used across the application
__exportStar(require("./enums"), exports);
// Utility TypeScript types
__exportStar(require("./utilities"), exports);
// External service interfaces
__exportStar(require("./external"), exports);
// =====================================================
// LEGACY EXPORTS (TO BE MIGRATED TO SCHEMAS)
// =====================================================
// TODO: These should gradually move to @rexera/schemas as Zod schemas
// Database entity types (should become Zod schemas)
__exportStar(require("./database"), exports);
// API types (should become Zod schemas) 
__exportStar(require("./api"), exports);
// Agent types (should become Zod schemas)
__exportStar(require("./agents"), exports);
// Workflow types (should become Zod schemas)
__exportStar(require("./workflows"), exports);
// =====================================================
// CONSTANTS
// =====================================================
exports.TYPES_VERSION = '1.0.0';
exports.SCHEMA_VERSION = '2.0.0';
