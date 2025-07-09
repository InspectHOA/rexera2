/**
 * Test Environment Configuration
 * Manages different test environments and their settings
 */

export interface TestEnvironmentConfig {
  name: string;
  baseURL: string;
  database: {
    url: string;
    serviceRoleKey: string;
  };
  timeout: number;
  retries: number;
  parallel: boolean;
  cleanup: boolean;
}

export const TEST_ENVIRONMENTS: Record<string, TestEnvironmentConfig> = {
  // Local development testing
  local: {
    name: 'Local Development',
    baseURL: 'http://localhost:3001',
    database: {
      url: process.env.SUPABASE_URL || 'http://localhost:54321',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'
    },
    timeout: 10000,
    retries: 2,
    parallel: true,
    cleanup: true
  },

  // CI/CD testing environment
  ci: {
    name: 'CI/CD Testing',
    baseURL: process.env.API_BASE_URL || 'http://localhost:3001',
    database: {
      url: process.env.SUPABASE_URL || 'postgresql://postgres:postgres@localhost:5432/rexera_test',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'ci-test-key'
    },
    timeout: 30000,
    retries: 3,
    parallel: false, // More stable in CI
    cleanup: true
  },

  // Staging deployment testing
  staging: {
    name: 'Staging Deployment',
    baseURL: process.env.STAGING_API_URL || 'https://rexera2-api-staging.vercel.app',
    database: {
      url: process.env.SUPABASE_STAGING_URL || process.env.SUPABASE_URL || '',
      serviceRoleKey: process.env.SUPABASE_STAGING_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    },
    timeout: 15000,
    retries: 3,
    parallel: true,
    cleanup: false // Don't cleanup staging data automatically
  },

  // Production monitoring (read-only tests)
  production: {
    name: 'Production Monitoring',
    baseURL: process.env.PRODUCTION_API_URL || 'https://rexera2-api.vercel.app',
    database: {
      url: process.env.SUPABASE_PRODUCTION_URL || '',
      serviceRoleKey: process.env.SUPABASE_PRODUCTION_SERVICE_ROLE_KEY || ''
    },
    timeout: 10000,
    retries: 5,
    parallel: true,
    cleanup: false // Never cleanup production data
  }
};

/**
 * Get current test environment configuration
 */
export function getTestEnvironment(): TestEnvironmentConfig {
  const envName = process.env.TEST_ENV || 'local';
  
  if (process.env.CI === 'true') {
    return TEST_ENVIRONMENTS.ci;
  }
  
  if (process.env.VERCEL_ENV === 'production') {
    return TEST_ENVIRONMENTS.production;
  }
  
  if (process.env.VERCEL_ENV === 'preview') {
    return TEST_ENVIRONMENTS.staging;
  }
  
  const config = TEST_ENVIRONMENTS[envName];
  if (!config) {
    throw new Error(`Unknown test environment: ${envName}. Available: ${Object.keys(TEST_ENVIRONMENTS).join(', ')}`);
  }
  
  return config;
}

/**
 * Validate test environment configuration
 */
export function validateTestEnvironment(config: TestEnvironmentConfig): void {
  const errors: string[] = [];
  
  if (!config.baseURL) {
    errors.push('Base URL is required');
  }
  
  if (!config.database.url) {
    errors.push('Database URL is required');
  }
  
  if (!config.database.serviceRoleKey) {
    errors.push('Database service role key is required');
  }
  
  if (config.timeout < 1000) {
    errors.push('Timeout must be at least 1000ms');
  }
  
  if (errors.length > 0) {
    throw new Error(`Test environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
}

/**
 * Test environment utilities
 */
export const TestEnvironmentUtils = {
  /**
   * Check if running in CI environment
   */
  isCI: () => process.env.CI === 'true',
  
  /**
   * Check if running against production
   */
  isProduction: () => {
    const config = getTestEnvironment();
    return config.name === 'Production Monitoring';
  },
  
  /**
   * Check if cleanup should be performed
   */
  shouldCleanup: () => {
    const config = getTestEnvironment();
    return config.cleanup;
  },
  
  /**
   * Get appropriate timeout for current environment
   */
  getTimeout: () => {
    const config = getTestEnvironment();
    return config.timeout;
  },
  
  /**
   * Get retry count for current environment
   */
  getRetries: () => {
    const config = getTestEnvironment();
    return config.retries;
  },
  
  /**
   * Check if parallel execution is enabled
   */
  isParallelEnabled: () => {
    const config = getTestEnvironment();
    return config.parallel;
  },
  
  /**
   * Log environment information
   */
  logEnvironmentInfo: () => {
    const config = getTestEnvironment();
    console.log(`\n🧪 Test Environment: ${config.name}`);
    console.log(`📍 Base URL: ${config.baseURL}`);
    console.log(`⏱️  Timeout: ${config.timeout}ms`);
    console.log(`🔄 Retries: ${config.retries}`);
    console.log(`🏃 Parallel: ${config.parallel ? 'Yes' : 'No'}`);
    console.log(`🧹 Cleanup: ${config.cleanup ? 'Yes' : 'No'}\n`);
  }
};

/**
 * Environment-specific test tags
 */
export const TEST_TAGS = {
  UNIT: 'unit',
  INTEGRATION: 'integration',
  SMOKE: 'smoke',
  E2E: 'e2e',
  PERFORMANCE: 'performance',
  SECURITY: 'security',
  PRODUCTION_SAFE: 'production-safe', // Tests safe to run against production
  DESTRUCTIVE: 'destructive' // Tests that modify data
} as const;

/**
 * Check if a test should run in the current environment
 */
export function shouldRunTest(testTags: string[]): boolean {
  const config = getTestEnvironment();
  
  // In production, only run production-safe tests
  if (config.name === 'Production Monitoring') {
    return testTags.includes(TEST_TAGS.PRODUCTION_SAFE) && 
           !testTags.includes(TEST_TAGS.DESTRUCTIVE);
  }
  
  // In CI, skip performance tests unless specifically requested
  if (TestEnvironmentUtils.isCI() && testTags.includes(TEST_TAGS.PERFORMANCE)) {
    return process.env.RUN_PERFORMANCE_TESTS === 'true';
  }
  
  return true;
}