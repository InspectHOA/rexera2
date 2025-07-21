/**
 * User Routes for Rexera API
 * 
 * Handles user-related endpoints for mentions and user lookup
 */

import { Hono } from 'hono';
import { createServerClient } from '../utils/database';
import { clientDataMiddleware, type AuthUser } from '../middleware';
import { z } from 'zod';

const users = new Hono();

// Apply client data middleware to all routes (except in test mode)
if (process.env.NODE_ENV !== 'test') {
  users.use('*', clientDataMiddleware);
}

// Validation schema for user search
const getUsersSchema = z.object({
  q: z.string().optional(), // Search query
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  user_type: z.enum(['hil_user', 'client_user']).optional(),
});

// GET /api/users - List users for mentions and autocomplete
users.get('/', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: 'test-user', 
      email: 'test@example.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL', 
      company_id: undefined 
    };
    
    const rawQuery = c.req.query();
    const result = getUsersSchema.safeParse(rawQuery);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: {
          message: 'Invalid query parameters',
          details: result.error.issues
        }
      }, 400);
    }
    
    const { q, limit, user_type } = result.data;

    let query = supabase
      .from('user_profiles')
      .select('id, full_name, email, user_type, role')
      .order('full_name', { ascending: true })
      .limit(limit);

    // Apply search filter if provided
    if (q) {
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    // Filter by user type if provided
    if (user_type) {
      query = query.eq('user_type', user_type);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return c.json({
        success: false,
        error: {
          message: 'Failed to fetch users',
          details: error.message
        }
      }, 500);
    }

    // Transform data to match expected format for mentions
    const transformedUsers = (users || []).map(user => ({
      id: user.id,
      name: user.full_name || user.email, // Fallback to email if no full_name
      email: user.email,
      user_type: user.user_type,
      role: user.role
    }));

    return c.json({
      success: true,
      data: transformedUsers
    });
  } catch (error) {
    console.error('Unexpected error in users list:', error);
    return c.json({
      success: false,
      error: {
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, 500);
  }
});

// GET /api/users/:id - Get single user
users.get('/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const userId = c.req.param('id');

    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, user_type, role, company_id')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: {
            message: 'User not found',
            details: `No user found with ID: ${userId}`
          }
        }, 404);
      }
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    // Transform data to match expected format
    const transformedUser = {
      id: user.id,
      name: user.full_name || user.email,
      email: user.email,
      user_type: user.user_type,
      role: user.role,
      company_id: user.company_id
    };

    return c.json({
      success: true,
      data: transformedUser
    });
  } catch (error) {
    console.error('Unexpected error in user fetch:', error);
    return c.json({
      success: false,
      error: {
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, 500);
  }
});

export default users;