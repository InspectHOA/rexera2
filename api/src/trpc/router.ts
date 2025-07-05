import { router } from './trpc';
import { workflowsRouter } from './routers/workflows';
import { tasksRouter } from './routers/tasks';
import { healthRouter } from './routers/health';
import { interruptsRouter } from './routers/interrupts';
import { agentsRouter } from './routers/agents';
import { activitiesRouter } from './routers/activities';

export const appRouter = router({
  workflows: workflowsRouter,
  tasks: tasksRouter,
  health: healthRouter,
  interrupts: interruptsRouter,
  agents: agentsRouter,
  activities: activitiesRouter,
});

export type AppRouter = typeof appRouter;