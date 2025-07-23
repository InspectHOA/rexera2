/**
 * Notifications API Routes
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { createServerClient } from '../utils/database';
import { clientDataMiddleware, type AuthUser } from '../middleware';
import { API_ERROR_CODES } from '@rexera/shared';

const notifications = new Hono();

// Apply client data middleware to all routes (except in test mode)
if (process.env.NODE_ENV !== 'test') {
  notifications.use('*', clientDataMiddleware);
}

// Query parameters schema
const NotificationsQuerySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 100),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  type: z.string().optional(),
  priority: z.string().optional(),
  read: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
});

// GET /notifications - List notifications for authenticated user
notifications.get('/', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: '284219ff-3a1f-4e86-9ea4-3536f940451f', 
      email: 'admin@rexera.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL_ADMIN', 
      company_id: undefined 
    };
    
    const rawQuery = c.req.query();
    const result = NotificationsQuerySchema.safeParse(rawQuery);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues,
      }, 400);
    }
    
    const query = result.data;

    let queryBuilder = supabase
      .from('hil_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(Number(query.offset), Number(query.offset + query.limit - 1));

    // Apply filters
    if (query.type) {
      queryBuilder = queryBuilder.eq('type', query.type);
    }
    if (query.priority) {
      queryBuilder = queryBuilder.eq('priority', query.priority);
    }
    if (query.read !== undefined) {
      queryBuilder = queryBuilder.eq('read', query.read);
    }

    const { data: notifications, error } = await queryBuilder;

    if (error) {
      console.error('Supabase error fetching notifications:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch notifications',
        details: error.message,
      }, 500);
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('hil_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (query.type) {
      countQuery = countQuery.eq('type', query.type);
    }
    if (query.priority) {
      countQuery = countQuery.eq('priority', query.priority);
    }
    if (query.read !== undefined) {
      countQuery = countQuery.eq('read', query.read);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Supabase error fetching notification count:', countError);
      return c.json({
        success: false,
        error: 'Failed to fetch notification count',
        details: countError.message,
      }, 500);
    }

    return c.json({
      success: true,
      data: {
        notifications: notifications || [],
        pagination: {
          total: count || 0,
          limit: query.limit,
          offset: query.offset,
          hasMore: (query.offset + query.limit) < (count || 0),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch notifications',
      details: error.message,
    }, 500);
  }
});

// GET /notifications/stats - Get notification statistics
notifications.get('/stats', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: '284219ff-3a1f-4e86-9ea4-3536f940451f', 
      email: 'admin@rexera.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL_ADMIN', 
      company_id: undefined 
    };

    const { data: notifications, error } = await supabase
      .from('hil_notifications')
      .select('type, priority, read')
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase error fetching notification stats:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch notification statistics',
        details: error.message,
      }, 500);
    }

    const stats = {
      total: notifications?.length || 0,
      unread: notifications?.filter((n: any) => !n.read).length || 0,
      urgent: notifications?.filter((n: any) => n.priority === 'URGENT').length || 0,
      taskInterrupts: notifications?.filter((n: any) => n.type === 'TASK_INTERRUPT').length || 0,
    };

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching notification stats:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch notification statistics',
      details: error.message,
    }, 500);
  }
});

// PATCH /notifications/:id/read - Mark notification as read
notifications.patch('/:id/read', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: '284219ff-3a1f-4e86-9ea4-3536f940451f', 
      email: 'admin@rexera.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL_ADMIN', 
      company_id: undefined 
    };
    const notificationId = c.req.param('id');

    const { data, error } = await supabase
      .from('hil_notifications')
      .update({ 
        read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId)
      .eq('user_id', user.id) // Ensure user can only update their own notifications
      .select()
      .single();

    if (error) {
      console.error('Supabase error marking notification as read:', error);
      return c.json({
        success: false,
        error: 'Failed to mark notification as read',
        details: error.message,
      }, 500);
    }

    if (!data) {
      return c.json({
        success: false,
        error: 'Notification not found',
      }, 404);
    }

    return c.json({
      success: true,
      data: { notification: data },
    });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return c.json({
      success: false,
      error: 'Failed to mark notification as read',
      details: error.message,
    }, 500);
  }
});

// PATCH /notifications/mark-all-read - Mark all notifications as read
notifications.patch('/mark-all-read', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: '284219ff-3a1f-4e86-9ea4-3536f940451f', 
      email: 'admin@rexera.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL_ADMIN', 
      company_id: undefined 
    };

    const { data, error } = await supabase
      .from('hil_notifications')
      .update({ 
        read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('user_id', user.id)
      .eq('read', false) // Only update unread notifications
      .select();

    if (error) {
      console.error('Supabase error marking all notifications as read:', error);
      return c.json({
        success: false,
        error: 'Failed to mark all notifications as read',
        details: error.message,
      }, 500);
    }

    return c.json({
      success: true,
      data: { 
        message: `Marked ${data?.length || 0} notifications as read`,
        updated_count: data?.length || 0 
      },
    });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return c.json({
      success: false,
      error: 'Failed to mark all notifications as read',
      details: error.message,
    }, 500);
  }
});

export default notifications;