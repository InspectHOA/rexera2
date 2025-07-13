/**
 * Smoke tests for Rexera 2.0 API
 * Quick tests to verify API is working without creating test data
 */

import { smokeTests as runSmokeTests } from './smoke-runner';

describe('API Smoke Tests', () => {
  it('should pass all smoke tests', async () => {
    const result = await runSmokeTests();
    expect(result).toBe(true);
  }, 30000); // 30 second timeout
});