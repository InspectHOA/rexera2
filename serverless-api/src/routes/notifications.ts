/**
 * Notifications API Routes
 */

import { Hono } from 'hono';
import { createServerClient } from '../utils/database';
import { getCompanyFilter, clientDataMiddleware, type AuthUser } from '../middleware';
import { 
  NotificationFiltersSchema,
  UpdateNotificationSchema,
  API_ERROR_CODES 
} from '@rexera/shared';
import { auditLogger } from './audit-events';

const notifications = new Hono();

// Apply client data middleware to all routes (except in test mode)
if (process.env.NODE_ENV !== 'test') {
  notifications.use('*', clientDataMiddleware);
}

// Use shared schema for query parameters

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
    const result = NotificationFiltersSchema.safeParse(rawQuery);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues,
      }, 400);
    }
    
    const { type, priority, read, limit, offset, include } = result.data;

    // Build dynamic select based on include parameter
    let selectFields = '*';
    if (include.includes('workflow')) {
      selectFields += ', workflows!metadata->>workflow_id(id, title, client_id)';
    }
    if (include.includes('user')) {
      selectFields += ', user_profiles!user_id(id, email, full_name)';
    }

    let queryBuilder = supabase
      .from('hil_notifications')
      .select(selectFields)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset + limit - 1));

    // Apply filters
    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }
    if (priority) {
      queryBuilder = queryBuilder.eq('priority', priority);
    }
    if (read !== undefined) {
      queryBuilder = queryBuilder.eq('read', read);
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

    if (type) {
      countQuery = countQuery.eq('type', type);
    }
    if (priority) {
      countQuery = countQuery.eq('priority', priority);
    }
    if (read !== undefined) {
      countQuery = countQuery.eq('read', read);
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
      data: notifications || [],
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit: limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
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

    // Get existing notification for audit logging
    const { data: existingNotification } = await supabase
      .from('hil_notifications')
      .select('read, type')
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .single();

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

    // Log audit event for notification read
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'communication',
        action: 'update',
        resource_type: 'notification',
        resource_id: notificationId,
        event_data: {
          notification_type: existingNotification?.type,
          old_read_status: existingNotification?.read,
          new_read_status: true,
          operation: 'mark_as_read'
        }
      });
    } catch (auditError) {
      console.warn('Failed to log audit event for notification read:', auditError);
      // Don't fail the request for audit errors
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

    // Log audit event for bulk mark as read
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'communication',
        action: 'update',
        resource_type: 'notification',
        resource_id: 'bulk_operation',
        event_data: {
          operation: 'mark_all_as_read',
          updated_count: data?.length || 0,
          notification_ids: data?.map(n => n.id) || []
        }
      });
    } catch (auditError) {
      console.warn('Failed to log audit event for bulk notification read:', auditError);
      // Don't fail the request for audit errors
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

// GET /notifications/:id - Get single notification
notifications.get('/:id', async (c) => {
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

    const { data: notification, error } = await supabase
      .from('hil_notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', user.id) // Ensure user can only access their own notifications
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: 'Notification not found',
        }, 404);
      }
      throw new Error(`Failed to fetch notification: ${error.message}`);
    }

    return c.json({
      success: true,
      data: notification,
    });

  } catch (error: any) {
    return c.json({
      success: false,
      error: 'Failed to fetch notification',
      details: error.message,
    }, 500);
  }
});

// POST /notifications - Create notification (typically used by system, not users)
notifications.post('/', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: '284219ff-3a1f-4e86-9ea4-3536f940451f', 
      email: 'admin@rexera.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL_ADMIN', 
      company_id: undefined 
    };
    const body = await c.req.json();

    // Only allow HIL users to create notifications
    if (user.user_type !== 'hil_user') {
      return c.json({
        success: false,
        error: 'Access denied. Only HIL users can create notifications.',
      }, 403);
    }

    const { data: notification, error } = await supabase
      .from('hil_notifications')
      .insert(body)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    // Log audit event for notification creation
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'communication',
        action: 'create',
        resource_type: 'notification',
        resource_id: notification.id,
        event_data: {
          notification_type: notification.type,
          priority: notification.priority,
          target_user_id: notification.user_id,
          operation: 'manual_create'
        }
      });
    } catch (auditError) {
      console.warn('Failed to log audit event for notification creation:', auditError);
      // Don't fail the request for audit errors
    }

    return c.json({
      success: true,
      data: notification,
    }, 201);

  } catch (error: any) {
    return c.json({
      success: false,
      error: 'Failed to create notification',
      details: error.message,
    }, 500);
  }
});

// PATCH /notifications/:id - Update notification
notifications.patch('/:id', async (c) => {
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
    const body = await c.req.json();
    const result = UpdateNotificationSchema.safeParse(body);

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400);
    }

    // Get existing notification for audit logging
    const { data: existingNotification } = await supabase
      .from('hil_notifications')
      .select('read, type')
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .single();

    const { data: notification, error } = await supabase
      .from('hil_notifications')
      .update(result.data)
      .eq('id', notificationId)
      .eq('user_id', user.id) // Ensure user can only update their own notifications
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: 'Notification not found',
        }, 404);
      }
      throw new Error(`Failed to update notification: ${error.message}`);
    }

    // Log audit event for notification update
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'communication',
        action: 'update',
        resource_type: 'notification',
        resource_id: notificationId,
        event_data: {
          notification_type: existingNotification?.type,
          old_read_status: existingNotification?.read,
          new_read_status: notification.read,
          updated_fields: Object.keys(result.data),
          operation: 'manual_update'
        }
      });
    } catch (auditError) {
      console.warn('Failed to log audit event for notification update:', auditError);
      // Don't fail the request for audit errors
    }

    return c.json({
      success: true,
      data: notification,
    });

  } catch (error: any) {
    return c.json({
      success: false,
      error: 'Failed to update notification',
      details: error.message,
    }, 500);
  }
});

// DELETE /notifications/:id - Delete notification  
notifications.delete('/:id', async (c) => {
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

    // Get existing notification for audit logging
    const { data: existingNotification } = await supabase
      .from('hil_notifications')
      .select('type, priority, user_id')
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .single();

    const { error } = await supabase
      .from('hil_notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id); // Ensure user can only delete their own notifications

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }

    // Log audit event for notification deletion
    try {
      if (existingNotification) {
        await auditLogger.log({
          actor_type: 'human',
          actor_id: user.id,
          actor_name: user.email,
          event_type: 'communication',
          action: 'delete',
          resource_type: 'notification',
          resource_id: notificationId,
          event_data: {
            notification_type: existingNotification.type,
            priority: existingNotification.priority,
            target_user_id: existingNotification.user_id,
            operation: 'manual_delete'
          }
        });
      }
    } catch (auditError) {
      console.warn('Failed to log audit event for notification deletion:', auditError);
      // Don't fail the request for audit errors
    }

    return c.json({
      success: true,
      message: 'Notification deleted successfully',
    });

  } catch (error: any) {
    return c.json({
      success: false,
      error: 'Failed to delete notification',
      details: error.message,
    }, 500);
  }
});

export default notifications;