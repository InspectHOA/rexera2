"use strict";
/**
 * Shared enums for Rexera 2.0
 * These are used across the entire application for type safety
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASK_STATUSES = exports.WORKFLOW_STATUSES = exports.PRIORITY_LEVELS = exports.SUPPORTED_AGENT_TYPES = exports.SUPPORTED_WORKFLOW_TYPES = void 0;
// =====================================================
// CONSTANTS DERIVED FROM ENUMS
// =====================================================
exports.SUPPORTED_WORKFLOW_TYPES = [
    'MUNI_LIEN_SEARCH',
    'HOA_ACQUISITION',
    'PAYOFF'
];
exports.SUPPORTED_AGENT_TYPES = [
    'nina',
    'mia',
    'florian',
    'rex',
    'iris',
    'ria',
    'kosha',
    'cassy',
    'max',
    'corey'
];
exports.PRIORITY_LEVELS = [
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
];
exports.WORKFLOW_STATUSES = [
    'PENDING',
    'IN_PROGRESS',
    'AWAITING_REVIEW',
    'BLOCKED',
    'COMPLETED'
];
exports.TASK_STATUSES = [
    'PENDING',
    'AWAITING_REVIEW',
    'COMPLETED',
    'FAILED'
];
