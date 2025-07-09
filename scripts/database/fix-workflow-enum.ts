#!/usr/bin/env tsx

/**
 * Fix Workflow Type Enum Script
 * 
 * Updates the workflow_type enum in the database to match the code
 */

import { BaseScript } from '../utils/base-script.js';

class FixWorkflowEnumScript extends BaseScript {
  constructor() {
    super({
      name: 'Fix Workflow Enum',
      description: 'Fix workflow_type enum to use PAYOFF',
      requiresDb: true
    });
  }

  async run(): Promise<void> {
    this.log('Fixing workflow_type enum...');
    
    try {
      // First check if PAYOFF already exists
      const { data: workflows, error: checkError } = await this.supabase!
        .from('workflows')
        .select('workflow_type')
        .limit(1);
      
      this.log('Current workflows in database:', workflows?.length || 0);

      // Try to create a test workflow with PAYOFF to see if it works
      try {
        const { data: testResult, error: testError } = await this.supabase!
          .from('workflows')
          .insert({
            workflow_type: 'PAYOFF',
            client_id: '00000000-0000-0000-0000-000000000000', // Dummy ID
            title: 'Test enum'
          })
          .select();

        if (testError) {
          this.log(`❌ PAYOFF enum value not accepted: ${testError.message}`);
          this.log('Need to add PAYOFF to enum...');
          
          // We need to add the new enum value
          const { error: alterError } = await this.supabase!
            .rpc('exec_sql', {
              sql: "ALTER TYPE workflow_type ADD VALUE IF NOT EXISTS 'PAYOFF';"
            });

          if (alterError) {
            this.log(`⚠️  Could not alter enum directly: ${alterError.message}`);
            this.log('Enum might need manual database migration');
          } else {
            this.log('✅ Added PAYOFF to workflow_type enum');
          }
        } else {
          this.log('✅ PAYOFF enum value is already working');
          // Clean up test record
          if (testResult && testResult[0]) {
            await this.supabase!
              .from('workflows')
              .delete()
              .eq('id', testResult[0].id);
          }
        }
      } catch (error) {
        this.log(`❌ Test insert failed: ${error}`);
      }

      this.success('Workflow enum check completed');
      
    } catch (error) {
      this.error(`Failed to fix workflow enum: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Run script if called directly
if (require.main === module) {
  const script = new FixWorkflowEnumScript();
  script.run().catch(console.error);
}