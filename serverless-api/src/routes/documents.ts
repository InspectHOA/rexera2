/**
 * Documents API Routes
 * 
 * Handles file management, deliverables, and workflow artifacts following
 * the established patterns from workflows, taskExecutions, and communications
 */

import { Hono } from 'hono';
import { createServerClient } from '../utils/database';
import { clientDataMiddleware, getCompanyFilter, type AuthUser } from '../middleware';
import {
  DocumentFiltersSchema,
  CreateDocumentSchema,
  UpdateDocumentSchema,
  CreateDocumentVersionSchema,
  type Document,
  type DocumentWithRelations
} from '@rexera/shared';

const documents = new Hono();

// Apply client data middleware (except in test mode)
if (process.env.NODE_ENV !== 'test') {
  documents.use('*', clientDataMiddleware);
}

/**
 * GET /api/documents
 * List documents with filtering and pagination
 */
documents.get('/', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser;
    
    if (!user) {
      return c.json({
        success: false,
        error: 'Authentication required',
      }, 401 as any);
    }
    const queryParams = c.req.query();
    
    // Validate query parameters
    const result = DocumentFiltersSchema.safeParse(queryParams);
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues,
      }, 400 as any);
    }

    const { 
      workflow_id,
      document_type,
      tags,
      status,
      page,
      limit,
      include,
      sortBy,
      sortDirection
    } = result.data;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Build query with relationships
    const includeFields = include ? include.split(',') : [];
    let selectFields = '*';
    
    if (includeFields.includes('workflow')) {
      selectFields += ', workflows!workflow_id(id, title, client_id, status)';
    }
    if (includeFields.includes('created_by_user')) {
      selectFields += ', user_profiles!created_by(id, email, user_type)';
    }

    // Apply access control first to determine select string
    const companyFilter = getCompanyFilter(user);
    let finalSelectFields = selectFields;
    
    if (companyFilter) {
      // For client users, include workflow data for filtering only if not already included
      if (!includeFields.includes('workflow')) {
        finalSelectFields = `${selectFields}, workflows!workflow_id(client_id)`;
      }
    }

    let query = supabase
      .from('documents')
      .select(finalSelectFields, { count: 'exact' });
      
    if (companyFilter) {
      // Filter by workflow client ownership
      query = query.eq('workflows.client_id', companyFilter);
    }

    // Apply filters
    if (workflow_id) {
      query = query.eq('workflow_id', workflow_id);
    }
    
    if (document_type) {
      query = query.eq('document_type', document_type);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (tags) {
      const tagArray = tags.split(',').map((tag: string) => tag.trim());
      query = query.overlaps('tags', tagArray);
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortDirection === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch documents',
        details: error.message,
      }, 500 as any);
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit);

    return c.json({
      success: true,
      data: (data || []) as any,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/documents:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
    }, 500 as any);
  }
});

/**
 * POST /api/documents
 * Create a new document
 */
documents.post('/', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser;
    
    if (!user) {
      return c.json({
        success: false,
        error: 'Authentication required',
      }, 401 as any);
    }
    const body = await c.req.json();

    // Validate request body
    const result = CreateDocumentSchema.safeParse(body);
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400 as any);
    }

    const documentData = result.data;

    // Verify workflow exists and user has access
    const companyFilter = getCompanyFilter(user);
    let workflowQuery = supabase
      .from('workflows')
      .select('id, client_id, title')
      .eq('id', documentData.workflow_id);

    if (companyFilter) {
      workflowQuery = workflowQuery.eq('client_id', companyFilter);
    }
    
    const { data: workflow, error: workflowError } = await workflowQuery.single();

    if (workflowError || !workflow) {
      return c.json({
        success: false,
        error: 'Workflow not found or access denied',
      }, 404 as any);
    }

    // Create document with user ID
    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        ...documentData,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating document:', error);
      return c.json({
        success: false,
        error: 'Failed to create document',
        details: error.message,
      }, 500 as any);
    }

    return c.json({
      success: true,
      data: document as Document,
    }, 201 as any);

  } catch (error) {
    console.error('Unexpected error in POST /api/documents:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
    }, 500 as any);
  }
});

/**
 * GET /api/documents/:id
 * Get a single document by ID
 */
documents.get('/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser;
    
    if (!user) {
      return c.json({
        success: false,
        error: 'Authentication required',
      }, 401 as any);
    }
    const id = c.req.param('id');
    const include = c.req.query('include');

    // Build query with optional relationships
    const includeFields = include ? include.split(',') : [];
    let selectFields = '*';
    
    if (includeFields.includes('workflow')) {
      selectFields += ', workflows!workflow_id(id, title, client_id, status)';
    }
    if (includeFields.includes('created_by_user')) {
      selectFields += ', user_profiles!created_by(id, email, user_type)';
    }

    // Apply access control through workflow ownership
    const companyFilter = getCompanyFilter(user);
    let finalSelectFields = selectFields;
    if (companyFilter) {
      finalSelectFields = `${selectFields}, workflows!workflow_id(client_id)`;
    }

    let query = supabase
      .from('documents')
      .select(finalSelectFields)
      .eq('id', id);
      
    if (companyFilter) {
      query = query.eq('workflows.client_id', companyFilter);
    }
    
    const { data, error } = await query.single();

    if (error || !data) {
      return c.json({
        success: false,
        error: 'Document not found',
      }, 404 as any);
    }

    return c.json({
      success: true,
      data: data as any,
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/documents/:id:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
    }, 500 as any);
  }
});

/**
 * PATCH /api/documents/:id
 * Update a document's metadata
 */
documents.patch('/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser;
    
    if (!user) {
      return c.json({
        success: false,
        error: 'Authentication required',
      }, 401 as any);
    }
    const id = c.req.param('id');
    const body = await c.req.json();

    // Validate request body
    const result = UpdateDocumentSchema.safeParse(body);
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400 as any);
    }

    const updateData = result.data;

    // First, verify document exists and user has access
    let documentQuery = supabase
      .from('documents')
      .select('id, workflow_id, workflows!workflow_id(client_id)')
      .eq('id', id)
      .single();

    const companyFilter = getCompanyFilter(user);
    if (companyFilter) {
      documentQuery = supabase
        .from('documents')
        .select('id, workflow_id, workflows!workflow_id(client_id)')
        .eq('id', id)
        .eq('workflows.client_id', companyFilter)
        .single();
    }

    const { data: existingDocument, error: fetchError } = await documentQuery;

    if (fetchError || !existingDocument) {
      return c.json({
        success: false,
        error: 'Document not found or access denied',
      }, 404 as any);
    }

    // If change_summary is provided, increment version
    const versionUpdate = updateData.change_summary ? { version: supabase.rpc('increment_version', { document_id: id }) } : {};

    // Update the document
    const { data: document, error } = await supabase
      .from('documents')
      .update({
        ...updateData,
        ...versionUpdate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating document:', error);
      return c.json({
        success: false,
        error: 'Failed to update document',
        details: error.message,
      }, 500 as any);
    }

    return c.json({
      success: true,
      data: document as Document,
    });

  } catch (error) {
    console.error('Unexpected error in PATCH /api/documents/:id:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
    }, 500 as any);
  }
});

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
documents.delete('/:id', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser;
    
    if (!user) {
      return c.json({
        success: false,
        error: 'Authentication required',
      }, 401 as any);
    }
    const id = c.req.param('id');

    // First, verify document exists and user has access
    let documentQuery = supabase
      .from('documents')
      .select('id, workflow_id, url, metadata, workflows!workflow_id(client_id)')
      .eq('id', id)
      .single();

    const companyFilter = getCompanyFilter(user);
    if (companyFilter) {
      documentQuery = supabase
        .from('documents')
        .select('id, workflow_id, url, metadata, workflows!workflow_id(client_id)')
        .eq('id', id)
        .eq('workflows.client_id', companyFilter)
        .single();
    }

    const { data: document, error: fetchError } = await documentQuery;

    if (fetchError || !document) {
      return c.json({
        success: false,
        error: 'Document not found or access denied',
      }, 404 as any);
    }

    // Delete the actual file from storage if it exists
    const storagePath = document.metadata?.storage_path;
    if (storagePath) {
      try {
        const { error: storageError } = await supabase.storage
          .from('workflow-documents')
          .remove([storagePath]);
          
        if (storageError) {
          console.warn('Failed to delete file from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      } catch (storageErr) {
        console.warn('Error during storage deletion:', storageErr);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete the document record from database
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document from database:', error);
      return c.json({
        success: false,
        error: 'Failed to delete document',
        details: error.message,
      }, 500 as any);
    }

    return c.json({
      success: true,
      message: 'Document deleted successfully',
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/documents/:id:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
    }, 500 as any);
  }
});

/**
 * POST /api/documents/:id/versions
 * Create a new version of a document
 */
documents.post('/:id/versions', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser;
    
    if (!user) {
      return c.json({
        success: false,
        error: 'Authentication required',
      }, 401 as any);
    }
    const id = c.req.param('id');
    const body = await c.req.json();

    // Validate request body
    const result = CreateDocumentVersionSchema.safeParse(body);
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Invalid request body',
        details: result.error.issues,
      }, 400 as any);
    }

    const versionData = result.data;

    // First, verify document exists and user has access
    let documentQuery = supabase
      .from('documents')
      .select('*, workflows!workflow_id(client_id)')
      .eq('id', id)
      .single();

    const companyFilter = getCompanyFilter(user);
    if (companyFilter) {
      documentQuery = supabase
        .from('documents')
        .select('*, workflows!workflow_id(client_id)')
        .eq('id', id)
        .eq('workflows.client_id', companyFilter)
        .single();
    }

    const { data: existingDocument, error: fetchError } = await documentQuery;

    if (fetchError || !existingDocument) {
      return c.json({
        success: false,
        error: 'Document not found or access denied',
      }, 404 as any);
    }

    // Update document with new version
    const { data: document, error } = await supabase
      .from('documents')
      .update({
        url: versionData.url,
        filename: versionData.filename || existingDocument.filename,
        file_size_bytes: versionData.file_size_bytes || existingDocument.file_size_bytes,
        mime_type: versionData.mime_type || existingDocument.mime_type,
        metadata: { ...existingDocument.metadata, ...versionData.metadata },
        change_summary: versionData.change_summary,
        version: existingDocument.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating document version:', error);
      return c.json({
        success: false,
        error: 'Failed to create document version',
        details: error.message,
      }, 500 as any);
    }

    return c.json({
      success: true,
      data: document as Document,
    }, 201 as any);

  } catch (error) {
    console.error('Unexpected error in POST /api/documents/:id/versions:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
    }, 500 as any);
  }
});

/**
 * POST /api/documents/upload
 * Upload a file and create document record
 */
documents.post('/upload', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser;
    
    if (!user) {
      return c.json({
        success: false,
        error: 'Authentication required',
      }, 401 as any);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const workflowId = formData.get('workflow_id') as string;
    const documentType = (formData.get('document_type') as string) || 'WORKING';

    if (!file || !workflowId) {
      return c.json({
        success: false,
        error: 'File and workflow_id are required',
      }, 400 as any);
    }

    // Verify workflow exists and user has access
    const companyFilter = getCompanyFilter(user);
    let workflowQuery = supabase
      .from('workflows')
      .select('id, client_id, title')
      .eq('id', workflowId);

    if (companyFilter) {
      workflowQuery = workflowQuery.eq('client_id', companyFilter);
    }
    
    const { data: workflow, error: workflowError } = await workflowQuery.single();

    if (workflowError || !workflow) {
      return c.json({
        success: false,
        error: 'Workflow not found or access denied',
      }, 404 as any);
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const storagePath = `${workflowId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('workflow-documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return c.json({
        success: false,
        error: 'File upload failed',
        details: uploadError.message,
      }, 500 as any);
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('workflow-documents')
      .getPublicUrl(storagePath);

    // Create document record
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        workflow_id: workflowId,
        filename: file.name,
        url: urlData.publicUrl,
        file_size_bytes: file.size,
        mime_type: file.type,
        document_type: documentType,
        upload_source: 'USER_UPLOAD',
        status: 'COMPLETED',
        metadata: {
          original_name: file.name,
          uploaded_at: new Date().toISOString(),
          storage_path: storagePath,
        },
        created_by: user.id,
      })
      .select('*')
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from('workflow-documents')
        .remove([storagePath]);
        
      return c.json({
        success: false,
        error: 'Failed to create document record',
        details: dbError.message,
      }, 500 as any);
    }

    return c.json({
      success: true,
      data: {
        document: document as Document,
        uploadUrl: urlData.publicUrl,
      },
    }, 201 as any);

  } catch (error) {
    console.error('Unexpected error in POST /api/documents/upload:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
    }, 500 as any);
  }
});

/**
 * GET /api/documents/by-workflow/:workflowId
 * Get all documents for a specific workflow
 */
documents.get('/by-workflow/:workflowId', async (c) => {
  try {
    const supabase = createServerClient();
    const user = c.get('user') as AuthUser;
    
    if (!user) {
      return c.json({
        success: false,
        error: 'Authentication required',
      }, 401 as any);
    }
    const workflowId = c.req.param('workflowId');
    const queryParams = c.req.query();
    
    // Parse query parameters for filtering within the workflow
    const documentType = queryParams.document_type;
    const tags = queryParams.tags;
    const status = queryParams.status;
    const include = queryParams.include;

    // Verify workflow exists and user has access
    const companyFilter = getCompanyFilter(user);
    let workflowQuery = supabase
      .from('workflows')
      .select('id, client_id, title')
      .eq('id', workflowId);

    if (companyFilter) {
      workflowQuery = workflowQuery.eq('client_id', companyFilter);
    }

    const { data: workflow, error: workflowError } = await workflowQuery.single();

    if (workflowError || !workflow) {
      return c.json({
        success: false,
        error: 'Workflow not found or access denied',
      }, 404 as any);
    }

    // Build query for documents
    const includeFields = include ? include.split(',') : [];
    let selectFields = '*';
    
    if (includeFields.includes('created_by_user')) {
      selectFields += ', user_profiles!created_by(id, email, user_type)';
    }

    let query = supabase
      .from('documents')
      .select(selectFields)
      .eq('workflow_id', workflowId);

    // Apply filters
    if (documentType) {
      query = query.eq('document_type', documentType);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (tags) {
      const tagArray = tags.split(',').map((tag: string) => tag.trim());
      query = query.overlaps('tags', tagArray);
    }

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching workflow documents:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch workflow documents',
        details: error.message,
      }, 500 as any);
    }

    return c.json({
      success: true,
      data: (data || []) as any,
      workflow: {
        id: workflow.id,
        title: workflow.title,
        client_id: workflow.client_id,
      },
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/documents/by-workflow/:workflowId:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
    }, 500 as any);
  }
});

export default documents;