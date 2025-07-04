/**
 * Supabase Database Types
 * Generated types for Supabase database schema
 */

import type {
  WorkflowType,
  WorkflowStatus,
  TaskStatus,
  PriorityLevel,
  ExecutorType,
  UserType,
  EmailDirection,
  EmailStatus,
  CounterpartyType,
  InvoiceStatus,
  NotificationType,
  SenderType,
  AlertLevel,
  Workflow,
  Task,
  Client,
  UserProfile,
  Agent,
  Communication,
  Document,
  Counterparty
} from './database';

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Client, 'id'>>;
      };
      workflows: {
        Row: Workflow;
        Insert: Omit<Workflow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Workflow, 'id'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Task, 'id'>>;
      };
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserProfile, 'id'>>;
      };
      agents: {
        Row: Agent;
        Insert: Omit<Agent, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Agent, 'id'>>;
      };
      communications: {
        Row: Communication;
        Insert: Omit<Communication, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Communication, 'id'>>;
      };
      documents: {
        Row: Document;
        Insert: Omit<Document, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Document, 'id'>>;
      };
      counterparties: {
        Row: Counterparty;
        Insert: Omit<Counterparty, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Counterparty, 'id'>>;
      };
    };
    Enums: {
      workflow_type: WorkflowType;
      workflow_status: WorkflowStatus;
      task_status: TaskStatus;
      priority_level: PriorityLevel;
      executor_type: ExecutorType;
      user_type: UserType;
      email_direction: EmailDirection;
      email_status: EmailStatus;
      counterparty_type: CounterpartyType;
      invoice_status: InvoiceStatus;
      notification_type: NotificationType;
      sender_type: SenderType;
      alert_level: AlertLevel;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}