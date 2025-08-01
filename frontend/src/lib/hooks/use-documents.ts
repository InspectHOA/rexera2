'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { 
  Document, 
  DocumentWithRelations, 
  DocumentFilters, 
  CreateDocument, 
  UpdateDocument, 
  CreateDocumentVersion 
} from '@rexera/shared';

// Query keys for caching
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: Partial<DocumentFilters>) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  byWorkflow: (workflowId: string) => [...documentKeys.all, 'workflow', workflowId] as const,
};

// Hook for listing documents with filters
export function useDocuments(filters: Partial<DocumentFilters> = {}) {
  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: () => api.documents.list(filters as any),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

// Hook for getting a single document
export function useDocument(id: string, include: string[] = []) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => api.documents.byId(id, include),
    enabled: !!id,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
}

// Hook for getting documents by workflow
export function useDocumentsByWorkflow(
  workflowId: string, 
  filters: {
    document_type?: 'WORKING' | 'DELIVERABLE';
    tags?: string;
    status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    include?: string[];
  } = {}
) {
  return useQuery({
    queryKey: documentKeys.byWorkflow(workflowId),
    queryFn: () => api.documents.byWorkflow(workflowId, filters),
    enabled: !!workflowId,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

// Hook for document mutations (create, update, delete)
export function useDocumentMutations() {
  const queryClient = useQueryClient();

  const createDocument = useMutation({
    mutationFn: (data: CreateDocument) => api.documents.create(data),
    onSuccess: (newDocument) => {
      // Invalidate and refetch documents lists
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      
      // Invalidate workflow-specific documents
      if (newDocument.workflow_id) {
        queryClient.invalidateQueries({ 
          queryKey: documentKeys.byWorkflow(newDocument.workflow_id) 
        });
      }

      // Add the new document to the cache
      queryClient.setQueryData(
        documentKeys.detail(newDocument.id), 
        newDocument
      );
    },
  });

  const updateDocument = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocument }) => 
      api.documents.update(id, data),
    onSuccess: (updatedDocument) => {
      // Update the specific document in cache
      queryClient.setQueryData(
        documentKeys.detail(updatedDocument.id), 
        updatedDocument
      );

      // Invalidate lists to refresh
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      
      // Invalidate workflow-specific documents
      if (updatedDocument.workflow_id) {
        queryClient.invalidateQueries({ 
          queryKey: documentKeys.byWorkflow(updatedDocument.workflow_id) 
        });
      }
    },
  });

  const deleteDocument = useMutation({
    mutationFn: (id: string) => api.documents.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: documentKeys.detail(deletedId) });
      
      // Invalidate lists to refresh
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });

  const createVersion = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateDocumentVersion }) => 
      api.documents.createVersion(id, data),
    onSuccess: (updatedDocument) => {
      // Update the specific document in cache
      queryClient.setQueryData(
        documentKeys.detail(updatedDocument.id), 
        updatedDocument
      );

      // Invalidate lists to refresh version info
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      
      // Invalidate workflow-specific documents
      if (updatedDocument.workflow_id) {
        queryClient.invalidateQueries({ 
          queryKey: documentKeys.byWorkflow(updatedDocument.workflow_id) 
        });
      }
    },
  });

  const createVersionWithFile = useMutation({
    mutationFn: ({ id, file, changeSummary, metadata }: { 
      id: string; 
      file: File; 
      changeSummary: string; 
      metadata?: object 
    }) => api.documents.createVersionWithFile(id, file, changeSummary, metadata),
    onSuccess: (updatedDocument) => {
      // Update the specific document in cache
      queryClient.setQueryData(
        documentKeys.detail(updatedDocument.id), 
        updatedDocument
      );

      // Invalidate lists to refresh version info
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      
      // Invalidate workflow-specific documents
      if (updatedDocument.workflow_id) {
        queryClient.invalidateQueries({ 
          queryKey: documentKeys.byWorkflow(updatedDocument.workflow_id) 
        });
      }
    },
  });

  return {
    createDocument,
    updateDocument,
    deleteDocument,
    createVersion,
    createVersionWithFile,
  };
}

// Hook for file upload with progress
export function useDocumentUpload() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (
    file: File, 
    workflowId: string, 
    documentType: 'WORKING' | 'DELIVERABLE' = 'WORKING'
  ) => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // Simulate upload progress (in real implementation, you'd use XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await api.documents.upload(file, workflowId, documentType);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Invalidate and refetch documents
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ 
        queryKey: documentKeys.byWorkflow(workflowId) 
      });

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      throw err;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [queryClient]);

  const resetUpload = useCallback(() => {
    setUploadProgress(0);
    setIsUploading(false);
    setError(null);
  }, []);

  return {
    uploadFile,
    uploadProgress,
    isUploading,
    error,
    resetUpload,
  };
}

// Hook for optimistic document operations
export function useOptimisticDocuments(workflowId?: string) {
  const queryClient = useQueryClient();

  const addOptimisticDocument = useCallback((document: Partial<Document>) => {
    if (!workflowId) return;

    const optimisticDoc: Document = {
      id: `temp-${Date.now()}`,
      workflow_id: workflowId,
      filename: '',
      url: '',
      file_size_bytes: null,
      mime_type: null,
      document_type: 'WORKING',
      tags: [],
      upload_source: null,
      status: 'PENDING',
      metadata: {},
      deliverable_data: {},
      version: 1,
      change_summary: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...document,
    };

    // Add to workflow documents cache
    queryClient.setQueryData(
      documentKeys.byWorkflow(workflowId),
      (old: any) => {
        if (!old) return { data: [optimisticDoc], workflow: null };
        return {
          ...old,
          data: [optimisticDoc, ...old.data],
        };
      }
    );

    return optimisticDoc.id;
  }, [queryClient, workflowId]);

  const removeOptimisticDocument = useCallback((tempId: string) => {
    if (!workflowId) return;

    queryClient.setQueryData(
      documentKeys.byWorkflow(workflowId),
      (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((doc: Document) => doc.id !== tempId),
        };
      }
    );
  }, [queryClient, workflowId]);

  return {
    addOptimisticDocument,
    removeOptimisticDocument,
  };
}