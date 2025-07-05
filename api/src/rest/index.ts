import { Router } from 'express';
import { workflowsRestRouter } from './routes/workflows';
import { tasksRestRouter } from './routes/tasks';
import { healthRestRouter } from './routes/health';
import { n8nWebhookRouter } from './routes/n8n-webhook';
import { testN8nRouter } from './routes/test-n8n';

const restRouter = Router();

// Mount REST route handlers
restRouter.use('/workflows', workflowsRestRouter);
restRouter.use('/tasks', tasksRestRouter);
restRouter.use('/health', healthRestRouter);
restRouter.use('/webhooks', n8nWebhookRouter);
restRouter.use('/test-n8n', testN8nRouter);

export { restRouter };