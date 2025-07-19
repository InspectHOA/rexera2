'use client';

import { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Search,
  Filter,
  CheckSquare,
  Square,
  MoreHorizontal,
  Tag,
  Calendar,
  User
} from 'lucide-react';
import { useDocumentsByWorkflow, useDocumentMutations } from '@/lib/hooks/useDocuments';
import { DocumentVersionHistory } from './document-version-history';
import type { Document, DocumentWithRelations } from '@rexera/shared';

interface DocumentManagerProps {
  workflowId: string;
  onDocumentDeleted?: () => void;
}

export function DocumentManager({ workflowId, onDocumentDeleted }: DocumentManagerProps) {
  const { data: documentsData, isLoading: loading, error: queryError } = useDocumentsByWorkflow(workflowId, {
    include: ['created_by_user']
  });
  const { deleteDocument } = useDocumentMutations();

  // UI State
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'WORKING' | 'DELIVERABLE'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('ALL');
  const [sortBy, setSortBy] = useState<'created_at' | 'filename' | 'file_size_bytes'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedDocument, setExpandedDocument] = useState<string | null>(null);

  const documents = (documentsData?.data || []) as DocumentWithRelations[];
  const error = queryError ? (queryError as Error).message : null;

  // Filtered and sorted documents
  const filteredDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'ALL' || doc.document_type === filterType;
      const matchesStatus = filterStatus === 'ALL' || doc.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort documents
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'filename':
          aValue = a.filename.toLowerCase();
          bValue = b.filename.toLowerCase();
          break;
        case 'file_size_bytes':
          aValue = a.file_size_bytes || 0;
          bValue = b.file_size_bytes || 0;
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [documents, searchTerm, filterType, filterStatus, sortBy, sortDirection]);

  // Selection handlers
  const toggleDocumentSelection = (docId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocuments(newSelected);
  };

  const selectAllDocuments = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredDocuments.map(doc => doc.id)));
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedDocuments.size} document(s)?`;
    if (!confirm(confirmMessage)) return;

    try {
      const deletePromises = Array.from(selectedDocuments).map(docId => 
        deleteDocument.mutateAsync(docId)
      );
      
      await Promise.all(deletePromises);
      setSelectedDocuments(new Set());
      onDocumentDeleted?.();
    } catch (error) {
      alert('Failed to delete some documents: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const downloadDocument = (document: Document) => {
    const link = window.document.createElement('a');
    link.href = document.url;
    link.download = document.filename;
    link.click();
  };

  const handleBulkDownload = () => {
    if (selectedDocuments.size === 0) return;
    
    const selectedDocs = filteredDocuments.filter(doc => selectedDocuments.has(doc.id));
    selectedDocs.forEach(doc => downloadDocument(doc));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word')) return '📝';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊';
    if (mimeType?.includes('text')) return '📄';
    return '📎';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'DELIVERABLE' 
      ? 'bg-purple-100 text-purple-800'
      : 'bg-gray-100 text-gray-800';
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

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents by name or tags..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="ALL">All Types</option>
              <option value="WORKING">Working</option>
              <option value="DELIVERABLE">Deliverable</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedDocuments.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-md">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-primary-700">
                {selectedDocuments.size} document(s) selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkDownload}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 bg-white border border-primary-200 rounded hover:bg-primary-50 transition-colors duration-200"
              >
                <Download className="h-4 w-4" />
                Download All
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleteDocument.isPending}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded hover:bg-red-50 transition-colors duration-200 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete All
              </button>
            </div>
          </div>
        )}

        {/* Sort Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={selectAllDocuments}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {selectedDocuments.size === filteredDocuments.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span>Select All</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="created_at">Date Created</option>
              <option value="filename">Name</option>
              <option value="file_size_bytes">Size</option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-500">
            {searchTerm || filterType !== 'ALL' || filterStatus !== 'ALL' 
              ? 'No documents match your filters.' 
              : 'No documents uploaded yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((document) => (
            <div key={document.id} className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <button
                  onClick={() => toggleDocumentSelection(document.id)}
                  className="flex-shrink-0"
                >
                  {selectedDocuments.has(document.id) ? (
                    <CheckSquare className="h-5 w-5 text-primary-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                
                <div className="text-2xl flex-shrink-0">
                  {getFileIcon(document.mime_type || '')}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {document.filename}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(document.document_type)}`}>
                      {document.document_type}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status || 'PENDING')}`}>
                      {document.status || 'PENDING'}
                    </span>
                    {document.version && document.version > 1 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        v{document.version}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(document.created_at).toLocaleDateString()}
                    </span>
                    <span>{formatFileSize(document.file_size_bytes || 0)}</span>
                    {document.created_by_user && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {document.created_by_user.email}
                      </span>
                    )}
                  </div>
                  
                  {document.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Tag className="h-3 w-3 text-gray-400" />
                      <div className="flex gap-1">
                        {document.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setExpandedDocument(expandedDocument === document.id ? null : document.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors duration-200"
                    title="Version history"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                    Versions
                  </button>
                  <button
                    onClick={() => downloadDocument(document)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded hover:bg-primary-100 transition-colors duration-200"
                    title="Download document"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${document.filename}"?`)) {
                        deleteDocument.mutate(document.id);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors duration-200"
                    title="Delete document"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
              
              {expandedDocument === document.id && (
                <div className="ml-12">
                  <DocumentVersionHistory
                    documentId={document.id}
                    onVersionCreated={() => {
                      // Version created, document list will be automatically updated by React Query
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}