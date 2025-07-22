/**
 * Communications Routes for Rexera API
 * 
 * Handles all communication-related endpoints (email, phone, SMS, internal notes)
 */

import { Hono } from 'hono';
import { createServerClient } from '../utils/database';
import { getCompanyFilter, clientDataMiddleware, type AuthUser } from '../middleware';
import { 
  CommunicationFiltersSchema,
  CreateCommunicationSchema,
  UpdateCommunicationSchema,
  ReplyCommunicationSchema,
  ForwardCommunicationSchema,
  EmailThreadSchema
} from '@rexera/shared';

const communications = new Hono();

// Apply client data middleware to all communication routes (except in test mode)
if (process.env.NODE_ENV !== 'test') {
  communications.use('*', clientDataMiddleware);
}

// GET /api/communications - List communications with filters and pagination
communications.get('/', async (c) => {
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
    const result = CommunicationFiltersSchema.safeParse(rawQuery);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues,
      }, 400 as any);
    }
    
    const {
      workflow_id,
      thread_id,
      communication_type,
      direction,
      status,
      sender_id,
      page,
      limit,
      include,
      sortBy,
      sortDirection
    } = result.data;

    // Build the query
    let query = supabase
      .from('communications')
      .select(`
        *,
        ${include.includes('email_metadata') ? 'email_metadata (*),' : ''}
        ${include.includes('phone_metadata') ? 'phone_metadata (*),' : ''}
        ${include.includes('sender') ? 'user_profiles!sender_id (id, full_name, email),' : ''}
        ${include.includes('workflow') ? 'workflows!workflow_id (id, title, workflow_type)' : ''}
      `.replace(/,\s*$/, '')) // Remove trailing comma
      .order(sortBy, { ascending: sortDirection === 'asc' });

    // Apply filters
    if (workflow_id) {
      query = query.eq('workflow_id', workflow_id);
    }
    
    if (thread_id) {
      query = query.eq('thread_id', thread_id);
    }
    
    if (communication_type) {
      query = query.eq('communication_type', communication_type);
    }
    
    if (direction) {
      query = query.eq('direction', direction);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (sender_id) {
      query = query.eq('sender_id', sender_id);
    }

    // Apply company filter for client users
    const companyFilter = getCompanyFilter(user);
    if (companyFilter && workflow_id) {
      // For communications, we need to filter by workflow's client_id
      const workflowQuery = await supabase
        .from('workflows')
        .select('client_id')
        .eq('id', workflow_id)
        .single();
        
      if (workflowQuery.error || !workflowQuery.data) {
        return c.json({
          success: false,
          error: 'Workflow not found',
        }, 404 as any);
      }
      
      // Note: In simplified auth, companyFilter returns null so this won't execute
      // but kept for future compatibility
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('communications')
      .select('*', { count: 'exact', head: true });
      
    // Apply same filters to count query
    if (workflow_id) countQuery = countQuery.eq('workflow_id', workflow_id);
    if (thread_id) countQuery = countQuery.eq('thread_id', thread_id);
    if (communication_type) countQuery = countQuery.eq('communication_type', communication_type);
    if (direction) countQuery = countQuery.eq('direction', direction);
    if (status) countQuery = countQuery.eq('status', status);
    if (sender_id) countQuery = countQuery.eq('sender_id', sender_id);

    const { count } = await countQuery;

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: communications, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch communications',
        details: error.message,
      }, 500 as any);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return c.json({
      success: true,
      data: communications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    });

  } catch (error) {
    console.error('Communications list error:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
    }, 500 as any);
  }
});

// GET /api/communications/threads - Get email threads summary
communications.get('/threads', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: 'test-user', 
      email: 'test@example.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL', 
      company_id: undefined 
    };

    const workflow_id = c.req.query('workflow_id');
    
    if (!workflow_id) {
      return c.json({
        success: false,
        error: 'workflow_id is required',
      }, 400 as any);
    }

    // Build query to get thread summaries
    const { data: communications, error } = await supabase
      .from('communications')
      .select(`
        id,
        thread_id,
        subject,
        recipient_email,
        direction,
        status,
        created_at,
        updated_at,
        sender_id,
        user_profiles!sender_id (full_name, email)
      `)
      .eq('workflow_id', workflow_id)
      .eq('communication_type', 'email')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch email threads',
        details: error.message,
      }, 500 as any);
    }

    // Group communications into threads
    const threadsMap = new Map<string, any>();
    
    communications?.forEach((comm: any) => {
      const threadKey = comm.thread_id || comm.id;
      
      if (!threadsMap.has(threadKey)) {
        threadsMap.set(threadKey, {
          thread_id: threadKey,
          subject: comm.subject,
          communication_count: 0,
          last_activity: comm.created_at,
          participants: new Set<string>(),
          has_unread: false,
          workflow_id: workflow_id,
          communications: []
        });
      }
      
      const thread = threadsMap.get(threadKey);
      thread.communications.push(comm);
      thread.communication_count++;
      
      // Update last activity if this communication is newer
      if (new Date(comm.created_at) > new Date(thread.last_activity)) {
        thread.last_activity = comm.created_at;
      }
      
      // Add participants
      if (comm.direction === 'INBOUND' && Array.isArray(comm.user_profiles) && comm.user_profiles[0]?.email) {
        thread.participants.add(comm.user_profiles[0].email);
      }
      if (comm.recipient_email) {
        thread.participants.add(comm.recipient_email);
      }
      
      // Check for unread messages (basic implementation)
      if (comm.direction === 'INBOUND' && comm.status !== 'READ') {
        thread.has_unread = true;
      }
    });

    // Convert threads to array and format
    const threads = Array.from(threadsMap.values()).map(thread => ({
      thread_id: thread.thread_id,
      subject: thread.subject || '(No Subject)',
      communication_count: thread.communication_count,
      last_activity: thread.last_activity,
      participants: Array.from(thread.participants),
      has_unread: thread.has_unread,
      workflow_id: thread.workflow_id
    })).sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime());

    return c.json({
      success: true,
      data: threads,
    });

  } catch (error) {
    console.error('Email threads error:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
    }, 500 as any);
  }
});

// POST /api/communications - Create new communication
communications.post('/', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: 'test-user', 
      email: 'test@example.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL', 
      company_id: undefined 
    };
    
    const body = await c.req.json();
    const result = CreateCommunicationSchema.safeParse(body);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400 as any);
    }
    
    const data = result.data;

    // Generate thread_id if not provided (for new conversations)
    const thread_id = data.thread_id || crypto.randomUUID();

    // Insert communication record
    const { data: communication, error: commError } = await supabase
      .from('communications')
      .insert({
        workflow_id: data.workflow_id,
        thread_id: thread_id,
        sender_id: user.id,
        recipient_email: data.recipient_email,
        subject: data.subject,
        body: data.body,
        communication_type: data.communication_type,
        direction: data.direction,
        status: data.direction === 'OUTBOUND' ? 'SENT' : 'DELIVERED',
        metadata: data.metadata,
      })
      .select()
      .single();

    if (commError) {
      console.error('Database error:', commError);
      return c.json({
        success: false,
        error: 'Failed to create communication',
        details: commError.message,
      }, 500 as any);
    }

    // Insert email metadata if provided
    if (data.email_metadata && data.communication_type === 'email') {
      const { error: emailError } = await supabase
        .from('email_metadata')
        .insert({
          communication_id: communication.id,
          message_id: data.email_metadata.message_id,
          in_reply_to: data.email_metadata.in_reply_to,
          email_references: data.email_metadata.email_references,
          attachments: data.email_metadata.attachments,
          headers: data.email_metadata.headers,
        });

      if (emailError) {
        console.error('Email metadata error:', emailError);
        // Continue - don't fail the whole request for metadata issues
      }
    }

    // Insert phone metadata if provided
    if (data.phone_metadata && data.communication_type === 'phone') {
      const { error: phoneError } = await supabase
        .from('phone_metadata')
        .insert({
          communication_id: communication.id,
          phone_number: data.phone_metadata.phone_number,
          duration_seconds: data.phone_metadata.duration_seconds,
          call_recording_url: data.phone_metadata.call_recording_url,
          transcript: data.phone_metadata.transcript,
        });

      if (phoneError) {
        console.error('Phone metadata error:', phoneError);
        // Continue - don't fail the whole request for metadata issues
      }
    }

    return c.json({
      success: true,
      data: communication,
    }, 201 as any);

  } catch (error) {
    console.error('Create communication error:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
    }, 500 as any);
  }
});

// GET /api/communications/:id - Get single communication
communications.get('/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const id = c.req.param('id');
    
    const { data: communication, error } = await supabase
      .from('communications')
      .select(`
        *,
        email_metadata (*),
        phone_metadata (*),
        user_profiles!sender_id (id, full_name, email),
        workflows!workflow_id (id, title, workflow_type)
      `)
      .eq('id', id)
      .single();

    if (error || !communication) {
      return c.json({
        success: false,
        error: 'Communication not found',
      }, 404 as any);
    }

    return c.json({
      success: true,
      data: communication,
    });

  } catch (error) {
    console.error('Get communication error:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
    }, 500 as any);
  }
});

// PATCH /api/communications/:id - Update communication
communications.patch('/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const result = UpdateCommunicationSchema.safeParse(body);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400 as any);
    }
    
    const data = result.data;

    // Update communication record
    const { data: communication, error: commError } = await supabase
      .from('communications')
      .update({
        status: data.status,
        metadata: data.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (commError) {
      console.error('Database error:', commError);
      return c.json({
        success: false,
        error: 'Failed to update communication',
        details: commError.message,
      }, 500 as any);
    }

    return c.json({
      success: true,
      data: communication,
    });

  } catch (error) {
    console.error('Update communication error:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
    }, 500 as any);
  }
});

// POST /api/communications/:id/reply - Reply to communication
communications.post('/:id/reply', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: 'test-user', 
      email: 'test@example.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL', 
      company_id: undefined 
    };
    
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const result = ReplyCommunicationSchema.safeParse(body);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400 as any);
    }
    
    const data = result.data;

    // Get original communication
    const { data: originalComm, error: fetchError } = await supabase
      .from('communications')
      .select(`
        *,
        email_metadata (*)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !originalComm) {
      return c.json({
        success: false,
        error: 'Original communication not found',
      }, 404 as any);
    }

    // Create reply
    const { data: reply, error: replyError } = await supabase
      .from('communications')
      .insert({
        workflow_id: originalComm.workflow_id,
        thread_id: originalComm.thread_id || originalComm.id,
        sender_id: user.id,
        recipient_email: data.recipient_email,
        subject: originalComm.subject?.startsWith('Re:') 
          ? originalComm.subject 
          : `Re: ${originalComm.subject}`,
        body: data.body,
        communication_type: originalComm.communication_type,
        direction: 'OUTBOUND',
        status: 'SENT',
        metadata: data.metadata,
      })
      .select()
      .single();

    if (replyError) {
      console.error('Database error:', replyError);
      return c.json({
        success: false,
        error: 'Failed to create reply',
        details: replyError.message,
      }, 500 as any);
    }

    // Add email metadata for reply
    if (originalComm.communication_type === 'email') {
      const { error: emailError } = await supabase
        .from('email_metadata')
        .insert({
          communication_id: reply.id,
          message_id: `${reply.id}@rexera.com`,
          in_reply_to: originalComm.email_metadata?.[0]?.message_id || originalComm.id,
          email_references: [
            ...(originalComm.email_metadata?.[0]?.email_references || []),
            originalComm.email_metadata?.[0]?.message_id || originalComm.id
          ],
          attachments: [],
          headers: {},
        });

      if (emailError) {
        console.error('Email metadata error:', emailError);
      }
    }

    return c.json({
      success: true,
      data: reply,
    }, 201 as any);

  } catch (error) {
    console.error('Reply communication error:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
    }, 500 as any);
  }
});

// POST /api/communications/:id/forward - Forward communication
communications.post('/:id/forward', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: 'test-user', 
      email: 'test@example.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL', 
      company_id: undefined 
    };
    
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const result = ForwardCommunicationSchema.safeParse(body);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400 as any);
    }
    
    const data = result.data;

    // Get original communication
    const { data: originalComm, error: fetchError } = await supabase
      .from('communications')
      .select(`
        *,
        email_metadata (*)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !originalComm) {
      return c.json({
        success: false,
        error: 'Original communication not found',
      }, 404 as any);
    }

    // Create forward (new thread)
    const { data: forward, error: forwardError } = await supabase
      .from('communications')
      .insert({
        workflow_id: originalComm.workflow_id,
        thread_id: crypto.randomUUID(), // New thread for forwards
        sender_id: user.id,
        recipient_email: data.recipient_email,
        subject: data.subject,
        body: data.body,
        communication_type: originalComm.communication_type,
        direction: 'OUTBOUND',
        status: 'SENT',
        metadata: data.metadata,
      })
      .select()
      .single();

    if (forwardError) {
      console.error('Database error:', forwardError);
      return c.json({
        success: false,
        error: 'Failed to create forward',
        details: forwardError.message,
      }, 500 as any);
    }

    // Add email metadata for forward
    if (originalComm.communication_type === 'email') {
      const { error: emailError } = await supabase
        .from('email_metadata')
        .insert({
          communication_id: forward.id,
          message_id: `${forward.id}@rexera.com`,
          in_reply_to: null, // Forwards don't reply to original
          email_references: [],
          attachments: [],
          headers: {},
        });

      if (emailError) {
        console.error('Email metadata error:', emailError);
      }
    }

    return c.json({
      success: true,
      data: forward,
    }, 201 as any);

  } catch (error) {
    console.error('Forward communication error:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
    }, 500 as any);
  }
});

export default communications;