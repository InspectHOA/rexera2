import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../theme-provider';
import { ThemeSwitcher } from '../ui/theme-switcher';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock next-themes to avoid SSR issues in tests
jest.mock('next-themes', () => {
  const React = require('react');
  return {
    ThemeProvider: ({ children }: any) => (
      React.createElement('div', { 'data-testid': 'theme-provider' }, children)
    ),
    useTheme: () => ({
      theme: 'light',
      setTheme: jest.fn(),
      resolvedTheme: 'light',
    }),
  };
});

describe('Theme Integration', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ theme: 'system' }),
    });
    
    // Clear document classes
    document.documentElement.className = '';
  });

  it('renders theme provider and switcher', async () => {
    await act(async () => {
      render(
        <ThemeProvider>
          <ThemeSwitcher />
          <div data-testid="themed-element">Hello</div>
        </ThemeProvider>
      );
    });

    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
    expect(screen.getByTestId('themed-element')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Mock API failure
    mockFetch.mockRejectedValue(new Error('API Error'));

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    await act(async () => {
      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>
      );
    });

    // Should not crash and should log warning
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch theme preference'),
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('renders theme switcher with proper attributes', async () => {
    await act(async () => {
      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>
      );
    });

    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    
    // Check that icons are present
    expect(button.querySelector('svg')).toBeInTheDocument();
  });
});