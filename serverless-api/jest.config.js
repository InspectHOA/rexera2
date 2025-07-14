/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // TypeScript support
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }]
  },
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary', 'cobertura'],
  collectCoverageFrom: [
    'src/**/*.ts',
    'api/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!**/coverage/**',
    '!src/dev-server.ts',
    '!src/test-server.ts'
  ],
  
  // Coverage thresholds (relaxed for initial testing)
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@rexera/shared$': '<rootDir>/../packages/shared/src'
  },
  
  // Transform node_modules if needed
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@rexera/shared))'
  ],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Parallel testing
  maxWorkers: '50%'
};