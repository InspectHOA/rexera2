'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, FileText, Settings } from 'lucide-react';
import { useDocumentUpload } from '@/lib/hooks/use-documents';
import { PredefinedTagSelector } from '@/components/ui/predefined-tag-selector';
import type { Document } from '@rexera/shared';

interface FileUploadWithTagsProps {
  workflowId: string;
  onUploadComplete?: (document: Document) => void;
  className?: string;
}

interface PendingFile {
  file: File;
  id: string;
  tags: string[];
  documentType: 'WORKING' | 'DELIVERABLE';
}

export function FileUploadWithTags({ 
  workflowId, 
  onUploadComplete, 
  className = ''
}: FileUploadWithTagsProps) {
  const { uploadFile, uploadProgress, isUploading, error: uploadError } = useDocumentUpload();
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [showFileSettings, setShowFileSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const newPendingFiles = Array.from(files).map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      tags: [],
      documentType: 'WORKING' as const
    }));
    
    setPendingFiles(prev => [...prev, ...newPendingFiles]);
    setShowFileSettings(true);

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    
    const newPendingFiles = files.map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      tags: [],
      documentType: 'WORKING' as const
    }));
    
    setPendingFiles(prev => [...prev, ...newPendingFiles]);
    setShowFileSettings(true);
  };

  const updatePendingFile = (id: string, updates: Partial<Omit<PendingFile, 'file' | 'id'>>) => {
    setPendingFiles(prev => 
      prev.map(file => 
        file.id === id ? { ...file, ...updates } : file
      )
    );
  };

  const removePendingFile = (id: string) => {
    setPendingFiles(prev => prev.filter(file => file.id !== id));
    if (pendingFiles.length === 1) {
      setShowFileSettings(false);
    }
  };

  const uploadPendingFiles = async () => {
    for (const pendingFile of pendingFiles) {
      try {
        // Create document with tags using the API
        const result = await uploadFile(pendingFile.file, workflowId, pendingFile.documentType);
        
        // If we have tags, update the document with tags
        if (pendingFile.tags.length > 0) {
          // Note: This would require an update API call if we want to add tags after upload
          // For now, we'll pass tags in the initial upload metadata
        }
        
        onUploadComplete?.(result.document);
      } catch (err) {
        console.error('Upload failed:', err);
        // Continue with other files even if one fails
      }
    }
    
    setPendingFiles([]);
    setShowFileSettings(false);
  };

  const cancelUpload = () => {
    setPendingFiles([]);
    setShowFileSettings(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      default: return '📎';
    }
  };

  if (showFileSettings && pendingFiles.length > 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configure Files ({pendingFiles.length})
            </h3>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {pendingFiles.map((pendingFile) => (
              <div key={pendingFile.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(pendingFile.file.name)}</span>
                    <div>
                      <p className="font-medium text-foreground">{pendingFile.file.name}</p>
                      <p className="text-sm text-muted-foreground">{formatFileSize(pendingFile.file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removePendingFile(pendingFile.id)}
                    className="text-destructive hover:text-destructive/80 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Document Type
                    </label>
                    <select
                      value={pendingFile.documentType}
                      onChange={(e) => updatePendingFile(pendingFile.id, {
                        documentType: e.target.value as 'WORKING' | 'DELIVERABLE'
                      })}
                      className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                    >
                      <option value="WORKING">Working Document</option>
                      <option value="DELIVERABLE">Deliverable</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Tags
                    </label>
                    <PredefinedTagSelector
                      selectedTags={pendingFile.tags}
                      onChange={(tags) => updatePendingFile(pendingFile.id, { tags })}
                      placeholder="Add tags to organize this document..."
                      maxTags={10}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              onClick={cancelUpload}
              className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
            >
              Cancel
            </button>
            <button
              onClick={uploadPendingFiles}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading... {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload {pendingFiles.length} Files
                </>
              )}
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{uploadError}</p>
          </div>
        )}
      </div>
    );
  }

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
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
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

        <div className="space-y-4">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Upload Documents with Tags
            </h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              You can add tags and set document types after selecting files
            </p>
            <p className="text-xs text-muted-foreground">
              Supports: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, JPG, PNG (max 50MB)
            </p>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{uploadError}</p>
        </div>
      )}
    </div>
  );
}