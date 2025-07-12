/**
 * Test Utilities and Helpers
 * Centralized utilities for API testing with proper cleanup
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createServer, Server } from 'http';
import express from 'express';
import cors from 'cors';

export interface TestClient {
  id: string;
  name: string;
  domain: string;
}

export interface TestAgent {
  id: string;
  name: string;
  type: string;
}

export interface TestWorkflow {
  id: string;
  title: string;
  workflow_type: string;
  client_id: string;
  status: string;
}

export interface TestTaskExecution {
  id: string;
  workflow_id: string;
  title: string;
  status: string;
}

export interface TestDataSet {
  clients: TestClient[];
  agents: TestAgent[];
  workflows: TestWorkflow[];
  taskExecutions: TestTaskExecution[];
}

export class APITestHelper {
  private supabase: SupabaseClient;
  private server: Server | null = null;
  private testDataIds: string[] = [];
  
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Start test server for integration testing
   * Note: This creates a simple test server since the main API is now Hono-based
   */
  async startTestServer(port: number = 3002): Promise<string> {
    if (this.server) {
      throw new Error('Test server is already running');
    }

    const app = express();
    
    // CORS configuration
    app.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:3001', `http://localhost:${port}`],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey'],
      credentials: true
    }));

    app.use(express.json());

    // Simple health check endpoint for testing
    app.get('/api/health', (req, res) => {
      res.json({ 
        success: true,
        message: 'Test API server is running',
        timestamp: new Date().toISOString(),
        environment: 'test'
      });
    });

    // Placeholder endpoints for testing - these would normally call Supabase directly
    app.get('/api/workflows', (req, res) => {
      res.json({ 
        success: true, 
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      });
    });

    app.get('/api/agents', (req, res) => {
      res.json({ 
        success: true, 
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      });
    });

    return new Promise((resolve, reject) => {
      this.server = app.listen(port, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve(`http://localhost:${port}`);
        }
      });
    });
  }

  /**
   * Stop test server
   */
  async stopTestServer(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          this.server = null;
          resolve();
        });
      });
    }
  }

  /**
   * Create comprehensive test data set
   */
  async createTestDataSet(): Promise<TestDataSet> {
    const timestamp = Date.now();
    
    // Create test clients
    const clients = await this.createTestClients(timestamp);
    
    // Create test agents  
    const agents = await this.createTestAgents(timestamp);
    
    // Create test workflows (without created_by to avoid user dependency)
    const workflows = await this.createTestWorkflows(timestamp, clients);
    
    // Create test task executions
    const taskExecutions = await this.createTestTaskExecutions(timestamp, workflows, agents);

    return {
      clients,
      agents,
      workflows,
      taskExecutions
    };
  }

  /**
   * Create test clients
   */
  private async createTestClients(timestamp: number): Promise<TestClient[]> {
    const clientsData = [
      {
        name: `Test Client Alpha ${timestamp}`,
        domain: `alpha-${timestamp}.test.com`
      },
      {
        name: `Test Client Beta ${timestamp}`,
        domain: `beta-${timestamp}.test.com`
      }
    ];

    const { data: clients, error } = await this.supabase
      .from('clients')
      .insert(clientsData)
      .select();

    if (error) {
      throw new Error(`Failed to create test clients: ${error.message}`);
    }

    this.testDataIds.push(...clients.map(c => c.id));
    return clients;
  }

  /**
   * Create test agents
   */
  private async createTestAgents(timestamp: number): Promise<TestAgent[]> {
    const agentsData = [
      {
        name: `Test Agent Nina ${timestamp}`,
        type: 'PAYOFF_SPECIALIST',
        description: 'Test agent for payoff processing',
        is_active: true,
        capabilities: ['document_review', 'lender_communication'],
        configuration: { test: true, timestamp }
      },
      {
        name: `Test Agent Mia ${timestamp}`,
        type: 'COMMUNICATION_SPECIALIST',
        description: 'Test agent for communication',
        is_active: true,
        capabilities: ['email_composition', 'client_communication'],
        configuration: { test: true, timestamp }
      }
    ];

    const { data: agents, error } = await this.supabase
      .from('agents')
      .insert(agentsData)
      .select();

    if (error) {
      throw new Error(`Failed to create test agents: ${error.message}`);
    }

    this.testDataIds.push(...agents.map(a => a.id));
    return agents;
  }

  /**
   * Create test workflows
   */
  private async createTestWorkflows(timestamp: number, clients: TestClient[]): Promise<TestWorkflow[]> {
    // Use the real test user from auth.users
    const testUserId = '82a7d984-485b-4a47-ac28-615a1b448473';
    
    const workflowsData = [
      {
        workflow_type: 'MUNI_LIEN_SEARCH',
        client_id: clients[0].id,
        title: `Test Municipal Lien Search ${timestamp}`,
        description: 'Test municipal lien search for automated testing',
        status: 'IN_PROGRESS',
        priority: 'NORMAL',
        metadata: { test: true, timestamp, property_address: `123 Test St ${timestamp}`, parcel_id: `TEST-${timestamp}` },
        created_by: testUserId,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        workflow_type: 'HOA_ACQUISITION',
        client_id: clients[1].id,
        title: `Test HOA Acquisition ${timestamp}`,
        description: 'Test HOA acquisition for automated testing',
        status: 'PENDING',
        priority: 'HIGH',
        metadata: { test: true, timestamp, hoa_name: `Test HOA ${timestamp}`, unit_number: `Unit ${timestamp}` },
        created_by: testUserId,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        workflow_type: 'PAYOFF_REQUEST',
        client_id: clients[0].id,
        title: `Test Payoff Request ${timestamp}`,
        description: 'Test payoff request for automated testing',
        status: 'AWAITING_REVIEW',
        priority: 'HIGH',
        metadata: { test: true, timestamp, loan_number: `TEST-${timestamp}`, lender_name: 'Test Bank', estimated_balance: 250000 },
        created_by: testUserId,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: workflows, error } = await this.supabase
      .from('workflows')
      .insert(workflowsData)
      .select();

    if (error) {
      throw new Error(`Failed to create test workflows: ${error.message}`);
    }

    this.testDataIds.push(...workflows.map(w => w.id));
    return workflows;
  }

  /**
   * Create test task executions
   */
  private async createTestTaskExecutions(
    timestamp: number, 
    workflows: TestWorkflow[], 
    agents: TestAgent[]
  ): Promise<TestTaskExecution[]> {
    const tasksData = [
      {
        workflow_id: workflows[0].id,
        agent_id: agents[0].id,
        title: `Test Task Completed ${timestamp}`,
        description: 'Test completed task for automated testing',
        sequence_order: 1,
        task_type: 'DOCUMENT_REVIEW',
        status: 'COMPLETED',
        executor_type: 'AI',
        priority: 'NORMAL',
        input_data: { test: true, timestamp },
        output_data: { result: 'success', confidence: 0.95 },
        started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        execution_time_ms: 3600000
      },
      {
        workflow_id: workflows[1].id,
        agent_id: agents[1].id,
        title: `Test Task Pending ${timestamp}`,
        description: 'Test pending task for automated testing',
        sequence_order: 1,
        task_type: 'COMMUNICATION',
        status: 'AWAITING_REVIEW',
        interrupt_type: 'MANUAL_VERIFICATION',
        executor_type: 'HIL',
        priority: 'HIGH',
        input_data: { test: true, timestamp },
        started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ];

    const { data: tasks, error } = await this.supabase
      .from('task_executions')
      .insert(tasksData)
      .select();

    if (error) {
      throw new Error(`Failed to create test task executions: ${error.message}`);
    }

    this.testDataIds.push(...tasks.map(t => t.id));
    return tasks;
  }

  /**
   * Clean up all test data
   */
  async cleanupTestData(): Promise<void> {
    const tables = ['task_executions', 'workflows', 'agents', 'clients'];
    
    for (const table of tables) {
      const { error } = await this.supabase
        .from(table)
        .delete()
        .in('id', this.testDataIds);
      
      if (error) {
        console.warn(`Warning: Failed to cleanup ${table}:`, error.message);
      }
    }
    
    this.testDataIds = [];
  }

  /**
   * Generate random test data
   */
  generateRandomData() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    
    return {
      email: `test-${random}@test.com`,
      name: `Test User ${random}`,
      domain: `${random}.test.com`,
      title: `Test Item ${random}`,
      description: `Test description created at ${timestamp}`,
      timestamp,
      random
    };
  }

  /**
   * Wait for async operations
   */
  async waitFor(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry operation with backoff
   */
  async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let attempt = 1;
    
    while (attempt <= maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        
        await this.waitFor(delay * attempt);
        attempt++;
      }
    }
    
    throw new Error('Should not reach here');
  }
}

// Export singleton instance
export const testHelper = new APITestHelper();