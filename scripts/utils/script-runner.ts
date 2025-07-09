#!/usr/bin/env tsx

/**
 * Unified Script Runner for Rexera 2.0
 * 
 * This utility provides a consistent interface for running one-off scripts,
 * migrations, and administrative tasks across the entire monorepo.
 * 
 * Usage:
 *   tsx scripts/utils/script-runner.ts <script-name> [args...]
 *   
 * Examples:
 *   tsx scripts/utils/script-runner.ts migrate:sla
 *   tsx scripts/utils/script-runner.ts seed:database --env=dev
 *   tsx scripts/utils/script-runner.ts test:webhook --workflow=payoff
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

// Script registry - centralized list of all available scripts
const SCRIPT_REGISTRY = {
  // Database operations
  'migrate:sla': {
    path: 'scripts/migrations/sla-migration.ts',
    description: 'Apply SLA tracking migration to database'
  },
  'migrate:notifications': {
    path: 'scripts/migrations/notification-migration.ts', 
    description: 'Apply notification read tracking migration'
  },
  'migrate:unique-human-id': {
    path: 'scripts/migrations/add-unique-human-readable-id.ts',
    description: 'Add unique constraint to workflows.human_readable_id'
  },
  'seed:database': {
    path: 'scripts/database/seed-database.ts',
    description: 'Seed database with basic initial data'
  },
  'seed:test-data': {
    path: 'scripts/database/seed-test-data.ts',
    description: 'Seed database with comprehensive test data'
  },
  'seed:add-tasks': {
    path: 'scripts/database/add-test-tasks.ts',
    description: 'Add additional tasks to existing workflows'
  },
  
  // Testing utilities
  'test:api': {
    path: 'scripts/testing/test-api-integration.ts',
    description: 'Test API endpoints integration'
  },
  'test:webhook': {
    path: 'scripts/testing/test-webhook-direct.ts',
    description: 'Test n8n webhook functionality'
  },
  'test:n8n': {
    path: 'scripts/testing/test-n8n-integration.ts',
    description: 'Test n8n workflow integration'
  },
  'test:single-task': {
    path: 'scripts/testing/test-single-task.ts',
    description: 'Test single task creation'
  },
  
  // Workflow management
  'workflow:import': {
    path: 'scripts/workflows/import-workflow.ts',
    description: 'Import workflow definitions to n8n'
  },
  'workflow:deploy': {
    path: 'scripts/workflows/deploy-workflows.ts',
    description: 'Deploy workflows to n8n Cloud'
  },
  'workflow:backup': {
    path: 'scripts/workflows/backup-workflows.ts',
    description: 'Backup all n8n workflows'
  },
  
  // Administrative tasks
  'admin:sla-monitor': {
    path: 'scripts/admin/sla-monitor.ts',
    description: 'Run SLA monitoring check (dev version)'
  },
  'admin:cleanup-old-data': {
    path: 'scripts/admin/cleanup-old-data.ts',
    description: 'Clean up old notifications and test data'
  },
  'admin:user-create': {
    path: 'scripts/admin/create-user.ts',
    description: 'Create a new user account'
  },
  
  // Development utilities
  'dev:reset-database': {
    path: 'scripts/dev/reset-database.ts',
    description: 'Reset database to clean state (DESTRUCTIVE)'
  },
  'dev:create-test-notification': {
    path: 'scripts/dev/create-test-notification.ts',
    description: 'Create test notification for user'
  }
} as const;

type ScriptName = keyof typeof SCRIPT_REGISTRY;

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }
  
  const scriptName = args[0] as ScriptName;
  const scriptArgs = args.slice(1);
  
  // List all available scripts
  if (scriptName === 'list') {
    listScripts();
    process.exit(0);
  }
  
  // Validate script exists in registry
  if (!(scriptName in SCRIPT_REGISTRY)) {
    console.error(`❌ Unknown script: ${scriptName}`);
    console.error(`💡 Run 'tsx scripts/utils/script-runner.ts list' to see available scripts`);
    process.exit(1);
  }
  
  const script = SCRIPT_REGISTRY[scriptName];
  const scriptPath = path.join(process.cwd(), script.path);
  
  // Check if script file exists
  if (!existsSync(scriptPath)) {
    console.error(`❌ Script file not found: ${script.path}`);
    console.error(`💡 The script may need to be created or the path updated`);
    process.exit(1);
  }
  
  try {
    console.log(`🚀 Running script: ${scriptName}`);
    console.log(`📄 Description: ${script.description}`);
    console.log(`📂 Path: ${script.path}`);
    console.log(''); // Empty line for readability
    
    // Execute the script with tsx
    execSync(`tsx ${scriptPath} ${scriptArgs.join(' ')}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('');
    console.log(`✅ Script completed successfully: ${scriptName}`);
    
  } catch (error) {
    console.error('');
    console.error(`❌ Script failed: ${scriptName}`);
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔧 Rexera 2.0 Script Runner

Usage:
  tsx scripts/utils/script-runner.ts <script-name> [args...]

Available commands:
  list                    List all available scripts
  --help, -h             Show this help message

Common script examples:
  tsx scripts/utils/script-runner.ts migrate:sla
  tsx scripts/utils/script-runner.ts seed:database --env=dev  
  tsx scripts/utils/script-runner.ts test:webhook --workflow=payoff
  tsx scripts/utils/script-runner.ts workflow:import
  tsx scripts/utils/script-runner.ts admin:sla-monitor

💡 Tip: Run 'list' command to see all available scripts with descriptions
`);
}

function listScripts() {
  console.log('📋 Available Scripts:\n');
  
  const categories = {
    'Database Operations': ['migrate:', 'seed:'],
    'Testing Utilities': ['test:'],
    'Workflow Management': ['workflow:'],
    'Administrative Tasks': ['admin:'],
    'Development Utilities': ['dev:']
  };
  
  for (const [category, prefixes] of Object.entries(categories)) {
    console.log(`\n📁 ${category}:`);
    
    Object.entries(SCRIPT_REGISTRY)
      .filter(([name]) => prefixes.some(prefix => name.startsWith(prefix)))
      .forEach(([name, script]) => {
        console.log(`  ${name.padEnd(25)} - ${script.description}`);
      });
  }
  
  console.log('\n💡 Usage: tsx scripts/utils/script-runner.ts <script-name> [args...]');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}