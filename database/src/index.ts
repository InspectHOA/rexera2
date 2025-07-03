/**
 * Database utilities and client for Rexera 2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from './generated/database.types';

// Environment configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required');
}

// Service role client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Anonymous client for client-side operations (enforces RLS)
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

// Database table type helpers
export type Tables = Database['public']['Tables'];
export type WorkflowRow = Tables['workflows']['Row'];
export type WorkflowInsert = Tables['workflows']['Insert'];
export type WorkflowUpdate = Tables['workflows']['Update'];
export type TaskRow = Tables['tasks']['Row'];
export type TaskInsert = Tables['tasks']['Insert'];
export type TaskUpdate = Tables['tasks']['Update'];
export type CommunicationRow = Tables['communications']['Row'];
export type CommunicationInsert = Tables['communications']['Insert'];
export type CommunicationUpdate = Tables['communications']['Update'];
export type DocumentRow = Tables['documents']['Row'];
export type DocumentInsert = Tables['documents']['Insert'];
export type DocumentUpdate = Tables['documents']['Update'];
export type CounterpartyRow = Tables['counterparties']['Row'];
export type CounterpartyInsert = Tables['counterparties']['Insert'];
export type CounterpartyUpdate = Tables['counterparties']['Update'];
export type AgentRow = Tables['agents']['Row'];
export type AgentExecutionRow = Tables['agent_executions']['Row'];
export type AgentExecutionInsert = Tables['agent_executions']['Insert'];

// Utility functions
export class DatabaseError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function handleSupabaseError(error: any): never {
  throw new DatabaseError(
    error.message || 'Database operation failed',
    error.code,
    error.details
  );
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
}

// Query builders
export class WorkflowQueryBuilder {
  private query = supabase.from('workflows').select('*');
  
  withClient(clientId: string) {
    this.query = this.query.eq('client_id', clientId);
    return this;
  }
  
  withStatus(status: string) {
    this.query = this.query.eq('status', status);
    return this;
  }
  
  withType(workflowType: string) {
    this.query = this.query.eq('workflow_type', workflowType);
    return this;
  }
  
  withAssignedTo(userId: string) {
    this.query = this.query.eq('assigned_to', userId);
    return this;
  }
  
  createdAfter(date: string) {
    this.query = this.query.gte('created_at', date);
    return this;
  }
  
  createdBefore(date: string) {
    this.query = this.query.lte('created_at', date);
    return this;
  }
  
  orderBy(column: string, ascending: boolean = true) {
    this.query = this.query.order(column, { ascending });
    return this;
  }
  
  limit(count: number) {
    this.query = this.query.limit(count);
    return this;
  }
  
  offset(count: number) {
    this.query = this.query.range(count, count + 1000); // Supabase uses range instead of offset
    return this;
  }
  
  async execute() {
    const { data, error } = await this.query;
    if (error) {
      handleSupabaseError(error);
    }
    return data;
  }
  
  async single() {
    const { data, error } = await this.query.single();
    if (error) {
      handleSupabaseError(error);
    }
    return data;
  }
  
  async maybeSingle() {
    const { data, error } = await this.query.maybeSingle();
    if (error) {
      handleSupabaseError(error);
    }
    return data;
  }
}

export class TaskQueryBuilder {
  private query = supabase.from('tasks').select('*');
  
  withWorkflow(workflowId: string) {
    this.query = this.query.eq('workflow_id', workflowId);
    return this;
  }
  
  withStatus(status: string) {
    this.query = this.query.eq('status', status);
    return this;
  }
  
  withExecutorType(executorType: string) {
    this.query = this.query.eq('executor_type', executorType);
    return this;
  }
  
  withAssignedTo(userId: string) {
    this.query = this.query.eq('assigned_to', userId);
    return this;
  }
  
  dueBefore(date: string) {
    this.query = this.query.lte('due_date', date);
    return this;
  }
  
  orderBy(column: string, ascending: boolean = true) {
    this.query = this.query.order(column, { ascending });
    return this;
  }
  
  limit(count: number) {
    this.query = this.query.limit(count);
    return this;
  }
  
  async execute() {
    const { data, error } = await this.query;
    if (error) {
      handleSupabaseError(error);
    }
    return data;
  }
}

// Repository pattern implementations
export class WorkflowRepository {
  async create(workflow: WorkflowInsert): Promise<WorkflowRow> {
    const { data, error } = await supabase
      .from('workflows')
      .insert(workflow)
      .select()
      .single();
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data;
  }
  
  async findById(id: string): Promise<WorkflowRow | null> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data;
  }
  
  async update(id: string, updates: WorkflowUpdate): Promise<WorkflowRow> {
    const { data, error } = await supabase
      .from('workflows')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data;
  }
  
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);
    
    if (error) {
      handleSupabaseError(error);
    }
  }
  
  query(): WorkflowQueryBuilder {
    return new WorkflowQueryBuilder();
  }
}

export class TaskRepository {
  async create(task: TaskInsert): Promise<TaskRow> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data;
  }
  
  async findById(id: string): Promise<TaskRow | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data;
  }
  
  async update(id: string, updates: TaskUpdate): Promise<TaskRow> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data;
  }
  
  async findByWorkflow(workflowId: string): Promise<TaskRow[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: true });
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data || [];
  }
  
  query(): TaskQueryBuilder {
    return new TaskQueryBuilder();
  }
}

export class CommunicationRepository {
  async create(communication: CommunicationInsert): Promise<CommunicationRow> {
    const { data, error } = await supabase
      .from('communications')
      .insert(communication)
      .select()
      .single();
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data;
  }
  
  async findByWorkflow(workflowId: string): Promise<CommunicationRow[]> {
    const { data, error } = await supabase
      .from('communications')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false });
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data || [];
  }
  
  async findByThread(threadId: string): Promise<CommunicationRow[]> {
    const { data, error } = await supabase
      .from('communications')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data || [];
  }
}

export class DocumentRepository {
  async create(document: DocumentInsert): Promise<DocumentRow> {
    const { data, error } = await supabase
      .from('documents')
      .insert(document)
      .select()
      .single();
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data;
  }
  
  async findByWorkflow(workflowId: string): Promise<DocumentRow[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false });
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data || [];
  }
  
  async findByType(documentType: string): Promise<DocumentRow[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('document_type', documentType)
      .order('created_at', { ascending: false });
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data || [];
  }
}

export class AgentRepository {
  async findAll(): Promise<AgentRow[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data || [];
  }
  
  async findByType(type: string): Promise<AgentRow | null> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data;
  }
  
  async createExecution(execution: AgentExecutionInsert): Promise<AgentExecutionRow> {
    const { data, error } = await supabase
      .from('agent_executions')
      .insert(execution)
      .select()
      .single();
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data;
  }
}

// Export repository instances
export const workflowRepository = new WorkflowRepository();
export const taskRepository = new TaskRepository();
export const communicationRepository = new CommunicationRepository();
export const documentRepository = new DocumentRepository();
export const agentRepository = new AgentRepository();

// Health check function
export async function healthCheck(): Promise<{ status: 'healthy' | 'unhealthy', details: any }> {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
    
    return {
      status: 'healthy',
      details: { agents_count: data?.[0]?.count || 0 }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: { error: (error as Error).message }
    };
  }
}