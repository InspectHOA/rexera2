// Set up Node.js environment for API tests
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock environment variables
process.env.NEXT_PUBLIC_SKIP_AUTH = 'true';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock Next.js headers function
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => ({ value: 'test-cookie-value' })),
    set: jest.fn(),
    remove: jest.fn(),
  })),
}));

// Mock Response and Request objects for Next.js API routes
const { NextResponse } = require('next/server');

global.Response = Response || NextResponse;
global.Request = Request || class MockRequest {};

// Mock Headers if not available
if (typeof Headers === 'undefined') {
  global.Headers = class MockHeaders {
    constructor(init) {
      this.map = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.map.set(key.toLowerCase(), value);
        });
      }
    }
    
    get(name) {
      return this.map.get(name.toLowerCase());
    }
    
    set(name, value) {
      this.map.set(name.toLowerCase(), value);
    }
    
    has(name) {
      return this.map.has(name.toLowerCase());
    }
    
    delete(name) {
      this.map.delete(name.toLowerCase());
    }
    
    entries() {
      return this.map.entries();
    }
  };
}