import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc/router';
import { createTRPCContext } from './trpc/context';
import { config } from './config';
import { restRouter } from './rest';

const app = express();

// CORS configuration
const corsOptions = {
  origin: config.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// tRPC middleware
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  })
);

// REST API endpoints
app.use('/api/rest', restRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: config.isDevelopment ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`🚀 API Server running on http://localhost:${config.port}`);
  console.log(`📊 Health check: http://localhost:${config.port}/health`);
  console.log(`⚡ tRPC API: http://localhost:${config.port}/api/trpc`);
  console.log(`🔧 Available tRPC routers: workflows, tasks, health, interrupts, agents, activities`);
  console.log(`🌐 REST API: http://localhost:${config.port}/api/rest`);
  console.log(`📋 REST endpoints:`);
  console.log(`   GET    /api/rest/workflows - List workflows`);
  console.log(`   GET    /api/rest/workflows/:id - Get workflow by ID`);
  console.log(`   POST   /api/rest/workflows - Create workflow`);
  console.log(`   GET    /api/rest/tasks - List tasks`);
  console.log(`   POST   /api/rest/tasks - Create task`);
  console.log(`   GET    /api/rest/health - Health check`);
  console.log(`   POST   /api/rest/webhooks/n8n - n8n webhook endpoint`);
  console.log(`   GET    /api/rest/test-n8n - Test n8n integration`);
  console.log(`   GET    /api/rest/test-n8n/config - n8n configuration status`);
  console.log(`   GET    /api/rest/test-n8n/connection - Test n8n connection`);
});

export default app;