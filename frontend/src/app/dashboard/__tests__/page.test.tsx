/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../page';

// Mock the dashboard components
jest.mock('../_components/header', () => ({
  DashboardHeader: () => <div data-testid="dashboard-header">Dashboard Header</div>
}));

jest.mock('../_components/stats', () => ({
  DashboardStats: () => <div data-testid="dashboard-stats">Dashboard Stats</div>
}));

jest.mock('../_components/workflow-table', () => ({
  WorkflowTable: () => <div data-testid="workflow-table">Workflow Table</div>
}));

describe('DashboardPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );
  };

  it('should render all dashboard components', () => {
    renderComponent();

    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
    expect(screen.getByTestId('workflow-table')).toBeInTheDocument();
  });

  it('should have proper layout structure', () => {
    renderComponent();

    const container = document.querySelector('.dashboard-container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('relative');
  });

  it('should render components in correct order', () => {
    renderComponent();

    const components = [
      screen.getByTestId('dashboard-header'),
      screen.getByTestId('dashboard-stats'),
      screen.getByTestId('workflow-table')
    ];

    // Verify components are rendered in the expected order
    for (let i = 0; i < components.length - 1; i++) {
      expect(components[i].compareDocumentPosition(components[i + 1])).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      );
    }
  });

  it('should have background overlay styling', () => {
    renderComponent();

    const overlay = document.querySelector('.absolute.inset-0.opacity-\\[0\\.02\\]');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('pointer-events-none');
  });

  it('should have proper z-index layering', () => {
    renderComponent();

    const overlay = document.querySelector('.absolute.inset-0');
    const content = document.querySelector('.relative.z-10');

    expect(overlay).toHaveClass('z-0');
    expect(content).toHaveClass('z-10');
  });
});