/**
 * HIL Notes Routes for Rexera API
 * 
 * Handles all HIL note-related endpoints with mentions and notifications
 */

import { Hono } from 'hono';
import { createServerClient } from '../utils/database';
import { insertNotifications, insertHilNote } from '../utils/type-safe-db';
import { getCompanyFilter, clientDataMiddleware, type AuthUser } from '../middleware';
import { 
  HilNoteFiltersSchema,
  CreateHilNoteSchema,
  UpdateHilNoteSchema,
  ReplyHilNoteSchema
} from '@rexera/shared';
import { auditLogger } from './audit-events';

const hilNotes = new Hono();

// Apply client data middleware to all routes (except in test mode)
if (process.env.NODE_ENV !== 'test') {
  hilNotes.use('*', clientDataMiddleware);
}

// GET /api/hil-notes - List notes for a workflow
hilNotes.get('/', async (c) => {
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
    
    // Handle boolean conversion for is_resolved parameter
    const processedQuery = {
      ...rawQuery,
      is_resolved: rawQuery.is_resolved === 'true' ? true : rawQuery.is_resolved === 'false' ? false : undefined
    };
    
    const result = HilNoteFiltersSchema.safeParse(processedQuery);
    
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues,
      }, 400);
    }
    
    const {
      workflow_id,
      is_resolved,
      priority,
      author_id,
      parent_note_id,
      include,
      page = 1,
      limit = 50
    } = result.data;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Build the select query dynamically
    let selectQuery = '*';
    
    if (include?.includes('author')) {
      selectQuery += ', author:user_profiles!hil_notes_author_id_fkey (id, full_name, email)';
    }

    let query = supabase
      .from('hil_notes')
      .select(selectQuery, { count: 'exact' })
      .eq('workflow_id', workflow_id)
      .order('created_at', { ascending: true });

    // Apply filters
    if (is_resolved !== undefined) {
      query = query.eq('is_resolved', is_resolved);
    }
    
    if (priority) {
      query = query.eq('priority', priority);
    }
    
    if (author_id) {
      query = query.eq('author_id', author_id);
    }
    
    if (parent_note_id !== undefined) {
      query = query.eq('parent_note_id', parent_note_id);
    } else {
      // Default to top-level notes only (no parent)
      query = query.is('parent_note_id', null);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: notes, error, count } = await query;

    if (error) {
      console.error('Error fetching HIL notes:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch notes',
        details: error
      }, 500);
    }

    let processedNotes = notes || [];

    // If replies are requested, fetch them separately
    if (include?.includes('replies') && processedNotes.length > 0) {
      const noteIds = processedNotes.map((note: any) => note.id);
      
      let repliesQuery = supabase
        .from('hil_notes')
        .select('*' + (include?.includes('author') ? ', author:user_profiles!hil_notes_author_id_fkey (id, full_name, email)' : ''))
        .in('parent_note_id', noteIds)
        .order('created_at', { ascending: true });

      const { data: replies, error: repliesError } = await repliesQuery;

      if (repliesError) {
        console.error('Error fetching replies:', repliesError);
        // Continue without replies rather than failing
      } else {
        // Group replies by parent note ID
        const repliesByParent: Record<string, any[]> = (replies || []).reduce((acc: Record<string, any[]>, reply: any) => {
          if (!acc[reply.parent_note_id]) {
            acc[reply.parent_note_id] = [];
          }
          acc[reply.parent_note_id].push(reply);
          return acc;
        }, {});

        // Add replies to their parent notes
        processedNotes = processedNotes.map((note: any) => ({
          ...note,
          replies: repliesByParent[note.id] || []
        }));
      }
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit);

    return c.json({
      success: true,
      data: processedNotes,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Unexpected error in HIL notes list:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// GET /api/hil-notes/:id - Get a single note by ID
hilNotes.get('/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: 'test-user', 
      email: 'test@example.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL', 
      company_id: undefined 
    };

    const noteId = c.req.param('id');
    const include = c.req.query('include');

    // Build the select query dynamically
    let selectQuery = '*';
    
    if (include?.includes('author')) {
      selectQuery += ', author:user_profiles!hil_notes_author_id_fkey (id, full_name, email)';
    }

    const { data: note, error } = await supabase
      .from('hil_notes')
      .select(selectQuery)
      .eq('id', noteId)
      .single();

    if (error || !note) {
      return c.json({
        success: false,
        error: 'Note not found'
      }, 404);
    }

    // If replies are requested, fetch them separately
    if (include?.includes('replies')) {
      let repliesQuery = supabase
        .from('hil_notes')
        .select('*' + (include?.includes('author') ? ', author:user_profiles!hil_notes_author_id_fkey (id, full_name, email)' : ''))
        .eq('parent_note_id', noteId)
        .order('created_at', { ascending: true });

      const { data: replies, error: repliesError } = await repliesQuery;

      if (!repliesError && replies) {
        (note as any).replies = replies;
      }
    }

    return c.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Unexpected error in HIL note byId:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// POST /api/hil-notes - Create a new note
hilNotes.post('/', async (c) => {
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
    const result = CreateHilNoteSchema.safeParse(body);

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request data',
        details: result.error.issues,
      }, 400);
    }

    const noteData = {
      ...result.data,
      author_id: user.id
    };

    // Create the note
    const { data: note, error: noteError } = await supabase
      .from('hil_notes')
      .insert(noteData)
      .select(`
        *,
        author:user_profiles!hil_notes_author_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .single();

    if (noteError) {
      console.error('Error creating HIL note:', noteError);
      return c.json({
        success: false,
        error: 'Failed to create note',
        details: noteError
      }, 500);
    }

    // Create notifications for mentioned users
    if (result.data.mentions && result.data.mentions.length > 0) {
      const notifications = result.data.mentions.map((mentionedUserId: string) => ({
        user_id: mentionedUserId,
        type: 'HIL_MENTION' as const,
        priority: result.data.priority || 'NORMAL',
        title: 'You were mentioned in a note',
        message: `${note.author?.name || 'Someone'} mentioned you in a ${result.data.priority} priority note`,
        metadata: {
          note_id: note.id,
          workflow_id: result.data.workflow_id,
          author_id: user.id,
          priority: result.data.priority
        }
      }));

      try {
        await insertNotifications(notifications);
      } catch (notificationError) {
        console.error('Error creating mention notifications:', notificationError);
        // Don't fail the request, just log the error
      }
    }

    // Log audit event for HIL note creation
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'communication',
        action: 'create',
        resource_type: 'communication',
        resource_id: note.id,
        workflow_id: result.data.workflow_id,
        event_data: {
          note_type: 'hil_note',
          priority: result.data.priority,
          content_length: result.data.content.length,
          mentions_count: result.data.mentions?.length || 0,
          is_resolved: false, // New notes are always unresolved
          operation: 'create_hil_note'
        }
      });
    } catch (auditError) {
      console.warn('Failed to log audit event for HIL note creation:', auditError);
      // Don't fail the request for audit errors
    }

    return c.json({
      success: true,
      data: note
    }, 201);
  } catch (error) {
    console.error('Unexpected error in HIL note creation:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// PATCH /api/hil-notes/:id - Update a note
hilNotes.patch('/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: 'test-user', 
      email: 'test@example.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL', 
      company_id: undefined 
    };

    const noteId = c.req.param('id');
    const body = await c.req.json();
    const result = UpdateHilNoteSchema.safeParse(body);

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request data',
        details: result.error.issues,
      }, 400);
    }

    // Check if note exists and user can edit it
    const { data: existingNote, error: fetchError } = await supabase
      .from('hil_notes')
      .select('author_id, mentions, priority, is_resolved, workflow_id')
      .eq('id', noteId)
      .single();

    if (fetchError || !existingNote) {
      return c.json({
        success: false,
        error: 'Note not found'
      }, 404);
    }

    // Only author can edit (could add admin check here)
    if (existingNote.author_id !== user.id) {
      return c.json({
        success: false,
        error: 'Unauthorized to edit this note'
      }, 403);
    }

    const updateData = {
      ...result.data,
      updated_at: new Date().toISOString()
    };

    const { data: updatedNote, error: updateError } = await supabase
      .from('hil_notes')
      .update(updateData)
      .eq('id', noteId)
      .select(`
        *,
        author:user_profiles!hil_notes_author_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating HIL note:', updateError);
      return c.json({
        success: false,
        error: 'Failed to update note',
        details: updateError
      }, 500);
    }

    // Handle new mentions if they changed
    if (result.data.mentions && result.data.mentions.length > 0) {
      const newMentions = result.data.mentions.filter(
        (userId: string) => !existingNote.mentions.includes(userId)
      );

      if (newMentions.length > 0) {
        const notifications = newMentions.map((mentionedUserId: string) => ({
          user_id: mentionedUserId,
          type: 'HIL_MENTION' as const,
          priority: updatedNote.priority || 'NORMAL',
          title: 'You were mentioned in an updated note',
          message: `${updatedNote.author?.name || 'Someone'} mentioned you in an updated note`,
          metadata: {
            note_id: updatedNote.id,
            workflow_id: updatedNote.workflow_id,
            author_id: user.id,
            priority: updatedNote.priority
          }
        }));

        const { error: notificationError } = await supabase
          .from('hil_notifications')
          .insert(notifications);

        if (notificationError) {
          console.error('Error creating mention notifications:', notificationError);
        }
      }
    }

    // Log audit event for HIL note update
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'communication',
        action: 'update',
        resource_type: 'communication',
        resource_id: noteId,
        workflow_id: existingNote.workflow_id,
        event_data: {
          note_type: 'hil_note',
          old_priority: existingNote.priority,
          new_priority: updatedNote.priority,
          old_resolved: existingNote.is_resolved,
          new_resolved: (result.data as any).is_resolved !== undefined ? (result.data as any).is_resolved : existingNote.is_resolved,
          content_length: result.data.content?.length,
          mentions_count: result.data.mentions?.length || 0,
          updated_fields: Object.keys(result.data),
          operation: 'update_hil_note'
        }
      });
    } catch (auditError) {
      console.warn('Failed to log audit event for HIL note update:', auditError);
      // Don't fail the request for audit errors
    }

    return c.json({
      success: true,
      data: updatedNote
    });
  } catch (error) {
    console.error('Unexpected error in HIL note update:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// POST /api/hil-notes/:id/reply - Reply to a note
hilNotes.post('/:id/reply', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: 'test-user', 
      email: 'test@example.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL', 
      company_id: undefined 
    };

    const parentId = c.req.param('id');
    const body = await c.req.json();
    const result = ReplyHilNoteSchema.safeParse(body);

    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request data',
        details: result.error.issues,
      }, 400);
    }

    // Get parent note to inherit workflow_id
    const { data: parentNote, error: parentError } = await supabase
      .from('hil_notes')
      .select('workflow_id, priority')
      .eq('id', parentId)
      .single();

    if (parentError || !parentNote) {
      return c.json({
        success: false,
        error: 'Parent note not found'
      }, 404);
    }

    const replyData = {
      workflow_id: parentNote.workflow_id,
      content: result.data.content,
      priority: parentNote.priority, // Inherit priority from parent
      mentions: result.data.mentions,
      parent_note_id: parentId,
      author_id: user.id
    };

    const { data: reply, error: replyError } = await supabase
      .from('hil_notes')
      .insert(replyData)
      .select(`
        *,
        author:user_profiles!hil_notes_author_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .single();

    if (replyError) {
      console.error('Error creating HIL note reply:', replyError);
      return c.json({
        success: false,
        error: 'Failed to create reply',
        details: replyError
      }, 500);
    }

    // Create notifications for mentions in reply
    if (result.data.mentions && result.data.mentions.length > 0) {
      const notifications = result.data.mentions.map((mentionedUserId: string) => ({
        user_id: mentionedUserId,
        type: 'HIL_MENTION' as const,
        priority: parentNote.priority || 'NORMAL',
        title: 'You were mentioned in a note reply',
        message: `${reply.author?.name || 'Someone'} mentioned you in a note reply`,
        metadata: {
          note_id: reply.id,
          workflow_id: parentNote.workflow_id,
          author_id: user.id,
          priority: parentNote.priority,
          parent_note_id: parentId
        }
      }));

      const { error: notificationError } = await supabase
        .from('hil_notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Error creating mention notifications:', notificationError);
      }
    }

    // Log audit event for HIL note reply
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'communication',
        action: 'create',
        resource_type: 'communication',
        resource_id: reply.id,
        workflow_id: parentNote.workflow_id,
        event_data: {
          note_type: 'hil_note_reply',
          parent_note_id: parentId,
          priority: parentNote.priority,
          content_length: result.data.content.length,
          mentions_count: result.data.mentions?.length || 0,
          operation: 'create_hil_note_reply'
        }
      });
    } catch (auditError) {
      console.warn('Failed to log audit event for HIL note reply:', auditError);
      // Don't fail the request for audit errors
    }

    return c.json({
      success: true,
      data: reply
    }, 201);
  } catch (error) {
    console.error('Unexpected error in HIL note reply:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// DELETE /api/hil-notes/:id - Delete a note
hilNotes.delete('/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser || { 
      id: 'test-user', 
      email: 'test@example.com', 
      user_type: 'hil_user' as const, 
      role: 'HIL', 
      company_id: undefined 
    };

    const noteId = c.req.param('id');

    // Check if note exists and user can delete it
    const { data: existingNote, error: fetchError } = await supabase
      .from('hil_notes')
      .select('author_id, workflow_id, priority, content, mentions')
      .eq('id', noteId)
      .single();

    if (fetchError || !existingNote) {
      return c.json({
        success: false,
        error: 'Note not found'
      }, 404);
    }

    // Only author can delete (could add admin check here)
    if (existingNote.author_id !== user.id) {
      return c.json({
        success: false,
        error: 'Unauthorized to delete this note'
      }, 403);
    }

    const { error: deleteError } = await supabase
      .from('hil_notes')
      .delete()
      .eq('id', noteId);

    if (deleteError) {
      console.error('Error deleting HIL note:', deleteError);
      return c.json({
        success: false,
        error: 'Failed to delete note',
        details: deleteError
      }, 500);
    }

    // Log audit event for HIL note deletion
    try {
      await auditLogger.log({
        actor_type: 'human',
        actor_id: user.id,
        actor_name: user.email,
        event_type: 'communication',
        action: 'delete',
        resource_type: 'communication',
        resource_id: noteId,
        workflow_id: existingNote.workflow_id,
        event_data: {
          note_type: 'hil_note',
          priority: existingNote.priority,
          content_length: existingNote.content.length,
          mentions_count: existingNote.mentions?.length || 0,
          operation: 'delete_hil_note'
        }
      });
    } catch (auditError) {
      console.warn('Failed to log audit event for HIL note deletion:', auditError);
      // Don't fail the request for audit errors
    }

    return c.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in HIL note deletion:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

export default hilNotes;