#!/usr/bin/env tsx
/**
 * Script Name: SLA Monitor
 * Purpose: Monitor tasks for SLA breaches and send notifications
 * Usage: tsx scripts/background/sla-monitor.ts
 * Schedule: Run every 15-30 minutes via cron or GitHub Actions
 * 
 * How SLA Tracking Works:
 * 1. When a task starts, sla_due_at is auto-calculated (started_at + sla_hours)
 * 2. This script checks for tasks where sla_due_at < now() and status != 'COMPLETED'
 * 3. For breached tasks, it updates sla_status to 'BREACHED' and creates HIL notifications
 * 4. The sla_status update triggers frontend notifications via existing useNotifications hook
 * 5. Avoids duplicate notifications by only processing tasks with sla_status = 'ON_TIME'
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: './serverless-api/.env' });

interface TaskExecution {
  id: string;
  workflow_id: string;
  title: string;
  task_type: string;
  status: string;
  sla_due_at: string;
  sla_status: string;
  sla_hours: number;
  started_at: string;
}

interface HILUser {
  id: string;
  full_name: string;
  role: string;
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main(): Promise<void> {
  console.log('🔍 SLA Monitor - Checking for SLA breaches...');
  
  try {
    // Step 1: Find tasks that have breached their SLA
    const breachedTasks = await findBreachedTasks();
    
    if (breachedTasks.length === 0) {
      console.log('✅ No SLA breaches found');
      return;
    }
    
    console.log(`⚠️  Found ${breachedTasks.length} SLA breaches`);
    
    // Step 2: Get HIL users to notify
    const hilUsers = await getHILUsers();
    
    // Step 3: Process each breached task
    for (const task of breachedTasks) {
      await processSLABreach(task, hilUsers);
    }
    
    console.log('✅ SLA monitoring completed');
    
  } catch (error) {
    console.error('❌ SLA monitoring failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Find tasks that have breached their SLA but haven't been marked as BREACHED yet
 * This prevents duplicate notifications for the same breach
 */
async function findBreachedTasks(): Promise<TaskExecution[]> {
  const { data: tasks, error } = await supabase
    .from('task_executions')
    .select('id, workflow_id, title, task_type, status, sla_due_at, sla_status, sla_hours, started_at')
    .lt('sla_due_at', new Date().toISOString()) // Past due date
    .neq('status', 'COMPLETED') // Not completed
    .eq('sla_status', 'ON_TIME'); // Haven't been marked as breached yet
  
  if (error) {
    throw new Error(`Failed to query breached tasks: ${error.message}`);
  }
  
  return (tasks || []) as TaskExecution[];
}

/**
 * Get all HIL users who should receive SLA breach notifications
 */
async function getHILUsers(): Promise<HILUser[]> {
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, role')
    .eq('user_type', 'hil_user');
  
  if (error) {
    throw new Error(`Failed to query HIL users: ${error.message}`);
  }
  
  return (users || []) as HILUser[];
}

/**
 * Process a single SLA breach:
 * 1. Update task sla_status to 'BREACHED' 
 * 2. Create HIL notifications for relevant users
 * 3. Log the breach for monitoring
 */
async function processSLABreach(task: TaskExecution, hilUsers: HILUser[]): Promise<void> {
  console.log(`📋 Processing SLA breach for task: ${task.title} (${task.id})`);
  
  // Calculate how overdue the task is
  const dueDate = new Date(task.sla_due_at);
  const now = new Date();
  const hoursOverdue = Math.round((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60));
  
  try {
    // Step 1: Update task SLA status to BREACHED
    // This will trigger frontend notifications via existing useNotifications hook
    const { error: updateError } = await supabase
      .from('task_executions')
      .update({ 
        sla_status: 'BREACHED',
        updated_at: now.toISOString()
      })
      .eq('id', task.id);
    
    if (updateError) {
      throw new Error(`Failed to update task SLA status: ${updateError.message}`);
    }
    
    // Step 2: Create HIL notifications using existing notification system
    for (const user of hilUsers) {
      await createSLABreachNotification(task, user, hoursOverdue);
    }
    
    console.log(`✅ Processed SLA breach for task ${task.id} (${hoursOverdue}h overdue)`);
    
  } catch (error) {
    console.error(`❌ Failed to process SLA breach for task ${task.id}:`, error instanceof Error ? error.message : error);
  }
}

/**
 * Create a HIL notification for an SLA breach
 * Uses the existing hil_notifications table and SLA_WARNING type
 */
async function createSLABreachNotification(
  task: TaskExecution, 
  user: HILUser, 
  hoursOverdue: number
): Promise<void> {
  const { error } = await supabase
    .from('hil_notifications')
    .insert({
      user_id: user.id,
      type: 'SLA_WARNING', // Existing notification type
      priority: 'HIGH',
      title: '⏰ SLA Breached',
      message: `Task "${task.title}" is ${hoursOverdue} hours overdue (${task.sla_hours}h SLA)`,
      action_url: `/workflow/${task.workflow_id}`,
      metadata: {
        task_id: task.id,
        task_type: task.task_type,
        hours_overdue: hoursOverdue,
        sla_hours: task.sla_hours,
        breach_detected_at: new Date().toISOString()
      }
    });
  
  if (error) {
    throw new Error(`Failed to create notification for user ${user.id}: ${error.message}`);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 SLA monitor interrupted by user');
  process.exit(0);
});

// Run script if called directly
if (require.main === module) {
  main();
}