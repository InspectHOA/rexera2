import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { SKIP_AUTH, SKIP_AUTH_USER } from '@/lib/auth/config';

// Mock the Supabase SSR client
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => ({ value: 'test-cookie-value' })),
    set: jest.fn(),
    remove: jest.fn(),
  })),
}));

// Mock auth config
jest.mock('@/lib/auth/config', () => ({
  SKIP_AUTH: true,
  SKIP_AUTH_USER: {
    id: '284219ff-3a1f-4e86-9ea4-3536f940451f',
    email: 'admin@rexera.com',
    name: 'Admin User',
    user_type: 'hil_user',
    role: 'HIL_ADMIN',
  },
}));

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

const mockFromResult = {
  select: jest.fn(),
  update: jest.fn(),
  insert: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
};

const { createServerClient } = require('@supabase/ssr');

describe('/api/user/preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createServerClient as any).mockReturnValue(mockSupabase);
    mockSupabase.from.mockReturnValue(mockFromResult);
    
    // Setup default chaining - all methods return mockFromResult to allow chaining
    mockFromResult.select.mockReturnValue(mockFromResult);
    mockFromResult.update.mockReturnValue(mockFromResult);
    mockFromResult.insert.mockReturnValue(mockFromResult);
    mockFromResult.eq.mockReturnValue(mockFromResult);
    mockFromResult.single.mockReturnValue(Promise.resolve({ data: null, error: null }));
    
    // Default successful update/insert operations
    mockFromResult.update.mockImplementation(() => ({
      eq: jest.fn().mockResolvedValue({ error: null })
    }));
    mockFromResult.insert.mockResolvedValue({ error: null });
  });

  describe('GET /api/user/preferences', () => {
    it('returns existing theme preference', async () => {
      mockFromResult.single.mockResolvedValue({
        data: { theme: 'dark' },
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ theme: 'dark' });
      expect(mockSupabase.from).toHaveBeenCalledWith('user_preferences');
      expect(mockFromResult.select).toHaveBeenCalledWith('theme');
      expect(mockFromResult.eq).toHaveBeenCalledWith('user_id', SKIP_AUTH_USER.id);
    });

    it('creates default preference when none exists', async () => {
      mockFromResult.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      
      mockFromResult.insert.mockResolvedValue({
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ theme: 'system' });
      expect(mockFromResult.insert).toHaveBeenCalledWith({
        user_id: SKIP_AUTH_USER.id,
        theme: 'system',
      });
    });

    it('returns system theme on database error', async () => {
      mockFromResult.single.mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database error' },
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ theme: 'system' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch user preference:',
        expect.objectContaining({ code: 'OTHER_ERROR' })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('POST /api/user/preferences', () => {
    const createMockRequest = (theme: string) => {
      return {
        json: jest.fn().mockResolvedValue({ theme }),
      } as unknown as NextRequest;
    };

    it('updates existing theme preference', async () => {
      const request = createMockRequest('dark');
      
      // Mock the update chain properly
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      mockFromResult.update.mockImplementation(() => ({
        eq: mockEq
      }));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(mockFromResult.update).toHaveBeenCalledWith({
        theme: 'dark',
        updated_at: expect.any(String),
      });
      expect(mockEq).toHaveBeenCalledWith('user_id', SKIP_AUTH_USER.id);
    });

    it('validates theme value', async () => {
      const request = createMockRequest('invalid-theme');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid theme value' });
    });

    it('handles database errors during update', async () => {
      const request = createMockRequest('dark');
      
      // Mock the update chain with error
      mockFromResult.update.mockImplementation(() => ({
        eq: jest.fn().mockResolvedValue({ 
          error: { code: 'OTHER_ERROR', message: 'Database error' } 
        })
      }));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to save preference' });

      consoleSpy.mockRestore();
    });
  });
});