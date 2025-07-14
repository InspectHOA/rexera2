#!/usr/bin/env tsx

/**
 * Complete Test Runner for Rexera
 * 
 * Runs all tests in the correct order for PR validation
 * 
 * Usage:
 *   pnpm test:all           # Run all tests
 *   tsx scripts/testing/run-all-tests.ts --fast    # Skip E2E tests
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime = Date.now();

  async runCommand(command: string, cwd?: string): Promise<{ success: boolean; output: string }> {
    return new Promise((resolve) => {
      const child = spawn('sh', ['-c', command], {
        cwd: cwd || process.cwd(),
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      child.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });

      child.stderr?.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(text);
      });

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          output: output + errorOutput
        });
      });
    });
  }

  async runTest(name: string, command: string, cwd?: string): Promise<boolean> {
    console.log(`\n🧪 Running ${name}...`);
    const testStart = Date.now();

    try {
      const result = await this.runCommand(command, cwd);
      const duration = Date.now() - testStart;

      this.results.push({
        name,
        success: result.success,
        duration,
        error: result.success ? undefined : 'Command failed'
      });

      if (result.success) {
        console.log(`✅ ${name} passed (${duration}ms)`);
        return true;
      } else {
        console.log(`❌ ${name} failed (${duration}ms)`);
        return false;
      }
    } catch (error) {
      const duration = Date.now() - testStart;
      this.results.push({
        name,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      console.log(`💥 ${name} crashed (${duration}ms): ${error}`);
      return false;
    }
  }

  async checkServices(): Promise<boolean> {
    console.log('\n🔍 Checking if services are running...');
    
    try {
      // Check API
      const apiCheck = await this.runCommand('curl -f http://localhost:3001/api/health');
      if (!apiCheck.success) {
        console.log('⚠️  API not running at localhost:3001');
        console.log('   Start with: pnpm dev (in root directory)');
        return false;
      }

      // Check Frontend
      const frontendCheck = await this.runCommand('curl -f http://localhost:3000');
      if (!frontendCheck.success) {
        console.log('⚠️  Frontend not running at localhost:3000');
        console.log('   Start with: pnpm dev (in root directory)');
        return false;
      }

      console.log('✅ Services are running');
      return true;
    } catch (error) {
      console.log('❌ Service check failed:', error);
      return false;
    }
  }

  printSummary() {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;

    console.log('\n📊 Test Summary');
    console.log('═'.repeat(50));
    
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = `${result.duration}ms`;
      console.log(`${status} ${result.name.padEnd(30)} ${duration.padStart(8)}`);
      if (result.error) {
        console.log(`   └─ ${result.error}`);
      }
    });

    console.log('═'.repeat(50));
    console.log(`Total: ${this.results.length} tests, ${passed} passed, ${failed} failed`);
    console.log(`Duration: ${totalDuration}ms`);
    
    if (failed > 0) {
      console.log('\n❌ Some tests failed. Check the output above for details.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    }
  }

  async runAllTests(skipE2E = false) {
    console.log('🚀 Starting Rexera test suite...');
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log(`🔧 Skip E2E: ${skipE2E}`);

    // 1. Type Check
    const typeCheckPassed = await this.runTest(
      'Type Check',
      'pnpm type-check'
    );
    if (!typeCheckPassed) {
      console.log('\n🛑 Type check failed. Fix TypeScript errors before continuing.');
      this.printSummary();
      return;
    }

    // 2. Lint
    await this.runTest(
      'Lint',
      'pnpm lint'
    );

    // 3. API Unit Tests
    await this.runTest(
      'API Unit Tests',
      'pnpm test:unit',
      './serverless-api'
    );

    // 4. API Integration Tests
    await this.runTest(
      'API Integration Tests', 
      'pnpm test:integration',
      './serverless-api'
    );

    // 5. API Smoke Tests
    await this.runTest(
      'API Smoke Tests',
      'pnpm test:smoke',
      './serverless-api'
    );

    // 6. Shared Package Tests (skip - no tests defined)
    console.log('ℹ️  Shared package has no tests configured');

    // 7. E2E Tests (if not skipped and services are running)
    if (!skipE2E) {
      const servicesRunning = await this.checkServices();
      if (servicesRunning) {
        await this.runTest(
          'E2E Tests',
          'pnpm test',
          './scripts/testing/e2e'
        );
      } else {
        this.results.push({
          name: 'E2E Tests',
          success: false,
          duration: 0,
          error: 'Services not running'
        });
      }
    } else {
      console.log('\n⏭️  Skipping E2E tests (--fast mode)');
    }

    this.printSummary();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const skipE2E = args.includes('--fast');

  const runner = new TestRunner();
  await runner.runAllTests(skipE2E);
}

if (require.main === module) {
  main().catch(console.error);
}

export default TestRunner;