import { config } from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

config({ path: '../.env.local' });

// Check environment variables
console.log('Environment check:');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
console.log('SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  console.log('ℹ️  This test requires Supabase environment variables to be set');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TaskExecution {
  id: string;
  workflow_id: string;
  task_type: string;
  status: string;
}

async function testNotifications(): Promise<void> {
  console.log('🧪 Testing notification system...');
  
  try {
    // Test 1: Check if we can connect to database
    const { data: tables, error: tableError } = await supabase
      .from('task_executions')
      .select('id, status, task_type')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Database connection failed:', tableError);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Test 2: Check if we have any existing task_executions
    const { data: tasks, error: tasksError } = await supabase
      .from('task_executions')
      .select('id, workflow_id, task_type, status')
      .limit(5);
    
    if (tasksError) {
      console.error('❌ Task query failed:', tasksError);
      return;
    }
    
    console.log(`✅ Found ${tasks?.length || 0} task executions`);
    if (tasks && tasks.length > 0) {
      console.log('Sample task:', tasks[0]);
    }
    
    // Test 3: Try to update a task status to trigger notification
    if (tasks && tasks.length > 0) {
      const task = tasks[0] as TaskExecution;
      console.log(`🔄 Testing notification trigger by updating task ${task.id}...`);
      
      const { data: updatedTask, error: updateError } = await supabase
        .from('task_executions')
        .update({ 
          status: 'AWAITING_REVIEW',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Task update failed:', updateError);
        return;
      }
      
      console.log('✅ Task updated successfully:', updatedTask);
      console.log('📢 If notifications are working, you should see a toast in the frontend!');
      
      // Revert the change after 5 seconds
      setTimeout(async () => {
        await supabase
          .from('task_executions')
          .update({ 
            status: task.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id);
        console.log('🔄 Reverted task status to original');
      }, 5000);
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testNotifications();