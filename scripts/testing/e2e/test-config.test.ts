#!/usr/bin/env tsx

/**
 * E2E Configuration Test
 * 
 * Tests the E2E setup without requiring browser initialization
 */

import { z } from 'zod';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Test configuration schema
const TestConfigSchema = z.object({
  frontend_url: z.string().url(),
  api_url: z.string().url(), 
  test_email: z.string().email(),
  test_password: z.string().min(6)
});

const CONFIG = {
  frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000',
  api_url: process.env.API_URL || 'http://localhost:3001',
  test_email: process.env.TEST_EMAIL || 'test@example.com',
  test_password: process.env.TEST_PASSWORD || 'testpassword123',
};

async function testConfiguration() {
  console.log('🧪 Testing E2E configuration...');
  
  try {
    // Validate configuration
    const configResult = TestConfigSchema.safeParse(CONFIG);
    if (!configResult.success) {
      throw new Error(`Invalid configuration: ${configResult.error.message}`);
    }

    console.log('✅ Configuration validation passed');
    console.log(`   Frontend URL: ${CONFIG.frontend_url}`);
    console.log(`   API URL: ${CONFIG.api_url}`);
    console.log(`   Test Email: ${CONFIG.test_email}`);

    // Test environment variables
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.log(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
    } else {
      console.log('✅ Environment variables present');
    }

    // Test dependencies
    try {
      const stagehand = await import('@browserbasehq/stagehand');
      console.log('✅ Stagehand package imported successfully');
    } catch (error) {
      console.log('❌ Stagehand package import failed:', error);
      return false;
    }

    console.log('\n🎉 E2E configuration test passed!');
    console.log('\n📋 Next steps to run full E2E tests:');
    console.log('   1. Install Chrome/Chromium browser');
    console.log('   2. Install system dependencies: sudo npx playwright install-deps');
    console.log('   3. Start frontend and API services: pnpm dev');
    console.log('   4. Run E2E tests: pnpm test:e2e');

    return true;

  } catch (error) {
    console.error('❌ Configuration test failed:', error);
    return false;
  }
}

async function main() {
  const success = await testConfiguration();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

export default testConfiguration;