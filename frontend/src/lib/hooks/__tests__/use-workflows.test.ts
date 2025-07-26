/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useWorkflows, taskExecutionKeys } from '../use-workflows';

// Simple test version
describe('useWorkflows', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  describe('Hook Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useWorkflows(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.workflows).toEqual([]);
      expect(result.current.stats.total).toBe(0);
      expect(result.current.stats.active).toBe(0);
      expect(result.current.stats.interrupts).toBe(0);
      expect(result.current.stats.completedToday).toBe(0);
    });

    it('should provide refetch function', () => {
      const { result } = renderHook(() => useWorkflows(), { wrapper });

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('Query Key Factory', () => {
    it('should generate correct task execution query keys', () => {
      expect(taskExecutionKeys.all).toEqual(['taskExecutions']);
      expect(taskExecutionKeys.lists()).toEqual(['taskExecutions', 'list']);
      expect(taskExecutionKeys.list({ workflow_id: 'wf-1' })).toEqual([
        'taskExecutions', 
        'list', 
        { workflow_id: 'wf-1' }
      ]);
    });

    it('should handle complex filter objects in query keys', () => {
      const filters = {
        workflow_id: 'wf-1',
        status: 'IN_PROGRESS',
        priority: 'HIGH'
      };

      expect(taskExecutionKeys.list(filters)).toEqual([
        'taskExecutions',
        'list',
        filters
      ]);
    });
  });

  describe('Basic Functionality', () => {
    it('should handle empty filters', () => {
      const { result } = renderHook(() => useWorkflows({}), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.workflows).toEqual([]);
    });

    it('should handle undefined filters', () => {
      const { result } = renderHook(() => useWorkflows(undefined), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.workflows).toEqual([]);
    });
  });

  describe('Statistics', () => {
    it('should maintain stats structure', () => {
      const { result } = renderHook(() => useWorkflows(), { wrapper });

      expect(result.current.stats).toHaveProperty('total');
      expect(result.current.stats).toHaveProperty('active');
      expect(result.current.stats).toHaveProperty('interrupts');
      expect(result.current.stats).toHaveProperty('completedToday');
    });
  });
});