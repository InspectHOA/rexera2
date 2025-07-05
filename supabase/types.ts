export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_executions: {
        Row: {
          agent_id: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_data: Json
          output_data: Json | null
          retry_count: number
          started_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_id: string
        }
        Insert: {
          agent_id: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json
          output_data?: Json | null
          retry_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_id: string
        }
        Update: {
          agent_id?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json
          output_data?: Json | null
          retry_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_executions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_executions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_performance_metrics: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          measurement_date: string
          metric_type: string
          metric_value: number
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          measurement_date?: string
          metric_type: string
          metric_value: number
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          measurement_date?: string
          metric_type?: string
          metric_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_performance_metrics_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          api_endpoint: string | null
          capabilities: string[]
          configuration: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          capabilities?: string[]
          configuration?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          capabilities?: string[]
          configuration?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string
          actor_name: string | null
          actor_type: string
          client_id: string | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          resource_id: string
          resource_type: string
          workflow_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          actor_name?: string | null
          actor_type: string
          client_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          resource_id: string
          resource_type: string
          workflow_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          actor_name?: string | null
          actor_type?: string
          client_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          resource_id?: string
          resource_type?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      communications: {
        Row: {
          body: string | null
          communication_type: string
          created_at: string
          direction: Database["public"]["Enums"]["email_direction"] | null
          id: string
          metadata: Json
          recipient_email: string | null
          sender_id: string | null
          status: Database["public"]["Enums"]["email_status"] | null
          subject: string | null
          task_id: string | null
          thread_id: string | null
          updated_at: string
          workflow_id: string | null
        }
        Insert: {
          body?: string | null
          communication_type: string
          created_at?: string
          direction?: Database["public"]["Enums"]["email_direction"] | null
          id?: string
          metadata?: Json
          recipient_email?: string | null
          sender_id?: string | null
          status?: Database["public"]["Enums"]["email_status"] | null
          subject?: string | null
          task_id?: string | null
          thread_id?: string | null
          updated_at?: string
          workflow_id?: string | null
        }
        Update: {
          body?: string | null
          communication_type?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["email_direction"] | null
          id?: string
          metadata?: Json
          recipient_email?: string | null
          sender_id?: string | null
          status?: Database["public"]["Enums"]["email_status"] | null
          subject?: string | null
          task_id?: string | null
          thread_id?: string | null
          updated_at?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_labels: {
        Row: {
          created_at: string
          default_notifications: Json | null
          description: string | null
          display_name: string
          is_required: boolean | null
          label: string
          workflow_types: string[] | null
        }
        Insert: {
          created_at?: string
          default_notifications?: Json | null
          description?: string | null
          display_name: string
          is_required?: boolean | null
          label: string
          workflow_types?: string[] | null
        }
        Update: {
          created_at?: string
          default_notifications?: Json | null
          description?: string | null
          display_name?: string
          is_required?: boolean | null
          label?: string
          workflow_types?: string[] | null
        }
        Relationships: []
      }
      costs: {
        Row: {
          amount: number
          cost_type: string
          created_at: string
          description: string
          id: string
          incurred_at: string
          task_id: string | null
          workflow_id: string
        }
        Insert: {
          amount: number
          cost_type: string
          created_at?: string
          description: string
          id?: string
          incurred_at?: string
          task_id?: string | null
          workflow_id: string
        }
        Update: {
          amount?: number
          cost_type?: string
          created_at?: string
          description?: string
          id?: string
          incurred_at?: string
          task_id?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "costs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      counterparties: {
        Row: {
          address: string | null
          contact_info: Json
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          type: Database["public"]["Enums"]["counterparty_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_info?: Json
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          type: Database["public"]["Enums"]["counterparty_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_info?: Json
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          type?: Database["public"]["Enums"]["counterparty_type"]
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          change_summary: string | null
          created_at: string
          created_by: string | null
          deliverable_data: Json | null
          document_type: string
          file_size_bytes: number | null
          filename: string
          id: string
          metadata: Json | null
          mime_type: string | null
          status: string | null
          storage_path: string | null
          tags: string[] | null
          task_id: string | null
          updated_at: string
          upload_source: string | null
          url: string
          version: number | null
          workflow_id: string
        }
        Insert: {
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          deliverable_data?: Json | null
          document_type?: string
          file_size_bytes?: number | null
          filename: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          status?: string | null
          storage_path?: string | null
          tags?: string[] | null
          task_id?: string | null
          updated_at?: string
          upload_source?: string | null
          url: string
          version?: number | null
          workflow_id: string
        }
        Update: {
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          deliverable_data?: Json | null
          document_type?: string
          file_size_bytes?: number | null
          filename?: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          status?: string | null
          storage_path?: string | null
          tags?: string[] | null
          task_id?: string | null
          updated_at?: string
          upload_source?: string | null
          url?: string
          version?: number | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      email_metadata: {
        Row: {
          attachments: Json | null
          communication_id: string
          created_at: string
          email_references: string[] | null
          headers: Json | null
          id: string
          in_reply_to: string | null
          message_id: string | null
        }
        Insert: {
          attachments?: Json | null
          communication_id: string
          created_at?: string
          email_references?: string[] | null
          headers?: Json | null
          id?: string
          in_reply_to?: string | null
          message_id?: string | null
        }
        Update: {
          attachments?: Json | null
          communication_id?: string
          created_at?: string
          email_references?: string[] | null
          headers?: Json | null
          id?: string
          in_reply_to?: string | null
          message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_metadata_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: true
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
        ]
      }
      hil_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_resolved: boolean
          mentions: string[] | null
          parent_note_id: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          updated_at: string
          workflow_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          mentions?: string[] | null
          parent_note_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          updated_at?: string
          workflow_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          mentions?: string[] | null
          parent_note_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hil_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hil_notes_parent_note_id_fkey"
            columns: ["parent_note_id"]
            isOneToOne: false
            referencedRelation: "hil_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hil_notes_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          id: string
          invoice_number: string
          status: Database["public"]["Enums"]["invoice_status"]
          total_amount: number
          updated_at: string
          workflow_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          invoice_number: string
          status?: Database["public"]["Enums"]["invoice_status"]
          total_amount?: number
          updated_at?: string
          workflow_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          invoice_number?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          total_amount?: number
          updated_at?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_metadata: {
        Row: {
          call_recording_url: string | null
          communication_id: string
          created_at: string
          duration_seconds: number | null
          id: string
          phone_number: string | null
          transcript: string | null
        }
        Insert: {
          call_recording_url?: string | null
          communication_id: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          phone_number?: string | null
          transcript?: string | null
        }
        Update: {
          call_recording_url?: string | null
          communication_id?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          phone_number?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_metadata_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: true
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_alerts: {
        Row: {
          alert_level: Database["public"]["Enums"]["alert_level"]
          created_at: string
          id: string
          message: string
          notified_users: string[]
          resolved_at: string | null
          sla_tracking_id: string
        }
        Insert: {
          alert_level: Database["public"]["Enums"]["alert_level"]
          created_at?: string
          id?: string
          message: string
          notified_users?: string[]
          resolved_at?: string | null
          sla_tracking_id: string
        }
        Update: {
          alert_level?: Database["public"]["Enums"]["alert_level"]
          created_at?: string
          id?: string
          message?: string
          notified_users?: string[]
          resolved_at?: string | null
          sla_tracking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sla_alerts_sla_tracking_id_fkey"
            columns: ["sla_tracking_id"]
            isOneToOne: false
            referencedRelation: "sla_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_definitions: {
        Row: {
          alert_hours_before: number[]
          client_id: string | null
          created_at: string
          hours_to_complete: number
          id: string
          is_business_hours_only: boolean
          task_type: string | null
          updated_at: string
          workflow_type: Database["public"]["Enums"]["workflow_type"]
        }
        Insert: {
          alert_hours_before?: number[]
          client_id?: string | null
          created_at?: string
          hours_to_complete: number
          id?: string
          is_business_hours_only?: boolean
          task_type?: string | null
          updated_at?: string
          workflow_type: Database["public"]["Enums"]["workflow_type"]
        }
        Update: {
          alert_hours_before?: number[]
          client_id?: string | null
          created_at?: string
          hours_to_complete?: number
          id?: string
          is_business_hours_only?: boolean
          task_type?: string | null
          updated_at?: string
          workflow_type?: Database["public"]["Enums"]["workflow_type"]
        }
        Relationships: [
          {
            foreignKeyName: "sla_definitions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_tracking: {
        Row: {
          alert_level: Database["public"]["Enums"]["alert_level"]
          completed_time: string | null
          created_at: string
          due_time: string
          id: string
          sla_definition_id: string
          start_time: string
          status: Database["public"]["Enums"]["sla_tracking_status"]
          task_id: string | null
          updated_at: string
          workflow_id: string | null
        }
        Insert: {
          alert_level?: Database["public"]["Enums"]["alert_level"]
          completed_time?: string | null
          created_at?: string
          due_time: string
          id?: string
          sla_definition_id: string
          start_time: string
          status?: Database["public"]["Enums"]["sla_tracking_status"]
          task_id?: string | null
          updated_at?: string
          workflow_id?: string | null
        }
        Update: {
          alert_level?: Database["public"]["Enums"]["alert_level"]
          completed_time?: string | null
          created_at?: string
          due_time?: string
          id?: string
          sla_definition_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["sla_tracking_status"]
          task_id?: string | null
          updated_at?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sla_tracking_sla_definition_id_fkey"
            columns: ["sla_definition_id"]
            isOneToOne: false
            referencedRelation: "sla_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_tracking_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_tracking_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          executor_type: Database["public"]["Enums"]["executor_type"]
          id: string
          metadata: Json
          priority: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          executor_type: Database["public"]["Enums"]["executor_type"]
          id?: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          executor_type?: Database["public"]["Enums"]["executor_type"]
          id?: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          language: string | null
          notification_settings: Json | null
          theme: string | null
          timezone: string | null
          ui_settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string | null
          notification_settings?: Json | null
          theme?: string | null
          timezone?: string | null
          ui_settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string | null
          notification_settings?: Json | null
          theme?: string | null
          timezone?: string | null
          ui_settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role: string
          updated_at?: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_contacts: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          label: string
          name: string
          notes: string | null
          notification_method: string | null
          notify_on_completion: boolean | null
          notify_on_documents: boolean | null
          notify_on_issues: boolean | null
          notify_on_status_change: boolean | null
          phone: string | null
          preferred_contact_time: string | null
          role: string | null
          timezone: string | null
          updated_at: string
          workflow_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          label: string
          name: string
          notes?: string | null
          notification_method?: string | null
          notify_on_completion?: boolean | null
          notify_on_documents?: boolean | null
          notify_on_issues?: boolean | null
          notify_on_status_change?: boolean | null
          phone?: string | null
          preferred_contact_time?: string | null
          role?: string | null
          timezone?: string | null
          updated_at?: string
          workflow_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string
          name?: string
          notes?: string | null
          notification_method?: string | null
          notify_on_completion?: boolean | null
          notify_on_documents?: boolean | null
          notify_on_issues?: boolean | null
          notify_on_status_change?: boolean | null
          phone?: string | null
          preferred_contact_time?: string | null
          role?: string | null
          timezone?: string | null
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_contacts_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_counterparties: {
        Row: {
          counterparty_id: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["workflow_counterparty_status"]
          updated_at: string
          workflow_id: string
        }
        Insert: {
          counterparty_id: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["workflow_counterparty_status"]
          updated_at?: string
          workflow_id: string
        }
        Update: {
          counterparty_id?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["workflow_counterparty_status"]
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_counterparties_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_counterparties_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          assigned_to: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          metadata: Json
          n8n_execution_id: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["workflow_status"]
          title: string
          updated_at: string
          workflow_type: Database["public"]["Enums"]["workflow_type"]
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id: string
          metadata?: Json
          n8n_execution_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["workflow_status"]
          title: string
          updated_at?: string
          workflow_type: Database["public"]["Enums"]["workflow_type"]
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json
          n8n_execution_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["workflow_status"]
          title?: string
          updated_at?: string
          workflow_type?: Database["public"]["Enums"]["workflow_type"]
        }
        Relationships: [
          {
            foreignKeyName: "workflows_new_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_new_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_new_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_workflow_id: {
        Args: {
          workflow_type_param: Database["public"]["Enums"]["workflow_type"]
        }
        Returns: string
      }
      get_document_url: {
        Args: { storage_path: string }
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      unaccent: {
        Args: { "": string }
        Returns: string
      }
      unaccent_init: {
        Args: { "": unknown }
        Returns: unknown
      }
    }
    Enums: {
      alert_level: "GREEN" | "YELLOW" | "ORANGE" | "RED"
      call_direction: "INBOUND" | "OUTBOUND"
      counterparty_type:
        | "hoa"
        | "lender"
        | "municipality"
        | "utility"
        | "tax_authority"
      email_direction: "INBOUND" | "OUTBOUND"
      email_status: "SENT" | "DELIVERED" | "READ" | "BOUNCED" | "FAILED"
      executor_type: "AI" | "HIL"
      invoice_status: "DRAFT" | "FINALIZED" | "PAID" | "VOID"
      notification_type:
        | "WORKFLOW_UPDATE"
        | "TASK_INTERRUPT"
        | "HIL_MENTION"
        | "CLIENT_MESSAGE_RECEIVED"
        | "COUNTERPARTY_MESSAGE_RECEIVED"
        | "SLA_WARNING"
        | "AGENT_FAILURE"
      priority_level: "LOW" | "NORMAL" | "HIGH" | "URGENT"
      sender_type: "CLIENT" | "INTERNAL"
      sla_status: "ON_TIME" | "AT_RISK" | "BREACHED"
      sla_tracking_status: "ACTIVE" | "COMPLETED" | "BREACHED" | "PAUSED"
      task_status: "PENDING" | "AWAITING_REVIEW" | "COMPLETED" | "FAILED"
      thread_status: "ACTIVE" | "RESOLVED" | "ARCHIVED"
      user_type: "client_user" | "hil_user"
      workflow_counterparty_status:
        | "PENDING"
        | "CONTACTED"
        | "RESPONDED"
        | "COMPLETED"
      workflow_status:
        | "PENDING"
        | "IN_PROGRESS"
        | "AWAITING_REVIEW"
        | "BLOCKED"
        | "COMPLETED"
      workflow_type: "MUNI_LIEN_SEARCH" | "HOA_ACQUISITION" | "PAYOFF"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_level: ["GREEN", "YELLOW", "ORANGE", "RED"],
      call_direction: ["INBOUND", "OUTBOUND"],
      counterparty_type: [
        "hoa",
        "lender",
        "municipality",
        "utility",
        "tax_authority",
      ],
      email_direction: ["INBOUND", "OUTBOUND"],
      email_status: ["SENT", "DELIVERED", "READ", "BOUNCED", "FAILED"],
      executor_type: ["AI", "HIL"],
      invoice_status: ["DRAFT", "FINALIZED", "PAID", "VOID"],
      notification_type: [
        "WORKFLOW_UPDATE",
        "TASK_INTERRUPT",
        "HIL_MENTION",
        "CLIENT_MESSAGE_RECEIVED",
        "COUNTERPARTY_MESSAGE_RECEIVED",
        "SLA_WARNING",
        "AGENT_FAILURE",
      ],
      priority_level: ["LOW", "NORMAL", "HIGH", "URGENT"],
      sender_type: ["CLIENT", "INTERNAL"],
      sla_status: ["ON_TIME", "AT_RISK", "BREACHED"],
      sla_tracking_status: ["ACTIVE", "COMPLETED", "BREACHED", "PAUSED"],
      task_status: ["PENDING", "AWAITING_REVIEW", "COMPLETED", "FAILED"],
      thread_status: ["ACTIVE", "RESOLVED", "ARCHIVED"],
      user_type: ["client_user", "hil_user"],
      workflow_counterparty_status: [
        "PENDING",
        "CONTACTED",
        "RESPONDED",
        "COMPLETED",
      ],
      workflow_status: [
        "PENDING",
        "IN_PROGRESS",
        "AWAITING_REVIEW",
        "BLOCKED",
        "COMPLETED",
      ],
      workflow_type: ["MUNI_LIEN_SEARCH", "HOA_ACQUISITION", "PAYOFF"],
    },
  },
} as const
