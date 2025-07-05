'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { useWorkflows, useWorkflow } from './useWorkflows';

interface WorkflowFilters {
  workflow_type?: string;
  status?: string;
  client_id?: string;
  assigned_to?: string;
  priority?: string;
  page?: number;
  limit?: number;
  include?: string[];
}

interface WorkflowStats {
  total: number;
  active: number;
  interrupts: number;
  completedToday: number;
}

export function useWorkflowsTRPC(filters: WorkflowFilters = {}) {
  // Convert to new API format and delegate to useWorkflows
  return useWorkflows(filters);
}

export function useWorkflowTRPC(id: string) {
  // Delegate to new useWorkflow hook
  return useWorkflow(id);
}