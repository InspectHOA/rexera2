#!/usr/bin/env tsx
/**
 * Script to add and populate human_readable_id column for workflows
 * This creates proper human-readable IDs without requiring a full database reset
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: './serverless-api/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wmgidablmqotriwlefhq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ2lkYWJsbXFvdHJpd2xlZmhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEzNzk2NywiZXhwIjoyMDY2NzEzOTY3fQ.viSjS9PV2aDSOIzayHv6zJG-rjmjOBOVMsHlm77h6ns';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrateHumanReadableIds() {
  console.log('🔄 Starting human readable ID migration...');

  try {
    // Step 1: Get all workflows
    console.log('📋 Fetching existing workflows...');
    const { data: workflows, error: fetchError } = await supabase
      .from('workflows')
      .select('id, title, human_readable_id')
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch workflows: ${fetchError.message}`);
    }

    console.log(`📊 Found ${workflows?.length || 0} workflows`);

    // Step 2: Process each workflow
    let nextId = 1000;
    for (const workflow of workflows || []) {
      let humanId: string;

      // Extract from title if it exists (e.g., "PAYOFF #1000" -> "1000")
      const titleMatch = workflow.title?.match(/#(\d+)/);
      if (titleMatch) {
        humanId = titleMatch[1];
        console.log(`✅ Extracted "${humanId}" from title: "${workflow.title}"`);
        
        // Update nextId to be higher than any extracted ID
        const extractedNum = parseInt(humanId);
        if (extractedNum >= nextId) {
          nextId = extractedNum + 1;
        }
      } else {
        // Generate new ID for workflows without numbers in title
        humanId = nextId.toString();
        nextId++;
        console.log(`🔢 Generated "${humanId}" for workflow: "${workflow.title}"`);
      }

      // Step 3: Update the workflow with human_readable_id
      const { error: updateError } = await supabase
        .from('workflows')
        .update({ human_readable_id: humanId })
        .eq('id', workflow.id);

      if (updateError) {
        console.error(`❌ Failed to update workflow ${workflow.id}:`, updateError.message);
      } else {
        console.log(`✅ Updated workflow ${workflow.id} with human ID: ${humanId}`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log(`📈 Next auto-generated ID will be: ${nextId}`);
    
    // Step 4: Show the results
    console.log('\n📋 Final workflow human IDs:');
    const { data: updatedWorkflows } = await supabase
      .from('workflows')
      .select('human_readable_id, workflow_type, title')
      .order('human_readable_id');

    updatedWorkflows?.forEach(w => {
      const typePrefix = {
        'PAYOFF': 'PAY',
        'HOA_ACQUISITION': 'HOA',
        'MUNI_LIEN_SEARCH': 'MUNI'
      }[w.workflow_type] || 'WF';
      
      console.log(`  ${typePrefix}-${w.human_readable_id} | ${w.title}`);
    });

    console.log('\n🔗 You can now use URLs like:');
    console.log('  http://localhost:3000/workflow/1001');
    console.log('  http://localhost:3000/workflow/1000');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  migrateHumanReadableIds();
}