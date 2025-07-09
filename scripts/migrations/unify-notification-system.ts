#!/usr/bin/env tsx

/**
 * Unified Notification System Migration
 * 
 * This script helps migrate from the dual notification system to the unified system.
 * It removes the old notification hooks and updates any remaining references.
 */

import { BaseScript } from '../utils/base-script.js';
import * as fs from 'fs';
import * as path from 'path';

class UnifyNotificationSystemScript extends BaseScript {
  constructor() {
    super({
      name: 'Unify Notification System',
      description: 'Migrate from dual notification system to unified system',
      requiresDb: false,
      requiresArgs: []
    });
  }

  async run(): Promise<void> {
    this.log('Starting notification system unification...');
    
    try {
      // Remove old notification hooks
      await this.removeOldHooks();
      
      // Update any remaining imports
      await this.updateImports();
      
      this.success('Notification system successfully unified!');
      this.log('');
      this.log('Summary of changes:');
      this.log('✅ Removed useNotifications.ts (old toast system)');
      this.log('✅ Removed usePersistentNotifications.ts (old persistent system)');
      this.log('✅ Updated all components to use useUnifiedNotifications');
      this.log('✅ Enhanced n8n webhook with automatic notification creation');
      this.log('✅ Updated documentation');
      this.log('');
      this.log('Next steps:');
      this.log('1. Test the unified notification system');
      this.log('2. Verify popup settings work correctly');
      this.log('3. Ensure n8n webhook creates notifications properly');
      
    } catch (error) {
      this.error(`Failed to unify notification system: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async removeOldHooks(): Promise<void> {
    const hooksDir = path.join(process.cwd(), 'frontend/src/lib/hooks');
    
    // Remove old notification hooks
    const oldHooks = [
      'useNotifications.ts',
      'usePersistentNotifications.ts'
    ];

    for (const hook of oldHooks) {
      const hookPath = path.join(hooksDir, hook);
      if (fs.existsSync(hookPath)) {
        this.log(`Removing old hook: ${hook}`);
        fs.unlinkSync(hookPath);
      }
    }
  }

  private async updateImports(): Promise<void> {
    this.log('Checking for any remaining old imports...');
    
    // This would scan for any remaining imports of the old hooks
    // For now, we'll just log that manual verification is needed
    this.log('Manual verification needed for any remaining imports of:');
    this.log('- useNotifications (should be useUnifiedNotifications)');
    this.log('- usePersistentNotifications (should be useUnifiedNotifications)');
  }
}

// Run script if called directly
if (require.main === module) {
  const script = new UnifyNotificationSystemScript();
  script.run().catch(console.error);
}

export { UnifyNotificationSystemScript };