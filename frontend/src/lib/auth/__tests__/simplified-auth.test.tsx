/**
 * @jest-environment jsdom
 */

/**
 * Frontend Auth Provider Tests for Simplified Auth System
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../provider';
import { SKIP_AUTH, SKIP_AUTH_USER } from '../config';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Supabase provider  
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    })),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    insert: jest.fn()
  }))
};

jest.mock('../../supabase/provider', () => ({
  useSupabase: () => ({ supabase: mockSupabase }),
}));

// Test component that uses auth
const TestComponent = () => {
  const { user, profile, loading } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'ready'}</div>
      <div data-testid="user-id">{user?.id || 'no-user'}</div>
      <div data-testid="user-email">{user?.email || 'no-email'}</div>
      <div data-testid="profile-name">{profile?.full_name || 'no-name'}</div>
      <div data-testid="profile-role">{profile?.role || 'no-role'}</div>
    </div>
  );
};

describe('Simplified Auth System - Frontend', () => {
  const originalEnv = process.env.NEXT_PUBLIC_SKIP_AUTH;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  afterAll(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.NEXT_PUBLIC_SKIP_AUTH = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_SKIP_AUTH;
    }
  });

  describe('SKIP_AUTH Mode', () => {
    beforeEach(() => {
      // Mock environment variable
      process.env.NEXT_PUBLIC_SKIP_AUTH = 'true';
    });

    it('should immediately set hardcoded user and profile', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading')).toHaveTextContent('ready');
      });

      expect(getByTestId('user-id')).toHaveTextContent(SKIP_AUTH_USER.id);
      expect(getByTestId('user-email')).toHaveTextContent(SKIP_AUTH_USER.email);
      expect(getByTestId('profile-name')).toHaveTextContent(SKIP_AUTH_USER.name);
      expect(getByTestId('profile-role')).toHaveTextContent(SKIP_AUTH_USER.role);
    });

    it('should not call Supabase auth methods in SKIP_AUTH mode', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockSupabase.auth.getSession).not.toHaveBeenCalled();
        expect(mockSupabase.auth.onAuthStateChange).not.toHaveBeenCalled();
      });
    });

    it('should use consistent hardcoded values', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading')).toHaveTextContent('ready');
      });

      // Verify values match the config exactly
      expect(getByTestId('user-id')).toHaveTextContent('284219ff-3a1f-4e86-9ea4-3536f940451f');
      expect(getByTestId('user-email')).toHaveTextContent('admin@rexera.com');
      expect(getByTestId('profile-name')).toHaveTextContent('Admin User');
      expect(getByTestId('profile-role')).toHaveTextContent('HIL_ADMIN');
    });
  });

  describe('SSO Mode (Note: runs in SKIP_AUTH in test env)', () => {
    // Note: Since NEXT_PUBLIC_SKIP_AUTH=true is set in jest.setup.js,
    // these tests still run in SKIP_AUTH mode. This is testing the
    // configuration behavior rather than actual SSO functionality.
    
    it('should still use SKIP_AUTH in test environment', async () => {
      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(getByTestId('loading')).toHaveTextContent('ready');
      });

      // In test environment, it should still show SKIP_AUTH user
      expect(getByTestId('user-id')).toHaveTextContent('284219ff-3a1f-4e86-9ea4-3536f940451f');
      expect(getByTestId('user-email')).toHaveTextContent('admin@rexera.com');
      expect(getByTestId('profile-name')).toHaveTextContent('Admin User');
      expect(getByTestId('profile-role')).toHaveTextContent('HIL_ADMIN');
    });
  });

  describe('Environment Variable Detection', () => {
    it('should detect SKIP_AUTH=true correctly', () => {
      process.env.NEXT_PUBLIC_SKIP_AUTH = 'true';
      
      // Re-import to get updated env value
      jest.resetModules();
      const { SKIP_AUTH } = require('../config');
      
      expect(SKIP_AUTH).toBe(true);
    });

    it('should default to SSO when SKIP_AUTH is not set', () => {
      delete process.env.NEXT_PUBLIC_SKIP_AUTH;
      
      jest.resetModules();
      const { SKIP_AUTH } = require('../config');
      
      expect(SKIP_AUTH).toBe(false);
    });

    it('should default to SSO when SKIP_AUTH is false', () => {
      process.env.NEXT_PUBLIC_SKIP_AUTH = 'false';
      
      jest.resetModules();
      const { SKIP_AUTH } = require('../config');
      
      expect(SKIP_AUTH).toBe(false);
    });
  });

  describe('SignOut Functionality', () => {
    it('should redirect without calling Supabase in SKIP_AUTH mode', async () => {
      process.env.NEXT_PUBLIC_SKIP_AUTH = 'true';
      
      const TestSignOut = () => {
        const { signOut } = useAuth();
        return <button onClick={signOut} data-testid="signout">Sign Out</button>;
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestSignOut />
        </AuthProvider>
      );

      getByTestId('signout').click();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
        expect(mockSupabase.auth.signOut).not.toHaveBeenCalled();
      });
    });

    it('should still redirect in test environment (SKIP_AUTH mode)', async () => {
      const TestSignOut = () => {
        const { signOut } = useAuth();
        return <button onClick={signOut} data-testid="signout">Sign Out</button>;
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestSignOut />
        </AuthProvider>
      );

      getByTestId('signout').click();

      await waitFor(() => {
        // In test environment with SKIP_AUTH, it should not call Supabase signOut
        expect(mockSupabase.auth.signOut).not.toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });
  });
});