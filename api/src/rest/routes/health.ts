import { Router, Request, Response } from 'express';
import { appRouter } from '../../trpc/router';
import { createServerClient } from '../../utils/database';
import { TRPCError } from '@trpc/server';

const router = Router();

// Helper function to create tRPC caller
async function createCaller(req: Request, res: Response) {
  const context = {
    req,
    res,
    supabase: createServerClient(),
  };
  return appRouter.createCaller(context);
}

// Helper function to handle errors
function handleError(error: any, res: Response) {
  console.error('REST API Error:', error);
  
  if (error instanceof TRPCError) {
    const statusCode = error.code === 'NOT_FOUND' ? 404 : 
                      error.code === 'BAD_REQUEST' ? 400 :
                      error.code === 'UNAUTHORIZED' ? 401 :
                      error.code === 'FORBIDDEN' ? 403 : 500;
    
    return res.status(statusCode).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
  
  return res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
}

// GET /api/rest/health - Health check
router.get('/', async (req: Request, res: Response) => {
  try {
    const caller = await createCaller(req, res);
    
    const result = await caller.health.check();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    handleError(error, res);
  }
});

export { router as healthRestRouter };