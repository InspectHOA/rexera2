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

// GET /api/rest/tasks - List tasks
router.get('/', async (req: Request, res: Response) => {
  try {
    const caller = await createCaller(req, res);
    
    // Extract query parameters
    const {
      workflow_id,
      status,
      executor_type,
      assigned_to,
      priority,
      page = '1',
      limit = '20',
      include = ''
    } = req.query;

    // Parse include parameter
    const includeArray = typeof include === 'string' && include 
      ? include.split(',').map(s => s.trim()) 
      : [];

    const input = {
      workflow_id: workflow_id as string,
      status: status as any,
      executor_type: executor_type as any,
      assigned_to: assigned_to as string,
      priority: priority as any,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      include: includeArray as any
    };

    const result = await caller.tasks.list(input);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    handleError(error, res);
  }
});

// POST /api/rest/tasks - Create task
router.post('/', async (req: Request, res: Response) => {
  try {
    const caller = await createCaller(req, res);
    
    const {
      workflow_id,
      title,
      description,
      executor_type,
      assigned_to,
      priority,
      metadata,
      due_date
    } = req.body;

    // Validate required fields
    if (!workflow_id || !title || !executor_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: workflow_id, title, executor_type'
      });
    }

    const input = {
      workflow_id,
      title,
      description,
      executor_type,
      assigned_to,
      priority,
      metadata,
      due_date
    };

    const result = await caller.tasks.create(input);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    handleError(error, res);
  }
});

export { router as tasksRestRouter };