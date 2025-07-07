/**
 * Vercel Cron Function for SLA Monitoring
 * 
 * This endpoint runs the SLA monitoring logic as a Vercel cron job.
 * Configure in vercel.json to run every 15-30 minutes.
 * 
 * How it works:
 * 1. Vercel calls this endpoint on schedule (e.g., every 15 minutes)
 * 2. Function checks for SLA breaches using the same logic as the background script
 * 3. Creates notifications for breached tasks via existing HIL notification system
 * 4. Returns status for monitoring/logging
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Security: Only allow POST requests from Vercel cron or authorized sources
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: Add authorization header check for security
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CRON_SECRET; // Set this in Vercel env vars
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🔍 SLA Monitor - Starting cron job...');

  try {
    // Step 1: Find tasks that have breached their SLA
    const breachedTasks = await findBreachedTasks();
    
    if (breachedTasks.length === 0) {
      console.log('✅ No SLA breaches found');
      return res.status(200).json({ 
        success: true, 
        message: 'No SLA breaches found',
        breaches_processed: 0 
      });
    }
    
    console.log(`⚠️  Found ${breachedTasks.length} SLA breaches`);
    
    // Step 2: Get HIL users to notify
    const hilUsers = await getHILUsers();
    
    // Step 3: Process each breached task
    let processedCount = 0;
    for (const task of breachedTasks) {
      try {
        await processSLABreach(task, hilUsers);
        processedCount++;
      } catch (error) {
        console.error(`Failed to process breach for task ${task.id}:`, error.message);
      }
    }
    
    console.log(`✅ SLA monitoring completed - processed ${processedCount}/${breachedTasks.length} breaches`);
    
    return res.status(200).json({
      success: true,
      message: `Processed ${processedCount} SLA breaches`,
      breaches_found: breachedTasks.length,
      breaches_processed: processedCount
    });
    
  } catch (error) {
    console.error('❌ SLA monitoring failed:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

/**
 * Find tasks that have breached their SLA but haven't been marked as BREACHED yet
 */
async function findBreachedTasks() {
  const { data: tasks, error } = await supabase
    .from('task_executions')
    .select('id, workflow_id, title, task_type, status, sla_due_at, sla_status, sla_hours, started_at')
    .lt('sla_due_at', new Date().toISOString()) // Past due date
    .neq('status', 'COMPLETED') // Not completed
    .eq('sla_status', 'ON_TIME'); // Haven't been marked as breached yet
  
  if (error) {
    throw new Error(`Failed to query breached tasks: ${error.message}`);
  }
  
  return tasks || [];
}

/**
 * Get all HIL users who should receive SLA breach notifications
 */
async function getHILUsers() {
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, role')
    .eq('user_type', 'hil_user');
  
  if (error) {
    throw new Error(`Failed to query HIL users: ${error.message}`);
  }
  
  return users || [];
}

/**
 * Process a single SLA breach: update status and create notifications
 */
async function processSLABreach(task, hilUsers) {
  console.log(`📋 Processing SLA breach for task: ${task.title} (${task.id})`);
  
  // Calculate how overdue the task is
  const dueDate = new Date(task.sla_due_at);
  const now = new Date();
  const hoursOverdue = Math.round((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60));
  
  // Step 1: Update task SLA status to BREACHED
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
  
  // Step 2: Create HIL notifications
  for (const user of hilUsers) {
    const { error: notificationError } = await supabase
      .from('hil_notifications')
      .insert({
        user_id: user.id,
        type: 'SLA_WARNING',
        priority: 'HIGH',
        title: '⏰ SLA Breached',
        message: `Task "${task.title}" is ${hoursOverdue} hours overdue (${task.sla_hours}h SLA)`,
        action_url: `/workflow/${task.workflow_id}`,
        metadata: {
          task_id: task.id,
          task_type: task.task_type,
          hours_overdue: hoursOverdue,
          sla_hours: task.sla_hours,
          breach_detected_at: now.toISOString()
        }
      });
    
    if (notificationError) {
      console.error(`Failed to create notification for user ${user.id}:`, notificationError.message);
    }
  }
  
  console.log(`✅ Processed SLA breach for task ${task.id} (${hoursOverdue}h overdue)`);
}