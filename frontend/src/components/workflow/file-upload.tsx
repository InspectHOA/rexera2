'use client';

import { useState, useRef } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { fileUploadStyles } from '@/styles/file-upload';

interface FileUploadProps {
  workflowId: string;
  taskId?: string;
  onUploadComplete?: (document: any) => void;
  className?: string;
}

export function FileUpload({ workflowId, taskId, onUploadComplete, className = '' }: FileUploadProps) {
  const { supabase } = useSupabase();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

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
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setUploadProgress(50);

      // Create document record in database
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          workflow_id: workflowId,
          task_id: taskId || null,
          filename: file.name,
          storage_path: storagePath,
          file_size_bytes: file.size,
          mime_type: file.type,
          document_type: 'WORKING',
          upload_source: 'USER_UPLOAD',
          status: 'PENDING',
          metadata: {
            original_name: file.name,
            uploaded_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('workflow-documents')
          .remove([storagePath]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      setUploadProgress(100);
      onUploadComplete?.(document);

    } catch (err) {
      console.error('File upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    
    for (const file of files) {
      await uploadFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const getUploadAreaStyle = () => {
    if (uploading) return { ...fileUploadStyles.uploadArea, ...fileUploadStyles.uploadAreaUploading };
    if (isDragOver) return { ...fileUploadStyles.uploadArea, ...fileUploadStyles.uploadAreaHover };
    return fileUploadStyles.uploadArea;
  };

  return (
    <div style={fileUploadStyles.container} className={className}>
      <div
        style={getUploadAreaStyle()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
          onChange={handleFileSelect}
          disabled={uploading}
          style={{ display: 'none' }}
        />

        {uploading ? (
          <div>
            <div style={{ ...fileUploadStyles.spinner, animation: 'spin 1s linear infinite' }} />
            <p style={fileUploadStyles.uploadProgress}>
              Uploading... {uploadProgress}%
            </p>
            {uploadProgress > 0 && (
              <div style={fileUploadStyles.progressBar}>
                <div 
                  style={{ ...fileUploadStyles.progressFill, width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={fileUploadStyles.uploadIcon}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <h3 style={fileUploadStyles.title}>
              Upload Documents
            </h3>
            <p style={fileUploadStyles.subtitle}>
              Drag and drop files here, or click to browse
            </p>
            <p style={fileUploadStyles.hint}>
              Supports: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, JPG, PNG (max 50MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div style={fileUploadStyles.error}>
          {error}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}