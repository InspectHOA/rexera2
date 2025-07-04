import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc/router';
import { createTRPCContext } from './trpc/context';

// Load environment variables - prioritize .env.local for development
dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env

const app = express();
const PORT = process.env.PORT || 3002;

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'https://rexera-frontend.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// tRPC middleware
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  })
);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Import route handlers
const workflowsRoute = require('./workflows/route');
const tasksRoute = require('./tasks/route');
const healthRoute = require('./health/route');

// API Routes
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const mockRequest = {
      url: `/api/health`,
      method: 'GET',
      headers: req.headers,
      nextUrl: { searchParams: new URLSearchParams() }
    };
    const response = await healthRoute.GET(mockRequest);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Health check failed' });
  }
});

app.get('/api/workflows', async (req: Request, res: Response) => {
  try {
    const searchParams = new URLSearchParams(req.query as any);
    const mockRequest = {
      url: `/api/workflows?${searchParams.toString()}`,
      method: 'GET',
      headers: req.headers,
      nextUrl: { searchParams }
    };
    const response = await workflowsRoute.GET(mockRequest);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch workflows' });
  }
});

app.post('/api/workflows', async (req: Request, res: Response) => {
  try {
    const mockRequest = {
      url: '/api/workflows',
      method: 'POST',
      headers: req.headers,
      json: () => Promise.resolve(req.body),
      nextUrl: { searchParams: new URLSearchParams() }
    };
    const response = await workflowsRoute.POST(mockRequest);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create workflow' });
  }
});

app.get('/api/workflows/:id', async (req: Request, res: Response) => {
  try {
    const searchParams = new URLSearchParams(req.query as any);
    const mockRequest = {
      url: `/api/workflows/${req.params.id}?${searchParams.toString()}`,
      method: 'GET',
      headers: req.headers,
      nextUrl: { searchParams }
    };
    const mockContext = { params: { id: req.params.id } };
    const response = await workflowsRoute.GET(mockRequest, mockContext);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch workflow' });
  }
});

app.get('/api/tasks', async (req: Request, res: Response) => {
  try {
    const searchParams = new URLSearchParams(req.query as any);
    const mockRequest = {
      url: `/api/tasks?${searchParams.toString()}`,
      method: 'GET',
      headers: req.headers,
      nextUrl: { searchParams }
    };
    const response = await tasksRoute.GET(mockRequest);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', async (req: Request, res: Response) => {
  try {
    const mockRequest = {
      url: '/api/tasks',
      method: 'POST',
      headers: req.headers,
      json: () => Promise.resolve(req.body),
      nextUrl: { searchParams: new URLSearchParams() }
    };
    const response = await tasksRoute.POST(mockRequest);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
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
app.use((error: any, req: Request, res: Response, next: any) => {
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Workflows API: http://localhost:${PORT}/api/workflows`);
  console.log(`📋 Tasks API: http://localhost:${PORT}/api/tasks`);
  console.log(`⚡ tRPC API: http://localhost:${PORT}/api/trpc`);
});

export default app;