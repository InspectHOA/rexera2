import { Hono } from 'hono';
import { z } from 'zod';
import { createServerClient } from '../utils/database';
import { clientDataMiddleware } from '../middleware';

const clients = new Hono();

// Apply client data middleware to all routes (except in test mode)
if (process.env.NODE_ENV !== 'test') {
  clients.use('*', clientDataMiddleware);
}

// GET /clients - List all clients
clients.get('/', async (c) => {
  try {
    const supabase = createServerClient();
    
    const { data: clientsList, error } = await supabase
      .from('clients')
      .select('id, name, domain, created_at, updated_at')
      .order('name');

    if (error) {
      console.error('Database error:', error);
      return c.json({
        success: false,
        error: {
          message: 'Failed to fetch clients',
          details: error.message
        }
      }, 500);
    }

    return c.json({
      success: true,
      data: clientsList || []
    }, 200);
  } catch (error) {
    console.error('Unexpected error:', error);
    return c.json({
      success: false,
      error: {
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, 500);
  }
});

// GET /clients/:id - Get single client
clients.get('/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const id = c.req.param('id');

    const { data: client, error } = await supabase
      .from('clients')
      .select('id, name, domain, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: {
            message: 'Client not found',
            details: `No client found with ID: ${id}`
          }
        }, 404);
      }

      console.error('Database error:', error);
      return c.json({
        success: false,
        error: {
          message: 'Failed to fetch client',
          details: error.message
        }
      }, 500);
    }

    return c.json({
      success: true,
      data: client
    }, 200);
  } catch (error) {
    console.error('Unexpected error:', error);
    return c.json({
      success: false,
      error: {
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, 500);
  }
});

export default clients;