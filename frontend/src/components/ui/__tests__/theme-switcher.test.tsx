import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock utils first
jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Mock next-themes
const mockSetTheme = jest.fn();
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

// Import after mocking
import { ThemeSwitcher } from '../theme-switcher';
import { useTheme } from 'next-themes';

describe('ThemeSwitcher', () => {
  const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

  beforeEach(() => {
    mockSetTheme.mockClear();
    mockUseTheme.mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      forcedTheme: undefined,
    });
  });

  it('renders the theme switcher button', () => {
    render(<ThemeSwitcher />);
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });

  it('shows sun icon for light theme and moon icon for dark theme', () => {
    render(<ThemeSwitcher />);
    const button = screen.getByRole('button', { name: /toggle theme/i });
    
    // Should have both icons (sun visible in light mode, moon visible in dark mode)
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('has the correct aria attributes for accessibility', () => {
    render(<ThemeSwitcher />);
    const button = screen.getByRole('button', { name: /toggle theme/i });
    
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('displays different icons based on theme', () => {
    // Test light theme
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      forcedTheme: undefined,
    });

    const { rerender } = render(<ThemeSwitcher />);
    expect(document.querySelector('.lucide-sun')).toBeInTheDocument();

    // Test dark theme
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      forcedTheme: undefined,
    });

    rerender(<ThemeSwitcher />);
    expect(document.querySelector('.lucide-moon')).toBeInTheDocument();
  });

  it('calls useTheme hook correctly', () => {
    render(<ThemeSwitcher />);
    expect(mockUseTheme).toHaveBeenCalled();
  });

  it('renders correctly when theme is undefined', () => {
    mockUseTheme.mockReturnValue({
      theme: undefined,
      setTheme: mockSetTheme,
      resolvedTheme: undefined,
      themes: ['light', 'dark', 'system'],
      systemTheme: undefined,
      forcedTheme: undefined,
    });

    render(<ThemeSwitcher />);
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });
});