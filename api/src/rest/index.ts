import { Router } from 'express';
import { workflowsRestRouter } from './routes/workflows';
import { tasksRestRouter } from './routes/tasks';
import { healthRestRouter } from './routes/health';

const restRouter = Router();

// Mount REST route handlers
restRouter.use('/workflows', workflowsRestRouter);
restRouter.use('/tasks', tasksRestRouter);
restRouter.use('/health', healthRestRouter);

export { restRouter };