#!/usr/bin/env tsx
/**
 * Script to assign agents to existing tasks for development testing.
 * This helps test agent interfaces by ensuring tasks have proper agent assignments.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: './serverless-api/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wmgidablmqotriwlefhq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ2lkYWJsbXFvdHJpd2xlZmhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEzNzk2NywiZXhwIjoyMDY2NzEzOTY3fQ.viSjS9PV2aDSOIzayHv6zJG-rjmjOBOVMsHlm77h6ns';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function assignAgentsToTasks() {
  console.log('🔧 Assigning agents to tasks for development...');

  try {
    // First, get the agent IDs
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name')
      .in('name', ['Mia', 'Iris']);

    if (agentsError) {
      throw new Error(`Failed to fetch agents: ${agentsError.message}`);
    }

    const agentMap = new Map(agents?.map(agent => [agent.name, agent.id]) || []);
    console.log('🤖 Found agents:', Array.from(agentMap.keys()));

    // Get HOA_ACQUISITION workflow tasks (the one with emails)
    const { data: tasks, error: tasksError } = await supabase
      .from('task_executions')
      .select('id, title, workflow_id, workflows!inner(workflow_type)')
      .eq('workflows.workflow_type', 'HOA_ACQUISITION')
      .eq('workflow_id', '08425833-088a-4e3e-83da-7f0f4661791c');

    if (tasksError) {
      throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
    }

    if (!tasks || tasks.length === 0) {
      console.log('❌ No HOA_ACQUISITION tasks found for the target workflow');
      return;
    }

    console.log(`📋 Found ${tasks.length} tasks to assign agents to:`);
    tasks.forEach(task => {
      console.log(`  - ${task.title} (${task.id})`);
    });

    // Assign agents based on task titles
    const agentAssignments = [
      { taskTitle: 'Identify Lender Contact', agent: 'Mia' },
      { taskTitle: 'Send Payoff Request', agent: 'Mia' },  
      { taskTitle: 'Extract Payoff Data', agent: 'Iris' }
    ];

    for (const assignment of agentAssignments) {
      const task = tasks.find(t => t.title === assignment.taskTitle);
      const agentId = agentMap.get(assignment.agent);
      
      if (task && agentId) {
        const { error: updateError } = await supabase
          .from('task_executions')
          .update({ agent_id: agentId })
          .eq('id', task.id);

        if (updateError) {
          console.error(`❌ Failed to assign ${assignment.agent} to "${assignment.taskTitle}":`, updateError.message);
        } else {
          console.log(`✅ Assigned ${assignment.agent} (${agentId}) to "${assignment.taskTitle}"`);
        }
      } else {
        if (!task) console.log(`⚠️  Task "${assignment.taskTitle}" not found`);
        if (!agentId) console.log(`⚠️  Agent "${assignment.agent}" not found`);
      }
    }

    console.log('✅ Agent assignment completed!');
    console.log('🔗 Now you can test agent interfaces at: http://localhost:3000/workflow/08425833-088a-4e3e-83da-7f0f4661791c');

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  assignAgentsToTasks();
}