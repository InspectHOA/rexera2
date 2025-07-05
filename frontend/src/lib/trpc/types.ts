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
  interrupts: {
    list: any;
    byId: any;
    resolve: any;
  };
  agents: {
    list: any;
    byId: any;
    performance: any;
  };
  activities: {
    list: any;
    byId: any;
    summary: any;
  };
}