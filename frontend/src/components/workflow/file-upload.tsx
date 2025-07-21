'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { useDocumentUpload } from '@/lib/hooks/useDocuments';
import type { Document } from '@rexera/shared';

interface FileUploadProps {
  workflowId: string;
  onUploadComplete?: (document: Document) => void;
  className?: string;
}

export function FileUpload({ workflowId, onUploadComplete, className = '' }: FileUploadProps) {
  const { uploadFile, uploadProgress, isUploading, error: uploadError, resetUpload } = useDocumentUpload();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const error = uploadError;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      await handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const result = await uploadFile(file, workflowId, 'WORKING');
      onUploadComplete?.(result.document);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      // Error is handled by the hook
      console.error('Upload failed:', err);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    
    for (const file of files) {
      await handleUpload(file);
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
          ${isUploading
            ? 'border-primary/30 bg-primary/5'
            : isDragOver
              ? 'border-primary/40 bg-primary/5'
              : 'border-border bg-card hover:border-border/60 hover:bg-muted/50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />

        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm font-medium text-primary">
              Uploading... {uploadProgress}%
            </p>
            {uploadProgress > 0 && (
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Upload Documents
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, JPG, PNG (max 50MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}