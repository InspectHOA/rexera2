/**
 * Type declarations for test environment
 */

declare global {
  var mockSupabase: {
    from: jest.MockedFunction<any>;
    auth: {
      getSession: jest.MockedFunction<any>;
      getUser: jest.MockedFunction<any>;
    };
    storage: {
      from: jest.MockedFunction<any>;
    };
  };

  namespace NodeJS {
    interface Global {
      mockSupabase: typeof mockSupabase;
    }
  }
}

export {};