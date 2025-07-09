#!/usr/bin/env tsx

/**
 * Check Enum Values Script
 * 
 * Tests what workflow_type enum values are accepted by the database
 */

import { BaseScript } from '../utils/base-script.js';

class CheckEnumValuesScript extends BaseScript {
  constructor() {
    super({
      name: 'Check Enum Values',
      description: 'Test which workflow_type enum values work',
      requiresDb: true
    });
  }

  async run(): Promise<void> {
    this.log('Testing workflow_type enum values...');
    
    const testValues = [
      'PAYOFF',
      'MUNI_LIEN_SEARCH',
      'HOA_ACQUISITION'
    ];

    // Get a test client to use
    const { data: clients } = await this.supabase!
      .from('clients')
      .select('id')
      .limit(1);

    if (!clients || clients.length === 0) {
      this.error('No clients found - create a client first');
      return;
    }

    const clientId = clients[0].id;

    for (const value of testValues) {
      try {
        this.log(`Testing: ${value}`);
        
        const { data, error } = await this.supabase!
          .from('workflows')
          .insert({
            workflow_type: value,
            client_id: clientId,
            title: `Test ${value}`
          })
          .select();

        if (error) {
          this.log(`❌ ${value}: ${error.message}`);
        } else {
          this.log(`✅ ${value}: Works!`);
          
          // Clean up - delete the test workflow
          if (data && data[0]) {
            await this.supabase!
              .from('workflows')
              .delete()
              .eq('id', data[0].id);
          }
        }
      } catch (error) {
        this.log(`❌ ${value}: ${error}`);
      }
    }

    this.success('Enum value testing completed');
  }
}

// Run script if called directly
if (require.main === module) {
  const script = new CheckEnumValuesScript();
  script.run().catch(console.error);
}