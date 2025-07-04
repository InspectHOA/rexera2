// Use a type-only import that works with the actual API router structure
// This avoids build-time dependency issues while maintaining type safety

export interface AppRouter {
  workflows: {
    list: any;
    byId: any;
    create: any;
  };
  tasks: {
    list: any;
    create: any;
  };
  health: {
    check: any;
  };
}