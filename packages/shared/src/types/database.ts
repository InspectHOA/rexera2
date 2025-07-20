/**
 * Supabase Database Types for Rexera 2.0
 * Auto-generated types from Supabase schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      task_executions: {
        Row: {
          id: string
          workflow_id: string
          agent_id: string | null
          title: string
          description: string | null
          sequence_order: number
          task_type: string
          status: Database["public"]["Enums"]["task_status"]
          interrupt_type: string | null
          executor_type: Database["public"]["Enums"]["executor_type"]
          priority: Database["public"]["Enums"]["priority_level"]
          input_data: Json
          output_data: Json | null
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          execution_time_ms: number | null
          retry_count: number
          created_at: string
          // Simple SLA tracking fields
          sla_hours: number
          sla_due_at: string | null
          sla_status: 'ON_TIME' | 'AT_RISK' | 'BREACHED'
          // Notification read tracking
          read_by_users: Json
        }
        Insert: {
          id?: string
          workflow_id: string
          agent_id?: string | null
          title: string
          description?: string | null
          sequence_order: number
          task_type: string
          status?: Database["public"]["Enums"]["task_status"]
          interrupt_type?: string | null
          executor_type: Database["public"]["Enums"]["executor_type"]
          priority?: Database["public"]["Enums"]["priority_level"]
          input_data?: Json
          output_data?: Json | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          execution_time_ms?: number | null
          retry_count?: number
          created_at?: string
          // Simple SLA tracking fields
          sla_hours?: number
          sla_due_at?: string | null
          sla_status?: 'ON_TIME' | 'AT_RISK' | 'BREACHED'
          // Notification read tracking
          read_by_users?: Json
        }
        Update: {
          id?: string
          workflow_id?: string
          agent_id?: string | null
          title?: string
          description?: string | null
          sequence_order?: number
          task_type?: string
          status?: Database["public"]["Enums"]["task_status"]
          interrupt_type?: string | null
          executor_type?: Database["public"]["Enums"]["executor_type"]
          priority?: Database["public"]["Enums"]["priority_level"]
          input_data?: Json
          output_data?: Json | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          execution_time_ms?: number | null
          retry_count?: number
          created_at?: string
          // Simple SLA tracking fields
          sla_hours?: number
          sla_due_at?: string | null
          sla_status?: 'ON_TIME' | 'AT_RISK' | 'BREACHED'
          // Notification read tracking
          read_by_users?: Json
        }
        Relationships: []
      }
      workflows: {
        Row: {
          id: string
          workflow_type: Database["public"]["Enums"]["workflow_type"]
          client_id: string
          title: string
          description: string | null
          status: Database["public"]["Enums"]["workflow_status"]
          priority: Database["public"]["Enums"]["priority_level"]
          metadata: Json
          created_by: string
          assigned_to: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
          due_date: string | null
          n8n_execution_id: string | null
        }
        Insert: {
          id?: string
          workflow_type: Database["public"]["Enums"]["workflow_type"]
          client_id: string
          title: string
          description?: string | null
          status?: Database["public"]["Enums"]["workflow_status"]
          priority?: Database["public"]["Enums"]["priority_level"]
          metadata?: Json
          created_by: string
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          due_date?: string | null
          n8n_execution_id?: string | null
        }
        Update: {
          id?: string
          workflow_type?: Database["public"]["Enums"]["workflow_type"]
          client_id?: string
          title?: string
          description?: string | null
          status?: Database["public"]["Enums"]["workflow_status"]
          priority?: Database["public"]["Enums"]["priority_level"]
          metadata?: Json
          created_by?: string
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          due_date?: string | null
          n8n_execution_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          workflow_id: string
          filename: string
          url: string
          file_size_bytes: number | null
          mime_type: string | null
          document_type: string
          tags: string[]
          upload_source: string | null
          status: string | null
          metadata: Json
          deliverable_data: Json
          version: number
          change_summary: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workflow_id: string
          filename: string
          url: string
          file_size_bytes?: number | null
          mime_type?: string | null
          document_type?: string
          tags?: string[]
          upload_source?: string | null
          status?: string | null
          metadata?: Json
          deliverable_data?: Json
          version?: number
          change_summary?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workflow_id?: string
          filename?: string
          url?: string
          file_size_bytes?: number | null
          mime_type?: string | null
          document_type?: string
          tags?: string[]
          upload_source?: string | null
          status?: string | null
          metadata?: Json
          deliverable_data?: Json
          version?: number
          change_summary?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          user_type: Database["public"]["Enums"]["user_type"]
          email: string
          full_name: string | null
          role: string
          company_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          user_type: Database["public"]["Enums"]["user_type"]
          email: string
          full_name?: string | null
          role: string
          company_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          email?: string
          full_name?: string | null
          role?: string
          company_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hil_notifications: {
        Row: {
          id: string
          user_id: string
          type: Database["public"]["Enums"]["notification_type"]
          priority: Database["public"]["Enums"]["priority_level"]
          title: string
          message: string
          action_url: string | null
          metadata: Json | null
          read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: Database["public"]["Enums"]["notification_type"]
          priority: Database["public"]["Enums"]["priority_level"]
          title: string
          message: string
          action_url?: string | null
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: Database["public"]["Enums"]["notification_type"]
          priority?: Database["public"]["Enums"]["priority_level"]
          title?: string
          message?: string
          action_url?: string | null
          metadata?: Json | null
          read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      // Add other essential tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      // Add essential functions as needed
    }
    Enums: {
      task_status: "NOT_STARTED" | "IN_PROGRESS" | "INTERRUPT" | "COMPLETED" | "FAILED"
      workflow_status: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "WAITING_FOR_CLIENT" | "COMPLETED"
      workflow_type: "MUNI_LIEN_SEARCH" | "HOA_ACQUISITION" | "PAYOFF_REQUEST"
      priority_level: "LOW" | "NORMAL" | "HIGH" | "URGENT"
      executor_type: "AI" | "HIL"
      user_type: "client_user" | "hil_user"
      notification_type: "WORKFLOW_UPDATE" | "TASK_INTERRUPT" | "HIL_MENTION" | "CLIENT_MESSAGE_RECEIVED" | "COUNTERPARTY_MESSAGE_RECEIVED" | "SLA_WARNING" | "AGENT_FAILURE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for table access
type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Update"]
export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]