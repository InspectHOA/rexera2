#!/usr/bin/env tsx

/**
 * Create Test Notification Script
 * 
 * Creates a test notification for a specified user to verify
 * the notification system is working correctly.
 */

import { BaseScript } from '../utils/base-script.js';

class CreateTestNotificationScript extends BaseScript {
  constructor() {
    super({
      name: 'Create Test Notification',
      description: 'Create a test notification for a user',
      requiresDb: true,
      requiresArgs: ['user']
    });
  }

  async run(): Promise<void> {
    const userEmail = this.getArg('user')!;
    const notificationType = this.getArg('type', 'TASK_INTERRUPT');
    const priority = this.getArg('priority', 'HIGH');
    
    this.log(`Creating test notification for user: ${userEmail}`);
    
    try {
      // Find or create user
      const userId = await this.findOrCreateUser(userEmail);
      
      // Create test workflow if needed
      const workflowId = await this.createTestWorkflow(userId);
      
      // Create test task execution
      const taskId = await this.createTestTask(workflowId);
      
      // Create notification
      await this.createNotification(userId, taskId, notificationType, priority);
      
      this.success(`Test notification created successfully for ${userEmail}`);
      
    } catch (error) {
      this.error(`Failed to create test notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async findOrCreateUser(email: string): Promise<string> {
    this.log(`Looking for user: ${email}`);
    
    // Try to find existing user
    const { data: existingUser } = await this.supabase!
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      this.log(`Found existing user: ${existingUser.id}`);
      return existingUser.id;
    }
    
    // Create new user profile
    this.log('Creating new user profile...');
    const { data: newUser, error } = await this.supabase!
      .from('user_profiles')
      .insert({
        id: crypto.randomUUID(),
        email: email,
        full_name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        user_type: 'hil_user',
        role: 'HIL'
      })
      .select('id')
      .single();
    
    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
    
    this.log(`Created new user: ${newUser.id}`);
    return newUser.id;
  }

  private async createTestWorkflow(userId: string): Promise<string> {
    this.log('Creating test workflow...');
    
    // Find a client to use (create one if needed)
    let { data: client } = await this.supabase!
      .from('clients')
      .select('id')
      .limit(1)
      .single();
    
    if (!client) {
      this.log('Creating test client...');
      const { data: newClient, error } = await this.supabase!
        .from('clients')
        .insert({
          name: 'Test Client',
          domain: 'test.example.com',
          type: 'BUSINESS'
        })
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Failed to create test client: ${error.message}`);
      }
      
      client = newClient;
    }
    
    const { data: workflow, error } = await this.supabase!
      .from('workflows')
      .insert({
        human_readable_id: `TEST-${Date.now()}`,
        workflow_type: 'PAYOFF',
        client_id: client.id,
        title: 'Test Notification Workflow',
        description: 'Test workflow for notification system verification',
        status: 'IN_PROGRESS',
        priority: 'NORMAL',
        metadata: { test: true },
        created_by: userId
      })
      .select('id')
      .single();
    
    if (error) {
      throw new Error(`Failed to create test workflow: ${error.message}`);
    }
    
    this.log(`Created test workflow: ${workflow.id}`);
    return workflow.id;
  }

  private async createTestTask(workflowId: string): Promise<string> {
    this.log('Creating test task execution...');
    
    const { data: task, error } = await this.supabase!
      .from('task_executions')
      .insert({
        workflow_id: workflowId,
        title: 'Test Task Requiring Review',
        description: 'This is a test task to verify the notification system',
        sequence_order: 1,
        task_type: 'DOCUMENT_REVIEW',
        status: 'AWAITING_REVIEW',
        interrupt_type: 'MANUAL_VERIFICATION',
        executor_type: 'HIL',
        priority: 'NORMAL',
        input_data: { test: true }
      })
      .select('id')
      .single();
    
    if (error) {
      throw new Error(`Failed to create test task: ${error.message}`);
    }
    
    this.log(`Created test task: ${task.id}`);
    return task.id;
  }

  private async createNotification(userId: string, taskId: string, type: string, priority: string): Promise<void> {
    this.log(`Creating ${type} notification with ${priority} priority...`);
    
    const { data: notification, error } = await this.supabase!
      .from('hil_notifications')
      .insert({
        user_id: userId,
        type: type,
        priority: priority,
        title: '🧪 Test Notification',
        message: `Test notification created at ${new Date().toLocaleString()}`,
        action_url: '/dashboard',
        metadata: {
          task_id: taskId,
          test: true,
          created_by_script: true
        }
      })
      .select('id')
      .single();
    
    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
    
    this.log(`Created notification: ${notification.id}`);
  }
}

// Run script if called directly
if (require.main === module) {
  const script = new CreateTestNotificationScript();
  script.run().catch(console.error);
}