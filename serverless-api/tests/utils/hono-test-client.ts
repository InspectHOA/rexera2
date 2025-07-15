/**
 * Hono test client utilities
 * Native Hono testing approach that doesn't require Supertest
 */

import type { Hono } from 'hono';

interface TestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  get: (headerName: string) => string | null;
  expect: (expectedStatus: number) => TestAssertions;
}

interface TestAssertions {
  expect: (matcher: string | RegExp, value?: string | RegExp) => TestAssertions;
}

export class HonoTestClient {
  constructor(private app: Hono) {}

  async get(path: string, headers?: Record<string, string>): Promise<TestResponse> {
    const request = new Request(`http://localhost${path}`, {
      method: 'GET',
      headers: headers || {},
    });

    const response = await this.app.fetch(request);
    const body = await this.parseResponse(response);

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body,
      get: (headerName: string) => response.headers.get(headerName),
      expect: (expectedStatus: number) => {
        if (response.status !== expectedStatus) {
          throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
        }
        return this.createAssertions(response, body);
      }
    };
  }

  async post(path: string, data?: any, headers?: Record<string, string>): Promise<TestResponse> {
    const request = new Request(`http://localhost${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const response = await this.app.fetch(request);
    const body = await this.parseResponse(response);

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body,
      get: (headerName: string) => response.headers.get(headerName),
      expect: (expectedStatus: number) => {
        if (response.status !== expectedStatus) {
          throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
        }
        return this.createAssertions(response, body);
      }
    };
  }

  async patch(path: string, data?: any, headers?: Record<string, string>): Promise<TestResponse> {
    const request = new Request(`http://localhost${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const response = await this.app.fetch(request);
    const body = await this.parseResponse(response);

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body,
      get: (headerName: string) => response.headers.get(headerName),
      expect: (expectedStatus: number) => {
        if (response.status !== expectedStatus) {
          throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
        }
        return this.createAssertions(response, body);
      }
    };
  }

  async request(path: string, options: { method: string; headers?: Record<string, string>; body?: any } = { method: 'GET' }): Promise<TestResponse> {
    const request = new Request(`http://localhost${path}`, {
      method: options.method,
      headers: {
        ...(options.body && options.method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const response = await this.app.fetch(request);
    const body = await this.parseResponse(response);

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body,
      get: (headerName: string) => response.headers.get(headerName),
      expect: (expectedStatus: number) => {
        if (response.status !== expectedStatus) {
          throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
        }
        return this.createAssertions(response, body);
      }
    };
  }

  private async parseResponse(response: Response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      try {
        return await response.json();
      } catch {
        return await response.text();
      }
    }
    
    return await response.text();
  }

  private createAssertions(response: Response, body: any): TestAssertions {
    return {
      expect: (matcher: string | RegExp, value?: string | RegExp) => {
        if (typeof matcher === 'string' && matcher === 'Content-Type') {
          const contentType = response.headers.get('content-type');
          if (value && typeof value === 'object' && 'test' in value) {
            // It's a RegExp
            if (!value.test(contentType || '')) {
              throw new Error(`Expected Content-Type to match ${value}, got ${contentType}`);
            }
          }
        }
        return this.createAssertions(response, body);
      }
    };
  }
}

export function testClient(app: Hono) {
  return new HonoTestClient(app);
}