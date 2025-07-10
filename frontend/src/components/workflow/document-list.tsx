'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { FileText, Download, Trash2, Loader2, AlertCircle } from 'lucide-react';

interface Document {
  id: string;
  filename: string;
  url: string;
  file_size_bytes: number;
  mime_type: string;
  document_type: string;
  created_at: string;
  created_by: string;
}

interface DocumentListProps {
  workflowId: string;
  taskId?: string;
  onDocumentDeleted?: () => void;
}

export function DocumentList({ workflowId, taskId, onDocumentDeleted }: DocumentListProps) {
  const { supabase } = useSupabase();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('documents')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: false });

      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      setDocuments((data || []) as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [workflowId, taskId]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('text')) return '📄';
    return '📎';
  };

  const handleDownload = async (document: Document) => {
    try {
      if (document.url) {
        const link = window.document.createElement('a');
        link.href = document.url;
        link.download = document.filename;
        link.click();
      }
    } catch (err) {
      }
  };

  const handleDelete = async (document: Document) => {
    if (!confirm(`Are you sure you want to delete "${document.filename}"?`)) {
      return;
    }

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (dbError) {
        throw new Error(dbError.message);
      }

      // Delete from storage if storage_path exists
      if (document.url && document.url.includes('workflow-documents/')) {
        const pathParts = document.url.split('workflow-documents/');
        if (pathParts.length > 1) {
          const storagePath = pathParts[1];
          await supabase.storage
            .from('workflow-documents')
            .remove([storagePath]);
        }
      }

      // Refresh the list
      await loadDocuments();
      onDocumentDeleted?.();
    } catch (err) {
      alert('Failed to delete document: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <p className="text-sm text-gray-600">Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-700">Error loading documents: {error}</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-sm text-gray-500">No documents uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <div 
          key={document.id} 
          className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          <div className="text-2xl flex-shrink-0">
            {getFileIcon(document.mime_type || '')}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {document.filename}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(document.file_size_bytes || 0)} • {new Date(document.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => handleDownload(document)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded hover:bg-primary-100 transition-colors duration-200"
              title="Download document"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
            <button
              onClick={() => handleDelete(document)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors duration-200"
              title="Delete document"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}