// Simplified AppRouter type that works with tRPC React client
// This ensures compatibility with Vercel build environment
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