import { router } from './trpc';
import { workflowsRouter } from './routers/workflows';
import { tasksRouter } from './routers/tasks';
import { healthRouter } from './routers/health';

export const appRouter = router({
  workflows: workflowsRouter,
  tasks: tasksRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;