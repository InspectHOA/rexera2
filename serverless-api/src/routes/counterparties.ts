import { Hono } from 'hono';
import { createServerClient } from '../utils/database';
import { 
  insertCounterparty, 
  updateCounterparty, 
  deleteCounterparty,
  insertCounterpartyContact,
  updateCounterpartyContact,
  deleteCounterpartyContact
} from '../utils/type-safe-db';
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
  CounterpartyContactFiltersSchema,
  CreateCounterpartyContactSchema,
  UpdateCounterpartyContactSchema,
  CounterpartyContactRoleSchema,
  CounterpartyContactHelpers
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
    
    // Ensure pagination parameters are safe
    if (offset < 0) {
      return c.json({
        success: false,
        error: 'Invalid pagination parameters'
      }, 400);
    }
    
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
    
    // Apply pagination - ensure range is valid
    const rangeStart = Math.max(0, offset);
    const rangeEnd = rangeStart + limit - 1;
    query = query.range(rangeStart, rangeEnd);
    
    const { data, error, count } = await query;
    
    if (error) {
      // Handle "Requested range not satisfiable" as empty result set for pagination beyond data
      if (error.code === 'PGRST103') {
        return c.json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        });
      }
      
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
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return c.json({
        success: false,
        error: 'Invalid UUID format'
      }, 400);
    }
    
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
    
    let data;
    try {
      data = await insertCounterparty(validatedData);
    } catch (error) {
      console.error('Error creating counterparty:', error);
      return c.json({
        success: false,
        error: 'Failed to create counterparty',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
    
    // Log audit event for counterparty creation
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'counterparty_management',
        action: 'create',
        resource_type: 'counterparty',
        resource_id: data.id,
        event_data: {
          resource_name: data.name,
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
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return c.json({
        success: false,
        error: 'Invalid UUID format'
      }, 400);
    }
    
    const body = await c.req.json();
    
    const validatedData = UpdateCounterpartySchema.parse(body);
    
    // Add updated_at timestamp
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString()
    };
    
    const supabase = createServerClient();
    
    let data;
    try {
      data = await updateCounterparty(id, updateData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Check for "not found" error by code or message
      if ((error as { code?: string })?.code === 'PGRST116' || errorMessage.includes('PGRST116')) {
        return c.json({
          success: false,
          error: 'Counterparty not found'
        }, 404);
      }
      
      console.error('Error updating counterparty:', error);
      return c.json({
        success: false,
        error: 'Failed to update counterparty',
        details: errorMessage
      }, 500);
    }
    
    // Log audit event for counterparty update
    try {
      const user = c.get('user') as AuthUser;
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'counterparty_management',
        action: 'update',
        resource_type: 'counterparty',
        resource_id: data.id,
        event_data: {
          resource_name: data.name,
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
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return c.json({
        success: false,
        error: 'Invalid UUID format'
      }, 400);
    }
    
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
    
    try {
      await deleteCounterparty(id);
    } catch (error) {
      console.error('Error deleting counterparty:', error);
      return c.json({
        success: false,
        error: 'Failed to delete counterparty',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
    
    // Log audit event for counterparty deletion
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'counterparty_management',
        action: 'delete',
        resource_type: 'counterparty',
        resource_id: counterparty.id,
        event_data: {
          resource_name: counterparty.name,
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

// =====================================================
// COUNTERPARTY CONTACTS ROUTES
// =====================================================

// GET /api/counterparties/:id/contacts - List contacts for a counterparty
counterparties.get('/:id/contacts', async (c) => {
  try {
    const counterpartyId = c.req.param('id');
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(counterpartyId)) {
      return c.json({
        success: false,
        error: 'Invalid UUID format'
      }, 400);
    }
    
    const queryParams = c.req.query();
    const filters = CounterpartyContactFiltersSchema.parse({
      ...queryParams,
      counterparty_id: counterpartyId
    });
    
    const supabase = createServerClient();
    
    // First check if counterparty exists
    const { data: counterparty, error: counterpartyError } = await supabase
      .from('counterparties')
      .select('id, type')
      .eq('id', counterpartyId)
      .single();
    
    if (counterpartyError || !counterparty) {
      return c.json({
        success: false,
        error: 'Counterparty not found'
      }, 404);
    }
    
    // Build query
    let query = supabase
      .from('counterparty_contacts')
      .select('*', { count: 'exact' })
      .eq('counterparty_id', counterpartyId);
    
    // Apply filters
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    
    if (filters.is_primary !== undefined) {
      query = query.eq('is_primary', filters.is_primary);
    }
    
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
    }
    
    // Apply sorting
    query = query.order(filters.sort, { ascending: filters.order === 'asc' });
    
    // Apply pagination
    const offset = (filters.page - 1) * filters.limit;
    query = query.range(offset, offset + filters.limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching counterparty contacts:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch contacts',
        details: error.message
      }, 500);
    }
    
    const totalPages = Math.ceil((count || 0) / filters.limit);
    
    return c.json({
      success: true,
      data: data || [],
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages
      }
    });
    
  } catch (error) {
    console.error('Error in GET /counterparties/:id/contacts:', error);
    return c.json({
      success: false,
      error: 'Invalid request parameters',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

// POST /api/counterparties/:id/contacts - Create new contact
counterparties.post('/:id/contacts', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const counterpartyId = c.req.param('id');
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(counterpartyId)) {
      return c.json({
        success: false,
        error: 'Invalid UUID format'
      }, 400);
    }
    
    const body = await c.req.json();
    const validatedData = CreateCounterpartyContactSchema.parse({
      ...body,
      counterparty_id: counterpartyId
    });
    
    const supabase = createServerClient();
    
    // Get counterparty details for validation and audit
    const { data: counterparty, error: counterpartyError } = await supabase
      .from('counterparties')
      .select('*')
      .eq('id', counterpartyId)
      .single();
    
    if (counterpartyError || !counterparty) {
      return c.json({
        success: false,
        error: 'Counterparty not found'
      }, 404);
    }
    
    // Validate role is appropriate for counterparty type
    if (!CounterpartyContactHelpers.isValidRoleForType(validatedData.role, counterparty.type)) {
      return c.json({
        success: false,
        error: `Role '${validatedData.role}' is not valid for counterparty type '${counterparty.type}'`,
        validRoles: CounterpartyContactHelpers.getSuggestedRoles(counterparty.type)
      }, 400);
    }
    
    // Create contact using type-safe helper
    const data = await insertCounterpartyContact(validatedData);
    
    // Log audit event
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'counterparty_management',
        action: 'create',
        resource_type: 'counterparty',
        resource_id: data.id,
        event_data: {
          resource_name: `${data.name} (${counterparty.name})`,
          counterparty_id: counterpartyId,
          counterparty_name: counterparty.name,
          contact_role: data.role,
          is_primary: data.is_primary
        }
      });
    } catch (auditError) {
      console.error('Failed to log audit event for contact creation:', auditError);
    }
    
    return c.json({
      success: true,
      data
    }, 201);
    
  } catch (error) {
    console.error('Error in POST /counterparties/:id/contacts:', error);
    return c.json({
      success: false,
      error: 'Invalid request data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

// GET /api/counterparties/:id/contacts/primary - Get primary contact
counterparties.get('/:id/contacts/primary', async (c) => {
  try {
    const counterpartyId = c.req.param('id');
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(counterpartyId)) {
      return c.json({
        success: false,
        error: 'Invalid UUID format'
      }, 400);
    }
    
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('counterparty_contacts')
      .select('*')
      .eq('counterparty_id', counterpartyId)
      .eq('is_primary', true)
      .eq('is_active', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: 'No primary contact found'
        }, 404);
      }
      
      console.error('Error fetching primary contact:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch primary contact',
        details: error.message
      }, 500);
    }
    
    return c.json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Error in GET /counterparties/:id/contacts/primary:', error);
    return c.json({
      success: false,
      error: 'Invalid request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

// GET /api/counterparties/:id/contacts/by-role/:role - Get contacts by role
counterparties.get('/:id/contacts/by-role/:role', async (c) => {
  try {
    const counterpartyId = c.req.param('id');
    const role = c.req.param('role');
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(counterpartyId)) {
      return c.json({
        success: false,
        error: 'Invalid UUID format'
      }, 400);
    }
    
    // Validate role
    const roleValidation = CounterpartyContactRoleSchema.safeParse(role);
    if (!roleValidation.success) {
      return c.json({
        success: false,
        error: 'Invalid contact role',
        validRoles: CounterpartyContactRoleSchema._def.values
      }, 400);
    }
    
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('counterparty_contacts')
      .select('*')
      .eq('counterparty_id', counterpartyId)
      .eq('role', role)
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching contacts by role:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch contacts',
        details: error.message
      }, 500);
    }
    
    return c.json({
      success: true,
      data: data || []
    });
    
  } catch (error) {
    console.error('Error in GET /counterparties/:id/contacts/by-role/:role:', error);
    return c.json({
      success: false,
      error: 'Invalid request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

// GET /api/counterparties/:id/contacts/:contactId - Get specific contact
counterparties.get('/:id/contacts/:contactId', async (c) => {
  try {
    const counterpartyId = c.req.param('id');
    const contactId = c.req.param('contactId');
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(counterpartyId) || !uuidRegex.test(contactId)) {
      return c.json({
        success: false,
        error: 'Invalid UUID format'
      }, 400);
    }
    
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('counterparty_contacts')
      .select('*')
      .eq('id', contactId)
      .eq('counterparty_id', counterpartyId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: 'Contact not found'
        }, 404);
      }
      
      console.error('Error fetching contact:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch contact',
        details: error.message
      }, 500);
    }
    
    return c.json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Error in GET /counterparties/:id/contacts/:contactId:', error);
    return c.json({
      success: false,
      error: 'Invalid request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

// PATCH /api/counterparties/:id/contacts/:contactId - Update contact
counterparties.patch('/:id/contacts/:contactId', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const counterpartyId = c.req.param('id');
    const contactId = c.req.param('contactId');
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(counterpartyId) || !uuidRegex.test(contactId)) {
      return c.json({
        success: false,
        error: 'Invalid UUID format'
      }, 400);
    }
    
    const body = await c.req.json();
    const validatedData = UpdateCounterpartyContactSchema.parse(body);
    
    const supabase = createServerClient();
    
    // Verify contact belongs to counterparty
    const { data: existingContact, error: fetchError } = await supabase
      .from('counterparty_contacts')
      .select(`
        *,
        counterparties!counterparty_id (
          id,
          name,
          type
        )
      `)
      .eq('id', contactId)
      .eq('counterparty_id', counterpartyId)
      .single();
    
    if (fetchError || !existingContact) {
      return c.json({
        success: false,
        error: 'Contact not found'
      }, 404);
    }
    
    // Validate role if being updated
    if (validatedData.role && !CounterpartyContactHelpers.isValidRoleForType(validatedData.role, existingContact.counterparties.type)) {
      return c.json({
        success: false,
        error: `Role '${validatedData.role}' is not valid for counterparty type '${existingContact.counterparties.type}'`,
        validRoles: CounterpartyContactHelpers.getSuggestedRoles(existingContact.counterparties.type)
      }, 400);
    }
    
    // Add updated_at timestamp
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString()
    };
    
    // Update contact using type-safe helper
    const data = await updateCounterpartyContact(contactId, updateData);
    
    // Log audit event
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'counterparty_management',
        action: 'update',
        resource_type: 'counterparty',
        resource_id: contactId,
        event_data: {
          resource_name: `${data.name} (${existingContact.counterparties.name})`,
          counterparty_id: counterpartyId,
          counterparty_name: existingContact.counterparties.name,
          updated_fields: Object.keys(validatedData),
          contact_role: data.role
        }
      });
    } catch (auditError) {
      console.error('Failed to log audit event for contact update:', auditError);
    }
    
    return c.json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Error in PATCH /counterparties/:id/contacts/:contactId:', error);
    return c.json({
      success: false,
      error: 'Invalid request data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

// DELETE /api/counterparties/:id/contacts/:contactId - Delete contact
counterparties.delete('/:id/contacts/:contactId', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const counterpartyId = c.req.param('id');
    const contactId = c.req.param('contactId');
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(counterpartyId) || !uuidRegex.test(contactId)) {
      return c.json({
        success: false,
        error: 'Invalid UUID format'
      }, 400);
    }
    
    const supabase = createServerClient();
    
    // Get contact details before deletion for audit
    const { data: contact, error: fetchError } = await supabase
      .from('counterparty_contacts')
      .select(`
        *,
        counterparties!counterparty_id (
          id,
          name
        )
      `)
      .eq('id', contactId)
      .eq('counterparty_id', counterpartyId)
      .single();
    
    if (fetchError || !contact) {
      return c.json({
        success: false,
        error: 'Contact not found'
      }, 404);
    }
    
    // Check if this is the only contact
    const { count } = await supabase
      .from('counterparty_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('counterparty_id', counterpartyId);
    
    if (count === 1) {
      return c.json({
        success: false,
        error: 'Cannot delete the only contact for a counterparty'
      }, 409);
    }
    
    // Delete contact using type-safe helper
    await deleteCounterpartyContact(contactId);
    
    // Log audit event
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'counterparty_management',
        action: 'delete',
        resource_type: 'counterparty',
        resource_id: contactId,
        event_data: {
          resource_name: `${contact.name} (${contact.counterparties.name})`,
          counterparty_id: counterpartyId,
          counterparty_name: contact.counterparties.name,
          contact_role: contact.role,
          was_primary: contact.is_primary
        }
      });
    } catch (auditError) {
      console.error('Failed to log audit event for contact deletion:', auditError);
    }
    
    return c.json({
      success: true,
      message: 'Contact deleted successfully'
    });
    
  } catch (error) {
    console.error('Error in DELETE /counterparties/:id/contacts/:contactId:', error);
    return c.json({
      success: false,
      error: 'Invalid request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 400);
  }
});

export default counterparties;