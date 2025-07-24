/**
 * Test setup and global configuration
 */

import { config } from 'dotenv';

// Load environment variables for testing
config();

// Setup test environment variables
if (!process.env.NODE_ENV) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true
  });
}

// Only mock Supabase credentials if real ones aren't available
// This allows integration tests to use real database when configured
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = 'https://mock.supabase.co';
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
}
if (!process.env.SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = 'mock-anon-key';
}

// Only mock fetch if we're using mock Supabase credentials
// This allows real database tests to work when real credentials are provided
if (process.env.SUPABASE_URL === 'https://mock.supabase.co') {
  // Mock fetch for tests that don't need real network calls
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ success: true, data: [] }),
      text: () => Promise.resolve(''),
    } as Response)
  );
}

// Custom Jest matchers
expect.extend({
  toMatchApiResponseFormat(received: any) {
    const pass = 
      typeof received === 'object' &&
      typeof received.success === 'boolean' &&
      (received.success ? 'data' in received : 'error' in received);

    if (pass) {
      return {
        message: () => `expected ${received} not to match API response format`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to match API response format`,
        pass: false,
      };
    }
  },

  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  toBeValidTimestamp(received: string) {
    const pass = !isNaN(Date.parse(received));

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid timestamp`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid timestamp`,
        pass: false,
      };
    }
  },
});

// Declare global types for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchApiResponseFormat(): R;
      toBeValidUUID(): R;
      toBeValidTimestamp(): R;
    }
  }
}