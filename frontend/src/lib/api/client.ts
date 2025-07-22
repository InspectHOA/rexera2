/**
 * Backward compatibility layer for API client.
 * Re-exports everything from the new modular API structure.
 * @deprecated Use specific imports from @/lib/api instead
 */

// Re-export everything from the new API structure for backward compatibility
export * from './index';

// Default export for existing code that uses: import { api } from '@/lib/api/client'
export { api as default } from './index';