/**
 * Database setup utilities for integration tests
 * Uses real Supabase database with proper cleanup
 */

import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables for testing');
}

export const testDb = createClient(supabaseUrl, supabaseKey);

/**
 * Test data cleanup utility
 * Removes test data created during integration tests
 */
export class TestDataManager {
  private createdCounterpartyIds: string[] = [];
  private createdWorkflowIds: string[] = [];
  private createdUserIds: string[] = [];
  private createdClientIds: string[] = [];

  /**
   * Track created counterparty for cleanup
   */
  trackCounterparty(id: string) {
    this.createdCounterpartyIds.push(id);
  }

  /**
   * Track created workflow for cleanup
   */
  trackWorkflow(id: string) {
    this.createdWorkflowIds.push(id);
  }

  /**
   * Track created user for cleanup
   */
  trackUser(id: string) {
    this.createdUserIds.push(id);
  }

  /**
   * Track created client for cleanup
   */
  trackClient(id: string) {
    this.createdClientIds.push(id);
  }

  /**
   * Clean up all tracked test data
   */
  async cleanup() {
    try {
      // Clean up workflow-counterparty relationships first (foreign key constraints)
      if (this.createdWorkflowIds.length > 0 || this.createdCounterpartyIds.length > 0) {
        const conditions = [];
        if (this.createdWorkflowIds.length > 0) {
          conditions.push(`workflow_id.in.(${this.createdWorkflowIds.join(',')})`);
        }
        if (this.createdCounterpartyIds.length > 0) {
          conditions.push(`counterparty_id.in.(${this.createdCounterpartyIds.join(',')})`);
        }
        
        if (conditions.length > 0) {
          await testDb.from('workflow_counterparties').delete().or(conditions.join(','));
        }
      }

      // Clean up counterparties
      if (this.createdCounterpartyIds.length > 0) {
        await testDb
          .from('counterparties')
          .delete()
          .in('id', this.createdCounterpartyIds);
      }

      // Clean up workflows
      if (this.createdWorkflowIds.length > 0) {
        await testDb
          .from('workflows')
          .delete()
          .in('id', this.createdWorkflowIds);
      }

      // Clean up clients
      if (this.createdClientIds.length > 0) {
        await testDb
          .from('clients')
          .delete()
          .in('id', this.createdClientIds);
      }

      // Clean up users (be careful with this in shared test environment)
      if (this.createdUserIds.length > 0) {
        await testDb
          .from('user_profiles')
          .delete()
          .in('id', this.createdUserIds);
      }

      // Reset tracking arrays
      this.createdCounterpartyIds = [];
      this.createdWorkflowIds = [];
      this.createdUserIds = [];
      this.createdClientIds = [];

    } catch (error) {
      console.error('Error during test cleanup:', error);
      // Don't throw to avoid masking test failures
    }
  }

  /**
   * Create a test user for authentication
   */
  async createTestUser(userData?: Partial<any>) {
    const defaultUser = {
      id: randomUUID(),
      email: `test-${Date.now()}@example.com`,
      full_name: 'Test User',
      role: 'user',
      user_type: 'hil_user'
    };

    const user = { ...defaultUser, ...userData };

    const { data, error } = await testDb
      .from('user_profiles')
      .insert([user])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }

    this.trackUser(data.id);
    return data;
  }

  /**
   * Create a test client
   */
  async createTestClient(clientData?: Partial<any>) {
    const defaultClient = {
      id: randomUUID(),
      name: `Test Client ${Date.now()}`,
      email: `client-${Date.now()}@example.com`,
      phone: '555-0000',
      type: 'individual'
    };

    const client = { ...defaultClient, ...clientData };

    const { data, error } = await testDb
      .from('clients')
      .insert([client])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test client: ${error.message}`);
    }

    this.trackClient(data.id);
    return data;
  }

  /**
   * Create a test workflow
   */
  async createTestWorkflow(workflowData?: Partial<any>) {
    // Ensure we have a client for the workflow
    const client = await this.createTestClient();
    const user = await this.createTestUser();

    const defaultWorkflow = {
      id: randomUUID(),
      title: `Test Workflow ${Date.now()}`,
      workflow_type: 'HOA_ACQUISITION',
      client_id: client.id,
      created_by: user.id,
      status: 'NOT_STARTED',
      priority: 'NORMAL',
      metadata: {}
    };

    const workflow = { ...defaultWorkflow, ...workflowData };

    const { data, error } = await testDb
      .from('workflows')
      .insert([workflow])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test workflow: ${error.message}`);
    }

    this.trackWorkflow(data.id);
    return data;
  }

  /**
   * Create a test counterparty
   */
  async createTestCounterparty(counterpartyData?: Partial<any>) {
    const defaultCounterparty = {
      id: randomUUID(),
      name: `Test Counterparty ${Date.now()}`,
      type: 'hoa',
      email: `counterparty-${Date.now()}@example.com`
    };

    const counterparty = { ...defaultCounterparty, ...counterpartyData };

    const { data, error } = await testDb
      .from('counterparties')
      .insert([counterparty])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test counterparty: ${error.message}`);
    }

    this.trackCounterparty(data.id);
    return data;
  }

  /**
   * Create a workflow-counterparty relationship
   */
  async createWorkflowCounterpartyRelationship(workflowId: string, counterpartyId: string, status = 'PENDING') {
    const relationshipData = {
      id: randomUUID(),
      workflow_id: workflowId,
      counterparty_id: counterpartyId,
      status
    };

    const { data, error } = await testDb
      .from('workflow_counterparties')
      .insert([relationshipData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create workflow-counterparty relationship: ${error.message}`);
    }

    return data;
  }
}

/**
 * Global test data manager instance
 */
export const testDataManager = new TestDataManager();

/**
 * Setup function to run before each test
 */
export async function setupTest() {
  // Any pre-test setup can go here
}

/**
 * Cleanup function to run after each test
 */
export async function cleanupTest() {
  await testDataManager.cleanup();
}

/**
 * Check if we can connect to the test database
 */
export async function checkDatabaseConnection() {
  try {
    // Use a simple query that should work with any database setup
    const { data, error } = await testDb.from('workflows').select('id').limit(1);
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}