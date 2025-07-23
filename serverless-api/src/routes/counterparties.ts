import { Hono } from 'hono';
import { createServerClient } from '../utils/database';
import { type AuthUser, clientDataMiddleware } from '../middleware';
import {
  CounterpartyFiltersSchema,
  CounterpartySearchSchema,
  CreateCounterpartySchema,
  UpdateCounterpartySchema,
  WorkflowCounterpartyFiltersSchema,
  CreateWorkflowCounterpartySchema,
  UpdateWorkflowCounterpartySchema,
  AuditHelpers,
} from '@rexera/shared';
import { auditLogger } from './audit-events';

const counterparties = new Hono();

// Apply middleware (except in test mode)
if (process.env.NODE_ENV !== 'test') {
  counterparties.use('*', clientDataMiddleware);
}

// GET /api/counterparties - List counterparties with filtering and pagination
counterparties.get('/', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const queryParams = c.req.query();
    
    const filters = CounterpartyFiltersSchema.parse(queryParams);
    const { type, search, page, limit, sort, order, include } = filters;
    
    const supabase = createServerClient();
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('counterparties')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching counterparties:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch counterparties',
        details: error.message
      }, 500);
    }
    
    // If include workflows is requested, fetch workflow relationships
    if (include === 'workflows' && data) {
      const counterpartyIds = data.map(cp => cp.id);
      const { data: workflowData } = await supabase
        .from('workflow_counterparties')
        .select('counterparty_id, workflow_id, status, created_at, updated_at')
        .in('counterparty_id', counterpartyIds);
      
      // Attach lean workflow relationship data to counterparties
      data.forEach(counterparty => {
        const relationships = workflowData?.filter(wc => wc.counterparty_id === counterparty.id) || [];
        counterparty.workflows = relationships.map(rel => ({
          workflow_id: rel.workflow_id,
          status: rel.status,
          created_at: rel.created_at,
          updated_at: rel.updated_at
        }));
      });
    }
    
    const totalPages = Math.ceil((count || 0) / limit);
    
    return c.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    });
    
  } catch (error) {
    console.error('Error in GET /counterparties:', error);
    return c.json({
      success: false,
      error: 'Invalid request parameters',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

// GET /api/counterparties/search - Search counterparties by query string and type
counterparties.get('/search', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const queryParams = c.req.query();
    
    const filters = CounterpartySearchSchema.parse(queryParams);
    const { q, type, limit } = filters;
    
    const supabase = createServerClient();
    
    // Build query with enhanced search capabilities
    let query = supabase
      .from('counterparties')
      .select('id, name, type, email, phone, address')
      .limit(limit);
    
    // Apply type filter if specified
    if (type) {
      query = query.eq('type', type);
    }
    
    // Apply comprehensive search across multiple fields
    // Search in name, email, and address fields with case-insensitive matching
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,address.ilike.%${q}%`);
    
    // Order by relevance: exact name matches first, then partial matches
    query = query.order('name', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error searching counterparties:', error);
      return c.json({
        success: false,
        error: 'Failed to search counterparties',
        details: error.message
      }, 500);
    }
    
    // Post-process results for better relevance ranking
    const results = (data || []).sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(q.toLowerCase());
      const bNameMatch = b.name.toLowerCase().includes(q.toLowerCase());
      
      // Prioritize name matches over email/address matches
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      // For same match type, sort alphabetically
      return a.name.localeCompare(b.name);
    });
    
    return c.json({
      success: true,
      data: results,
      meta: {
        query: q,
        type: type || null,
        total: results.length,
        limit
      }
    });
    
  } catch (error) {
    console.error('Error in GET /counterparties/search:', error);
    return c.json({
      success: false,
      error: 'Invalid search parameters',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

// GET /api/counterparties/types - Get available counterparty types
counterparties.get('/types', async (c) => {
  const types = [
    { value: 'hoa', label: 'HOA' },
    { value: 'lender', label: 'Lender' },
    { value: 'municipality', label: 'Municipality' },
    { value: 'utility', label: 'Utility' },
    { value: 'tax_authority', label: 'Tax Authority' }
  ];
  
  return c.json({
    success: true,
    data: types
  });
});

// GET /api/counterparties/:id - Get single counterparty
counterparties.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const queryParams = c.req.query();
    const { include } = CounterpartyFiltersSchema.pick({ include: true }).parse(queryParams);
    
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('counterparties')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: 'Counterparty not found'
        }, 404);
      }
      
      console.error('Error fetching counterparty:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch counterparty',
        details: error.message
      }, 500);
    }
    
    // If include workflows is requested, fetch workflow relationships
    if (include === 'workflows') {
      const { data: workflowData } = await supabase
        .from('workflow_counterparties')
        .select('workflow_id, status, created_at, updated_at')
        .eq('counterparty_id', id);
      
      // Transform to lean workflow relationship format
      data.workflows = workflowData?.map(rel => ({
        workflow_id: rel.workflow_id,
        status: rel.status,
        created_at: rel.created_at,
        updated_at: rel.updated_at
      })) || [];
    }
    
    return c.json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Error in GET /counterparties/:id:', error);
    return c.json({
      success: false,
      error: 'Invalid request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

// POST /api/counterparties - Create new counterparty
counterparties.post('/', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const body = await c.req.json();
    
    const validatedData = CreateCounterpartySchema.parse(body);
    
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('counterparties')
      .insert([validatedData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating counterparty:', error);
      return c.json({
        success: false,
        error: 'Failed to create counterparty',
        details: error.message
      }, 500);
    }
    
    // Log audit event for counterparty creation
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'counterparty',
        action: 'create',
        resource_type: 'counterparty',
        resource_id: data.id,
        resource_name: data.name,
        details: {
          counterparty_type: data.type,
          has_email: !!data.email,
          has_phone: !!data.phone,
          has_address: !!data.address
        }
      });
    } catch (auditError) {
      console.error('Failed to log audit event for counterparty creation:', auditError);
      // Don't fail the request for audit errors
    }
    
    return c.json({
      success: true,
      data
    }, 201);
    
  } catch (error) {
    console.error('Error in POST /counterparties:', error);
    return c.json({
      success: false,
      error: 'Invalid request data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

// PATCH /api/counterparties/:id - Update counterparty
counterparties.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const validatedData = UpdateCounterpartySchema.parse(body);
    
    // Add updated_at timestamp
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString()
    };
    
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('counterparties')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: 'Counterparty not found'
        }, 404);
      }
      
      console.error('Error updating counterparty:', error);
      return c.json({
        success: false,
        error: 'Failed to update counterparty',
        details: error.message
      }, 500);
    }
    
    // Log audit event for counterparty update
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'counterparty',
        action: 'update',
        resource_type: 'counterparty',
        resource_id: data.id,
        resource_name: data.name,
        details: {
          updated_fields: Object.keys(validatedData),
          counterparty_type: data.type
        }
      });
    } catch (auditError) {
      console.error('Failed to log audit event for counterparty update:', auditError);
      // Don't fail the request for audit errors
    }
    
    return c.json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Error in PATCH /counterparties/:id:', error);
    return c.json({
      success: false,
      error: 'Invalid request data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

// DELETE /api/counterparties/:id - Delete counterparty
counterparties.delete('/:id', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const id = c.req.param('id');
    
    const supabase = createServerClient();
    
    // Get counterparty details before deletion for audit logging
    const { data: counterparty, error: fetchError } = await supabase
      .from('counterparties')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return c.json({
          success: false,
          error: 'Counterparty not found'
        }, 404);
      }
      console.error('Error fetching counterparty for deletion:', fetchError);
      return c.json({
        success: false,
        error: 'Failed to verify counterparty exists'
      }, 500);
    }
    
    // Check if counterparty has active workflow relationships
    const { data: workflowRels, error: checkError } = await supabase
      .from('workflow_counterparties')
      .select('id')
      .eq('counterparty_id', id)
      .limit(1);
    
    if (checkError) {
      console.error('Error checking workflow relationships:', checkError);
      return c.json({
        success: false,
        error: 'Failed to check counterparty relationships'
      }, 500);
    }
    
    if (workflowRels && workflowRels.length > 0) {
      return c.json({
        success: false,
        error: 'Cannot delete counterparty with active workflow relationships'
      }, 409);
    }
    
    const { error } = await supabase
      .from('counterparties')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting counterparty:', error);
      return c.json({
        success: false,
        error: 'Failed to delete counterparty',
        details: error.message
      }, 500);
    }
    
    // Log audit event for counterparty deletion
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'counterparty',
        action: 'delete',
        resource_type: 'counterparty',
        resource_id: counterparty.id,
        resource_name: counterparty.name,
        details: {
          counterparty_type: counterparty.type,
          had_email: !!counterparty.email,
          had_phone: !!counterparty.phone,
          had_address: !!counterparty.address
        }
      });
    } catch (auditError) {
      console.error('Failed to log audit event for counterparty deletion:', auditError);
      // Don't fail the request for audit errors
    }
    
    return c.json({
      success: true,
      message: 'Counterparty deleted successfully'
    });
    
  } catch (error) {
    console.error('Error in DELETE /counterparties/:id:', error);
    return c.json({
      success: false,
      error: 'Invalid request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

export default counterparties;