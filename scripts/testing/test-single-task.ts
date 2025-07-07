#!/usr/bin/env tsx
/**
 * Script Name: Single Task Test
 * Purpose: Test single task creation via API endpoint
 * Usage: tsx scripts/testing/test-single-task.ts
 * Requirements: Local API server running on port 3001
 */

interface TaskData {
  workflow_id: string;
  agent_id: string;
  title: string;
  description: string;
  sequence_order: number;
  task_type: string;
  status: string;
  executor_type: string;
  priority: string;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  retry_count: number;
}

interface ApiResponse {
  success: boolean;
  data?: {
    title: string;
    [key: string]: any;
  };
  error?: string;
}

const WORKFLOW_ID = 'b5bdf081-8e92-4fca-9ffc-eb812a7450ad'; // PAY-250706-001
const NINA_ID = '498a6bcc-98c0-43f1-825e-a7d9cd97574f';

const singleTask: TaskData = {
  workflow_id: WORKFLOW_ID,
  agent_id: NINA_ID,
  title: 'Test Document Analysis',
  description: 'Test task to verify API is working',
  sequence_order: 4,
  task_type: 'document_analysis',
  status: 'COMPLETED',
  executor_type: 'AI',
  priority: 'NORMAL',
  input_data: { document_type: 'loan_agreement' },
  output_data: { payoff_terms: 'standard', confidence: 0.92 },
  retry_count: 0
};

async function testSingleTask(): Promise<void> {
  try {
    console.log('Testing single task creation...');
    
    const response = await fetch('http://localhost:3001/api/task-executions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(singleTask)
    });

    console.log('Response status:', response.status);
    
    const text = await response.text();
    console.log('Response text:', text);
    
    try {
      const result = JSON.parse(text) as ApiResponse;
      if (result.success && result.data) {
        console.log('✅ Successfully created task:', result.data.title);
      } else {
        console.error('❌ Failed to create task:', result.error);
      }
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
      console.error('❌ Could not parse response as JSON:', errorMessage);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
    console.error('❌ Network error:', errorMessage);
  }
}

// Run script if called directly
if (require.main === module) {
  testSingleTask();
}