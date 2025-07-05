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

// GET /api/rest/workflows - List workflows
router.get('/', async (req: Request, res: Response) => {
  try {
    const caller = await createCaller(req, res);
    
    // Extract query parameters
    const {
      workflow_type,
      status,
      client_id,
      assigned_to,
      priority,
      page = '1',
      limit = '10',
      include = ''
    } = req.query;

    // Parse include parameter
    const includeArray = typeof include === 'string' && include 
      ? include.split(',').map(s => s.trim()) 
      : [];

    const input = {
      workflow_type: workflow_type as any,
      status: status as any,
      client_id: client_id as string,
      assigned_to: assigned_to as string,
      priority: priority as any,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      include: includeArray
    };

    const result = await caller.workflows.list(input);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    handleError(error, res);
  }
});

// GET /api/rest/workflows/:id - Get workflow by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const caller = await createCaller(req, res);
    
    const { id } = req.params;
    const { include = '' } = req.query;

    // Parse include parameter
    const includeArray = typeof include === 'string' && include 
      ? include.split(',').map(s => s.trim()) 
      : [];

    const input = {
      id,
      include: includeArray
    };

    const result = await caller.workflows.byId(input);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    handleError(error, res);
  }
});

// POST /api/rest/workflows - Create workflow
router.post('/', async (req: Request, res: Response) => {
  try {
    const caller = await createCaller(req, res);
    
    const {
      workflow_type,
      client_id,
      title,
      description,
      priority,
      metadata,
      due_date,
      created_by
    } = req.body;

    // Validate required fields
    if (!workflow_type || !client_id || !title || !created_by) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: workflow_type, client_id, title, created_by'
      });
    }

    const input = {
      workflow_type,
      client_id,
      title,
      description,
      priority,
      metadata,
      due_date,
      created_by
    };

    const result = await caller.workflows.create(input);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    handleError(error, res);
  }
});

export { router as workflowsRestRouter };