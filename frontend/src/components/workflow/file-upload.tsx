'use client';

import { useState, useRef } from 'react';
import { useSupabase } from '@/lib/supabase/provider';
import { Upload, Loader2 } from 'lucide-react';

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

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${uploading 
            ? 'border-primary-300 bg-primary-50' 
            : isDragOver 
              ? 'border-primary-400 bg-primary-50' 
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }
        `}
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
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
            <p className="text-sm font-medium text-primary-700">
              Uploading... {uploadProgress}%
            </p>
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Upload Documents
              </h3>
              <p className="text-sm text-gray-600">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Supports: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, JPG, PNG (max 50MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}