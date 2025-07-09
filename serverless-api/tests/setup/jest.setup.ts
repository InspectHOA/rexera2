/**
 * Jest Setup Configuration
 * Global test setup and teardown for the API test suite
 */

import { config } from 'dotenv';

// Load environment variables for testing
config();

// Global test configuration
beforeAll(async () => {
  // Set test environment variables
  Object.assign(process.env, { NODE_ENV: 'test' });
  
  // Ensure required environment variables exist
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for testing: ${missingVars.join(', ')}\n` +
      'Please check your .env file or CI/CD environment variable configuration.'
    );
  }
  
  // Set test-specific timeouts
  jest.setTimeout(30000);
});

// Global test cleanup
afterAll(async () => {
  // Clean up any global resources if needed
});

// Global test utilities
declare global {
  var testUtils: {
    generateTestData: () => any;
    cleanupTestData: (ids: string[]) => Promise<void>;
  };
}

// Extend Jest matchers for API testing
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
    const date = new Date(received);
    const pass = !isNaN(date.getTime());
    
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
  
  toMatchApiResponseFormat(received: any) {
    const hasSuccess = typeof received.success === 'boolean';
    const hasData = received.success ? received.data !== undefined : received.error !== undefined;
    const pass = hasSuccess && hasData;
    
    if (pass) {
      return {
        message: () => `expected response not to match API format`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to match API format: { success: boolean, data?: any, error?: any }`,
        pass: false,
      };
    }
  }
});

// Augment Jest expect interface
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidTimestamp(): R;
      toMatchApiResponseFormat(): R;
    }
  }
}