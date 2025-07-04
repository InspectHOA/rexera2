import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { NextRequest, NextResponse } from 'next/server';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Import API route handlers
import { GET as workflowsGET, POST as workflowsPOST } from './workflows/route';
import { GET as healthGET } from './health/route';
import { GET as workflowByIdGET, PUT as workflowByIdPUT, DELETE as workflowByIdDELETE } from './workflows/[id]/route';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Helper function to convert Express req/res to Next.js format
function createNextRequest(req: Request): NextRequest {
  const url = new URL(req.url!, `http://localhost:${PORT}`);
  
  return new NextRequest(url, {
    method: req.method,
    headers: new Headers(req.headers as Record<string, string>),
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  });
}

async function handleNextResponse(nextResponse: NextResponse, res: Response) {
  const status = nextResponse.status;
  const body = await nextResponse.text();
  
  // Copy headers
  nextResponse.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  
  res.status(status).send(body);
}

// API Routes
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const nextReq = createNextRequest(req);
    const nextRes = await healthGET(nextReq);
    await handleNextResponse(nextRes, res);
  } catch (error) {
    console.error('Health endpoint error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/workflows', async (req: Request, res: Response) => {
  try {
    const nextReq = createNextRequest(req);
    const nextRes = await workflowsGET(nextReq);
    await handleNextResponse(nextRes, res);
  } catch (error) {
    console.error('Workflows GET error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/api/workflows', async (req: Request, res: Response) => {
  try {
    const nextReq = createNextRequest(req);
    const nextRes = await workflowsPOST(nextReq);
    await handleNextResponse(nextRes, res);
  } catch (error) {
    console.error('Workflows POST error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/workflows/:id', async (req: Request, res: Response) => {
  try {
    const nextReq = createNextRequest(req);
    const nextRes = await workflowByIdGET(nextReq, { params: { id: req.params.id } });
    await handleNextResponse(nextRes, res);
  } catch (error) {
    console.error('Workflow GET by ID error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.put('/api/workflows/:id', async (req: Request, res: Response) => {
  try {
    const nextReq = createNextRequest(req);
    const nextRes = await workflowByIdPUT(nextReq, { params: { id: req.params.id } });
    await handleNextResponse(nextRes, res);
  } catch (error) {
    console.error('Workflow PUT by ID error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.delete('/api/workflows/:id', async (req: Request, res: Response) => {
  try {
    const nextReq = createNextRequest(req);
    const nextRes = await workflowByIdDELETE(nextReq, { params: { id: req.params.id } });
    await handleNextResponse(nextRes, res);
  } catch (error) {
    console.error('Workflow DELETE by ID error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Catch-all for undefined routes
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    success: false, 
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal Server Error',
    message: error.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET    http://localhost:${PORT}/api/health`);
  console.log(`   GET    http://localhost:${PORT}/api/workflows`);
  console.log(`   POST   http://localhost:${PORT}/api/workflows`);
  console.log(`   GET    http://localhost:${PORT}/api/workflows/:id`);
  console.log(`   PUT    http://localhost:${PORT}/api/workflows/:id`);
  console.log(`   DELETE http://localhost:${PORT}/api/workflows/:id`);
});