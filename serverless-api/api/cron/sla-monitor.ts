/**
 * Vercel Cron Function for SLA Monitoring (TypeScript Version)
 * 
 * This endpoint runs the SLA monitoring logic as a Vercel cron job.
 * Configure in vercel.json to run every 15-30 minutes.
 * 
 * How it works:
 * 1. Vercel calls this endpoint on schedule (e.g., every 15 minutes)
 * 2. Function checks for SLA breaches using fallback logic for backward compatibility
 * 3. Creates notifications for breached tasks via existing HIL notification system
 * 4. Returns status for monitoring/logging
 */

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BreachedTask {
  id: string;
  workflow_id: string;
  title: string;
  task_type: string;
  status: string;
  sla_hours: number;
  sla_due_at: string;
  sla_status?: string;
  created_at: string;
}

interface HILUser {
  id: string;
  full_name: string | null;
  role: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security: Only allow POST requests from Vercel cron or authorized sources
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: Add authorization header check for security
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CRON_SECRET;
  
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
        console.error(`Failed to process breach for task ${task.id}:`, error instanceof Error ? error.message : 'Unknown error');
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
    console.error('❌ SLA monitoring failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Find tasks that have breached their SLA but haven't been marked as BREACHED yet
 * Handles cases where SLA fields may not exist yet
 */
async function findBreachedTasks(): Promise<BreachedTask[]> {
  try {
    // Try with SLA fields first (new schema)
    const { data: tasks, error } = await supabase
      .from('task_executions')
      .select('id, workflow_id, title, task_type, status, sla_due_at, sla_status, sla_hours, created_at')
      .lt('sla_due_at', new Date().toISOString()) // Past due date
      .neq('status', 'COMPLETED') // Not completed
      .eq('sla_status', 'ON_TIME'); // Haven't been marked as breached yet
    
    if (error) {
      // If SLA fields don't exist, fall back to basic logic
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('⚠️  SLA fields not found, using fallback logic...');
        return await findBreachedTasksFallback();
      }
      throw new Error(`Failed to query breached tasks: ${error.message}`);
    }
    
    return tasks || [];
  } catch (err) {
    console.log('⚠️  SLA query failed, using fallback logic:', err instanceof Error ? err.message : 'Unknown error');
    return await findBreachedTasksFallback();
  }
}

/**
 * Fallback method for finding breached tasks when SLA fields don't exist
 * Uses 24 hour default SLA based on created_at
 */
async function findBreachedTasksFallback(): Promise<BreachedTask[]> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: tasks, error } = await supabase
    .from('task_executions')
    .select('id, workflow_id, title, task_type, status, created_at')
    .lt('created_at', twentyFourHoursAgo) // Older than 24 hours
    .neq('status', 'COMPLETED') // Not completed
    .in('status', ['PENDING', 'AWAITING_REVIEW']); // Active statuses
  
  if (error) {
    throw new Error(`Failed to query breached tasks (fallback): ${error.message}`);
  }
  
  // Add computed SLA fields for compatibility
  return (tasks || []).map(task => ({
    ...task,
    sla_hours: 24,
    sla_due_at: new Date(new Date(task.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString(),
    sla_status: 'BREACHED'
  }));
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
  
  return users || [];
}

/**
 * Process a single SLA breach: update status and create notifications
 */
async function processSLABreach(task: BreachedTask, hilUsers: HILUser[]): Promise<void> {
  console.log(`📋 Processing SLA breach for task: ${task.title} (${task.id})`);
  
  // Calculate how overdue the task is
  const dueDate = new Date(task.sla_due_at);
  const now = new Date();
  const hoursOverdue = Math.round((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60));
  
  // Step 1: Try to update task SLA status to BREACHED (if SLA fields exist)
  try {
    const { error: updateError } = await supabase
      .from('task_executions')
      .update({ 
        sla_status: 'BREACHED',
        updated_at: now.toISOString()
      })
      .eq('id', task.id);
    
    if (updateError && !updateError.message.includes('does not exist')) {
      throw new Error(`Failed to update task SLA status: ${updateError.message}`);
    }
  } catch (err) {
    console.log(`⚠️  Could not update SLA status (fields may not exist): ${err instanceof Error ? err.message : 'Unknown error'}`);
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
        action_url: `/dashboard`, // Use dashboard since workflow detail may not exist
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