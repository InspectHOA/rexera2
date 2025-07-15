/**
 * Simplified auth configuration - SSO or skip_auth only
 */

// Simple auth bypass check - use SKIP_AUTH environment variable
export const SKIP_AUTH = process.env.NEXT_PUBLIC_SKIP_AUTH === 'true';

// Hardcoded user for skip_auth mode (real auth user)
export const SKIP_AUTH_USER = {
  id: '284219ff-3a1f-4e86-9ea4-3536f940451f',
  email: 'admin@rexera.com', 
  name: 'Admin User',
  role: 'HIL_ADMIN',
  user_type: 'hil_user'
};

console.log('🔧 Auth mode:', SKIP_AUTH ? 'SKIP_AUTH' : 'SSO');