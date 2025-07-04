'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { documentListStyles } from '@/styles/file-upload';

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

      setDocuments(data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
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
      console.error('Download error:', err);
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
      console.error('Delete error:', err);
      alert('Failed to delete document: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div style={documentListStyles.loadingContainer}>
        <div style={{ ...documentListStyles.loadingSpinner, animation: 'spin 1s linear infinite' }} />
        <p style={documentListStyles.loadingText}>Loading documents...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={documentListStyles.error}>
        Error loading documents: {error}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div style={documentListStyles.emptyState}>
        <p>No documents uploaded yet.</p>
      </div>
    );
  }

  return (
    <div style={documentListStyles.container}>
      {documents.map((document) => (
        <div key={document.id} style={documentListStyles.documentItem}>
          <div style={documentListStyles.fileIcon}>
            {getFileIcon(document.mime_type || '')}
          </div>
          
          <div style={documentListStyles.fileInfo}>
            <p style={documentListStyles.fileName}>
              {document.filename}
            </p>
            <p style={documentListStyles.fileMeta}>
              {formatFileSize(document.file_size_bytes || 0)} • {new Date(document.created_at).toLocaleDateString()}
            </p>
          </div>

          <div style={documentListStyles.actions}>
            <button
              onClick={() => handleDownload(document)}
              style={{ ...documentListStyles.button, ...documentListStyles.downloadButton }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              Download
            </button>
            <button
              onClick={() => handleDelete(document)}
              style={{ ...documentListStyles.button, ...documentListStyles.deleteButton }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}