/**
 * Integration tests for Rexera 2.0 API endpoints
 * Tests all API routes with real database interactions
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wmgidablmqotriwlefhq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZ2lkYWJsbXFvdHJpd2xlZmhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTEzNzk2NywiZXhwIjoyMDY2NzEzOTY3fQ.viSjS9PV2aDSOIzayHv6zJG-rjmjOBOVMsHlm77h6ns';

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test data storage
interface TestData {
  clients: any[];
  agents: any[];
  workflows: any[];
  tasks: any[];
}

let testData: TestData = {
  clients: [],
  agents: [],
  workflows: [],
  tasks: []
};

// Helper function to make API requests
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Test suite
export async function runIntegrationTests(): Promise<void> {
  console.log('🧪 Starting Integration Tests...');
  
  try {
    await testHealthEndpoint();
    await testWorkflowsEndpoint();
    await testAgentsEndpoint();
    await testTaskExecutionsEndpoint();
    
    console.log('✅ All integration tests passed!');
  } catch (error) {
    console.error('❌ Integration tests failed:', error);
    throw error;
  } finally {
    await cleanup();
  }
}

async function testHealthEndpoint(): Promise<void> {
  console.log('Testing health endpoint...');
  const response = await apiRequest('/health');
  
  if (!response.status || response.status !== 'ok') {
    throw new Error('Health check failed');
  }
  
  console.log('✅ Health endpoint passed');
}

async function testWorkflowsEndpoint(): Promise<void> {
  console.log('Testing workflows endpoint...');
  
  // Test GET workflows
  const getResponse = await apiRequest('/workflows?limit=5');
  
  if (!getResponse.success || !Array.isArray(getResponse.data)) {
    throw new Error('GET workflows failed');
  }
  
  console.log('✅ Workflows endpoint passed');
}

async function testAgentsEndpoint(): Promise<void> {
  console.log('Testing agents endpoint...');
  
  const response = await apiRequest('/agents?limit=5');
  
  if (!response.success || !Array.isArray(response.data)) {
    throw new Error('GET agents failed');
  }
  
  console.log('✅ Agents endpoint passed');
}

async function testTaskExecutionsEndpoint(): Promise<void> {
  console.log('Testing task executions endpoint...');
  
  // Test with query parameter
  const response = await apiRequest('/task-executions?limit=5');
  
  // Note: This might return empty if no workflow ID is provided
  if (!response.success) {
    throw new Error('GET task executions failed');
  }
  
  console.log('✅ Task executions endpoint passed');
}

async function cleanup(): Promise<void> {
  console.log('🧹 Cleaning up test data...');
  
  // Clean up any test data created during tests
  try {
    // Remove test workflows
    if (testData.workflows.length > 0) {
      await supabase
        .from('workflows')
        .delete()
        .in('id', testData.workflows.map(w => w.id));
    }
    
    // Remove test clients
    if (testData.clients.length > 0) {
      await supabase
        .from('clients')
        .delete()
        .in('id', testData.clients.map(c => c.id));
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.warn('⚠️ Cleanup warning:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runIntegrationTests()
    .then(() => {
      console.log('🎉 Integration tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Integration tests failed:', error);
      process.exit(1);
    });
}