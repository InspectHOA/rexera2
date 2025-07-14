/**
 * Centralized auth configuration - single source of truth for auth behavior
 */

// Environment detection
export const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const isDevelopment = process.env.NODE_ENV === 'development';

// Auth bypass logic - centralized decision
export const shouldBypassAuth = isLocalhost && isDevelopment;

// Development user configuration
export const DEV_USER_CONFIG = {
  id: '82a7d984-485b-4a47-ac28-615a1b448473', // Seeded test user ID
  email: 'test@example.com',
  name: 'Test HIL User',
  role: 'HIL' as const,
  user_type: 'hil_user' as const,
  company_id: undefined
};

console.log('🔧 Auth config:', { 
  isLocalhost, 
  isDevelopment, 
  shouldBypassAuth 
});