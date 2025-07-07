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
      // Add other essential tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      // Add essential functions as needed
    }
    Enums: {
      task_status: "PENDING" | "AWAITING_REVIEW" | "COMPLETED" | "FAILED"
      workflow_status: "PENDING" | "IN_PROGRESS" | "AWAITING_REVIEW" | "BLOCKED" | "COMPLETED"
      workflow_type: "MUNI_LIEN_SEARCH" | "HOA_ACQUISITION" | "PAYOFF"
      priority_level: "LOW" | "NORMAL" | "HIGH" | "URGENT"
      executor_type: "AI" | "HIL"
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