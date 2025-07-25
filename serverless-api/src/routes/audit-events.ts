/**
 * Audit Events Routes for Rexera API
 * 
 * Handles all audit event endpoints for logging and retrieving audit trails.
 * Follows the established Rexera API patterns for consistency.
 */

import { Hono } from 'hono';
import { createServerClient } from '../utils/database';
import { insertAuditEvent, insertAuditEvents } from '../utils/type-safe-db';
import { type AuthUser } from '../middleware';
import { z } from 'zod';
import { 
  AuditEventQuerySchema, 
  CreateAuditEventSchema, 
  type AuditEvent, 
  type CreateAuditEvent,
  BaseAuditLogger
} from '@rexera/shared';

const auditEvents = new Hono();

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

/**
 * Query schema for listing audit events with pagination and filters
 * Overrides numeric fields to handle string query parameters
 */
const listAuditEventsSchema = AuditEventQuerySchema.omit({ 
  limit: true, 
  offset: true 
}).extend({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  per_page: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
});

/**
 * Supabase-based audit logger implementation
 * Writes audit events directly to the database
 */
class SupabaseAuditLogger extends BaseAuditLogger {

  protected async writeEvent(event: CreateAuditEvent): Promise<void> {
    try {
      await insertAuditEvent({
        ...event,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(`Failed to write audit event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected async writeBatch(events: CreateAuditEvent[]): Promise<void> {
    const eventsWithTimestamp = events.map(event => ({
      ...event,
      created_at: new Date().toISOString()
    }));

    try {
      await insertAuditEvents(eventsWithTimestamp);
    } catch (error) {
      throw new Error(`Failed to write audit event batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Global audit logger instance
const auditLogger = new SupabaseAuditLogger();

// =====================================================
// ROUTE HANDLERS
// =====================================================

/**
 * GET /api/audit-events - List audit events with filtering and pagination
 * Supports filtering by workflow, client, actor, and time ranges
 */
auditEvents.get('/', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser;
    const rawQuery = c.req.query();

    // Validate query parameters
    const queryResult = listAuditEventsSchema.safeParse(rawQuery);
    if (!queryResult.success) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: JSON.stringify(queryResult.error.issues),
          timestamp: new Date().toISOString()
        }
      }, 400);
    }

    const {
      workflow_id,
      client_id,
      actor_type,
      actor_id,
      event_type,
      action,
      resource_type,
      resource_id,
      from_date,
      to_date,
      page,
      per_page
    } = queryResult.data;

    // Build query with filters
    let query = supabase
      .from('audit_events')
      .select(`
        id,
        actor_type,
        actor_id,
        actor_name,
        event_type,
        action,
        resource_type,
        resource_id,
        workflow_id,
        client_id,
        event_data,
        created_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (workflow_id) query = query.eq('workflow_id', workflow_id);
    if (client_id) query = query.eq('client_id', client_id);
    if (actor_type) query = query.eq('actor_type', actor_type);
    if (actor_id) query = query.eq('actor_id', actor_id);
    if (event_type) query = query.eq('event_type', event_type);
    if (action) query = query.eq('action', action);
    if (resource_type) query = query.eq('resource_type', resource_type);
    if (resource_id) query = query.eq('resource_id', resource_id);
    if (from_date) query = query.gte('created_at', from_date);
    if (to_date) query = query.lte('created_at', to_date);

    // Apply pagination
    const offset = (page - 1) * per_page;
    query = query.range(offset, offset + per_page - 1);

    const { data: auditEvents, error, count } = await query;

    if (error) {
      console.error('Failed to fetch audit events:', error);
      return c.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch audit events',
          timestamp: new Date().toISOString()
        }
      }, 500);
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / per_page);

    return c.json({
      success: true,
      data: {
        data: auditEvents || [],
        pagination: {
          page,
          limit: per_page,
          total: count || 0,
          totalPages: totalPages
        }
      }
    });

  } catch (error) {
    console.error('Audit events list error:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

/**
 * POST /api/audit-events - Create a new audit event
 * Allows manual creation of audit events for specific scenarios
 */
auditEvents.post('/', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const body = await c.req.json();

    // Validate request body
    const eventResult = CreateAuditEventSchema.safeParse(body);
    if (!eventResult.success) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid audit event data',
          details: JSON.stringify(eventResult.error.issues),
          timestamp: new Date().toISOString()
        }
      }, 400);
    }

    const auditEvent = eventResult.data;

    // Log the audit event
    await auditLogger.log(auditEvent);

    return c.json({
      success: true,
      data: auditEvent,
      message: 'Audit event created successfully'
    }, 201);

  } catch (error) {
    console.error('Audit event creation error:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create audit event',
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

/**
 * POST /api/audit-events/batch - Create multiple audit events in batch
 * Optimized for bulk audit logging operations
 */
auditEvents.post('/batch', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const body = await c.req.json();

    // Validate that body is an array
    if (!Array.isArray(body)) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body must be an array of audit events',
          timestamp: new Date().toISOString()
        }
      }, 400);
    }

    // Validate each audit event in the batch
    const validationResults = body.map((event, index) => ({
      index,
      result: CreateAuditEventSchema.safeParse(event)
    }));

    const invalidEvents = validationResults.filter(v => !v.result.success);
    if (invalidEvents.length > 0) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid audit events in batch',
          details: JSON.stringify(invalidEvents.map(v => ({
            index: v.index,
            errors: v.result.error?.issues
          }))),
          timestamp: new Date().toISOString()
        }
      }, 400);
    }

    const auditEvents = validationResults.map(v => v.result.data!);

    // Log the batch of audit events
    await auditLogger.logBatch(auditEvents);

    return c.json({
      success: true,
      data: {
        count: auditEvents.length,
        events: auditEvents
      },
      message: 'Audit events batch created successfully'
    }, 201);

  } catch (error) {
    console.error('Audit events batch creation error:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create audit events batch',
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

/**
 * GET /api/audit-events/workflow/:id - Get audit trail for a specific workflow
 * Convenience endpoint for workflow-specific audit history
 */
auditEvents.get('/workflow/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser;
    const workflowId = c.req.param('id');

    // Validate workflow ID format
    if (!workflowId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid workflow ID format',
          timestamp: new Date().toISOString()
        }
      }, 400);
    }

    const { data: auditEvents, error } = await supabase
      .from('audit_events')
      .select(`
        id,
        actor_type,
        actor_id,
        actor_name,
        event_type,
        action,
        resource_type,
        resource_id,
        workflow_id,
        client_id,
        event_data,
        created_at
      `)
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false })
      .limit(200); // Reasonable limit for workflow audit trail

    if (error) {
      console.error('Failed to fetch workflow audit events:', error);
      return c.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch workflow audit events',
          timestamp: new Date().toISOString()
        }
      }, 500);
    }

    return c.json({
      success: true,
      data: {
        workflow_id: workflowId,
        audit_trail: auditEvents || []
      }
    });

  } catch (error) {
    console.error('Workflow audit trail error:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

/**
 * GET /api/audit-events/stats - Get audit event statistics
 * Provides summary statistics for monitoring and analytics
 */
auditEvents.get('/stats', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser;

    // Get event counts by type for the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: stats, error } = await supabase
      .from('audit_events')
      .select('event_type, actor_type')
      .gte('created_at', twentyFourHoursAgo);

    if (error) {
      console.error('Failed to fetch audit stats:', error);
      return c.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch audit statistics',
          timestamp: new Date().toISOString()
        }
      }, 500);
    }

    // Calculate statistics
    const eventTypeStats = stats?.reduce((acc: Record<string, number>, event: any) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const actorTypeStats = stats?.reduce((acc: Record<string, number>, event: any) => {
      acc[event.actor_type] = (acc[event.actor_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return c.json({
      success: true,
      data: {
        period: '24_hours',
        total_events: stats?.length || 0,
        events_by_type: eventTypeStats,
        events_by_actor: actorTypeStats,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Audit stats error:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Export the audit logger instance for use in other parts of the API
 * This allows other routes to easily log audit events
 */
export { auditLogger };

/**
 * Export the audit events router
 */
export { auditEvents };