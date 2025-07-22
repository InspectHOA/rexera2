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
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useDocumentsByWorkflow, useDocumentMutations } from '@/lib/hooks/use-documents';
import { DocumentVersionHistory } from './document-version-history';
import { DocumentTagEditor } from './document-tag-editor';
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const documents = (documentsData?.data || []) as DocumentWithRelations[];
  const error = queryError ? (queryError as Error).message : null;

  // Filtered, sorted, and paginated documents
  const { filteredDocuments, paginatedDocuments, totalPages, totalCount } = useMemo(() => {
    let filtered = documents.filter(doc => {
      const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
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

    // Calculate pagination
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedDocuments = filtered.slice(startIndex, startIndex + itemsPerPage);

    return {
      filteredDocuments: filtered,
      paginatedDocuments,
      totalPages,
      totalCount
    };
  }, [documents, searchTerm, filterType, filterStatus, sortBy, sortDirection, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  const resetToFirstPage = () => setCurrentPage(1);

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
    // Select all on current page
    if (selectedDocuments.size === paginatedDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(paginatedDocuments.map(doc => doc.id)));
    }
  };

  const selectAllPages = () => {
    // Select all documents across all pages
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
      case 'COMPLETED': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'PROCESSING': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 'FAILED': return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'DELIVERABLE'
      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
      : 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">Error loading documents: {error}</p>
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                resetToFirstPage();
              }}
              placeholder="Search documents by name or tags..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as any);
                resetToFirstPage();
              }}
              className="px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="ALL">All Types</option>
              <option value="WORKING">Working</option>
              <option value="DELIVERABLE">Deliverable</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as any);
                resetToFirstPage();
              }}
              className="px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
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
          <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-md">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-primary">
                {selectedDocuments.size} document(s) selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkDownload}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary bg-background border border-primary/20 rounded hover:bg-primary/5 transition-colors duration-200"
              >
                <Download className="h-4 w-4" />
                Download All
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleteDocument.isPending}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-destructive bg-background border border-destructive/20 rounded hover:bg-destructive/5 transition-colors duration-200 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete All
              </button>
            </div>
          </div>
        )}

        {/* Sort Controls and Pagination Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={selectAllDocuments}
              className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {selectedDocuments.size === paginatedDocuments.length && paginatedDocuments.length > 0 ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span>Select Page ({paginatedDocuments.length})</span>
            </button>
            
            {totalPages > 1 && selectedDocuments.size < filteredDocuments.length && (
              <button
                onClick={selectAllPages}
                className="text-sm text-primary hover:text-primary/80"
              >
                Select All {totalCount} Documents
              </button>
            )}
            
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <span>Per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-sm bg-background border border-border rounded text-foreground focus:ring-ring focus:border-ring"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm bg-background border border-border rounded text-foreground focus:ring-ring focus:border-ring"
              >
                <option value="created_at">Date Created</option>
                <option value="filename">Name</option>
                <option value="file_size_bytes">Size</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="p-1 hover:bg-muted rounded text-foreground"
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            {searchTerm || filterType !== 'ALL' || filterStatus !== 'ALL'
              ? 'No documents match your filters.'
              : 'No documents uploaded yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            {paginatedDocuments.map((document) => (
            <div key={document.id} className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors duration-200">
                <button
                  onClick={() => toggleDocumentSelection(document.id)}
                  className="flex-shrink-0"
                >
                  {selectedDocuments.has(document.id) ? (
                    <CheckSquare className="h-5 w-5 text-primary" />
                  ) : (
                    <Square className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                
                <div className="text-2xl flex-shrink-0">
                  {getFileIcon(document.mime_type || '')}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">
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
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                  
                  <div className="mt-2">
                    <DocumentTagEditor
                      document={document}
                      inline={true}
                      onTagsUpdated={(updatedDocument) => {
                        // Document list will be automatically updated by React Query
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setExpandedDocument(expandedDocument === document.id ? null : document.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted border border-border rounded hover:bg-muted/80 transition-colors duration-200"
                    title="Version history"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                    Versions
                  </button>
                  <button
                    onClick={() => downloadDocument(document)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded hover:bg-primary/20 transition-colors duration-200"
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded hover:bg-destructive/20 transition-colors duration-200"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-foreground">
                    Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of{' '}
                    <span className="font-medium">{totalCount}</span> documents
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-muted-foreground ring-1 ring-inset ring-border hover:bg-muted focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first page, last page, current page, and 2 pages on each side of current
                        return page === 1 ||
                               page === totalPages ||
                               Math.abs(page - currentPage) <= 2;
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there's a gap
                        const showEllipsisBefore = index > 0 && array[index - 1] < page - 1;
                        
                        return (
                          <div key={page} className="flex items-center">
                            {showEllipsisBefore && (
                              <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-foreground ring-1 ring-inset ring-border">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-border hover:bg-muted focus:z-20 focus:outline-offset-0 ${
                                page === currentPage
                                  ? 'z-10 bg-primary text-primary-foreground focus:ring-primary'
                                  : 'text-foreground'
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-muted-foreground ring-1 ring-inset ring-border hover:bg-muted focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}