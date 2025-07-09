/**
 * Base Script Utility for Rexera 2.0
 * 
 * Provides common functionality for all scripts including:
 * - Environment management
 * - Database connection
 * - Logging utilities
 * - Error handling
 * - Argument parsing
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import path from 'path';

// Load environment variables from multiple possible locations
const envPaths = [
  '.env',
  '.env.local', 
  'serverless-api/.env',
  'frontend/.env.local'
];

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

export interface ScriptConfig {
  name: string;
  description: string;
  requiresDb?: boolean;
  requiresN8n?: boolean;
  requiresArgs?: string[];
}

export class BaseScript {
  protected supabase?: SupabaseClient;
  protected config: ScriptConfig;
  protected args: Record<string, string | boolean>;

  constructor(config: ScriptConfig) {
    this.config = config;
    this.args = this.parseArgs();
    
    if (config.requiresDb) {
      this.initDatabase();
    }
    
    this.validateRequiredArgs();
  }

  /**
   * Initialize Supabase database connection
   */
  private initDatabase() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      this.error('Missing Supabase environment variables. Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    }

    this.supabase = createClient(supabaseUrl!, supabaseKey!);
    this.log('✅ Database connection initialized');
  }

  /**
   * Parse command line arguments
   */
  private parseArgs(): Record<string, string | boolean> {
    const args: Record<string, string | boolean> = {};
    const argv = process.argv.slice(2);

    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      
      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        const nextArg = argv[i + 1];
        
        if (nextArg && !nextArg.startsWith('--')) {
          args[key] = nextArg;
          i++; // Skip next argument since we used it as value
        } else {
          args[key] = true;
        }
      }
    }

    return args;
  }

  /**
   * Validate required arguments are present
   */
  private validateRequiredArgs() {
    if (!this.config.requiresArgs) return;

    const missingArgs = this.config.requiresArgs.filter(arg => !(arg in this.args));
    
    if (missingArgs.length > 0) {
      this.error(`Missing required arguments: ${missingArgs.join(', ')}`);
    }
  }

  /**
   * Check if we have n8n environment variables
   */
  protected checkN8nEnv(): boolean {
    const n8nUrl = process.env.N8N_BASE_URL;
    const n8nKey = process.env.N8N_API_KEY;
    
    if (!n8nUrl || !n8nKey) {
      if (this.config.requiresN8n) {
        this.error('Missing n8n environment variables. Required: N8N_BASE_URL, N8N_API_KEY');
      }
      return false;
    }
    
    return true;
  }

  /**
   * Logging utilities
   */
  protected log(message: string) {
    console.log(`[${this.config.name}] ${message}`);
  }

  protected warn(message: string) {
    console.warn(`⚠️  [${this.config.name}] ${message}`);
  }

  protected error(message: string, exit: boolean = true): never {
    console.error(`❌ [${this.config.name}] ${message}`);
    if (exit) {
      process.exit(1);
    }
    throw new Error(message);
  }

  protected success(message: string) {
    console.log(`✅ [${this.config.name}] ${message}`);
  }

  /**
   * Get argument value with default
   */
  protected getArg(key: string, defaultValue?: string): string | undefined {
    const value = this.args[key];
    return typeof value === 'string' ? value : defaultValue;
  }

  /**
   * Check if argument flag is set
   */
  protected hasFlag(key: string): boolean {
    return Boolean(this.args[key]);
  }

  /**
   * Confirm destructive operations
   */
  protected async confirmDestructive(operation: string): Promise<boolean> {
    if (this.hasFlag('force') || this.hasFlag('yes')) {
      return true;
    }

    console.log(`⚠️  This operation will ${operation}`);
    console.log('This action cannot be undone.');
    console.log('');
    console.log('Add --force to skip this confirmation in the future.');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      readline.question('Are you sure you want to continue? (yes/no): ', (answer: string) => {
        readline.close();
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });
  }

  /**
   * Sleep utility for delays
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute the script - to be implemented by subclasses
   */
  async run(): Promise<void> {
    throw new Error('Script must implement run() method');
  }
}

/**
 * Environment utilities
 */
export const ENV = {
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  
  n8nUrl: process.env.N8N_BASE_URL,
  n8nApiKey: process.env.N8N_API_KEY,
  
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
};

/**
 * Quick script runner for simple one-off scripts
 */
export function createScript(config: ScriptConfig, runner: (script: BaseScript) => Promise<void>) {
  const script = new BaseScript(config);
  
  script.run = async () => {
    try {
      await runner(script);
      script.success('Script completed successfully');
    } catch (error) {
      script.error(`Script failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  return script;
}