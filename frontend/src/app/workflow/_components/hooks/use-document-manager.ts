/**
 * Document manager hook for workflow document management.
 * Handles filtering, sorting, pagination, and selection state.
 */

import { useState, useMemo } from 'react';
import type { DocumentWithRelations } from '@rexera/shared';

interface UseDocumentManagerOptions {
  documents: DocumentWithRelations[];
  initialItemsPerPage?: number;
}

interface DocumentFilters {
  searchTerm: string;
  filterType: 'ALL' | 'WORKING' | 'DELIVERABLE';
  filterStatus: 'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

interface DocumentSorting {
  sortBy: 'created_at' | 'filename' | 'file_size_bytes';
  sortDirection: 'asc' | 'desc';
}

export function useDocumentManager({ 
  documents, 
  initialItemsPerPage = 20 
}: UseDocumentManagerOptions) {
  // Selection state
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'WORKING' | 'DELIVERABLE'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('ALL');
  
  // Sort state
  const [sortBy, setSortBy] = useState<'created_at' | 'filename' | 'file_size_bytes'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  
  // UI state
  const [expandedDocument, setExpandedDocument] = useState<string | null>(null);

  // Computed values
  const { filteredDocuments, paginatedDocuments, totalPages, totalCount } = useMemo(() => {
    // Apply filters
    let filtered = documents.filter(doc => {
      const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'ALL' || doc.document_type === filterType;
      const matchesStatus = filterStatus === 'ALL' || doc.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });

    // Apply sorting
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

    // Apply pagination
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

  // Selection actions
  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const selectAllDocuments = () => {
    setSelectedDocuments(new Set(paginatedDocuments.map(doc => doc.id)));
  };

  const clearSelection = () => {
    setSelectedDocuments(new Set());
  };

  const isDocumentSelected = (documentId: string) => {
    return selectedDocuments.has(documentId);
  };

  const allDocumentsSelected = paginatedDocuments.length > 0 && 
    paginatedDocuments.every(doc => selectedDocuments.has(doc.id));

  // Filter actions
  const updateFilters = (filters: Partial<DocumentFilters>) => {
    if (filters.searchTerm !== undefined) setSearchTerm(filters.searchTerm);
    if (filters.filterType !== undefined) setFilterType(filters.filterType);
    if (filters.filterStatus !== undefined) setFilterStatus(filters.filterStatus);
    
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('ALL');
    setFilterStatus('ALL');
    setCurrentPage(1);
  };

  // Sort actions
  const updateSorting = (sorting: Partial<DocumentSorting>) => {
    if (sorting.sortBy !== undefined) setSortBy(sorting.sortBy);
    if (sorting.sortDirection !== undefined) setSortDirection(sorting.sortDirection);
    
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  // Pagination actions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const updateItemsPerPage = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  // UI actions
  const toggleDocumentExpanded = (documentId: string) => {
    setExpandedDocument(prev => prev === documentId ? null : documentId);
  };

  const isDocumentExpanded = (documentId: string) => {
    return expandedDocument === documentId;
  };

  return {
    // Data
    filteredDocuments,
    paginatedDocuments,
    totalPages,
    totalCount,
    
    // Selection state
    selectedDocuments,
    allDocumentsSelected,
    
    // Filter state
    searchTerm,
    filterType,
    filterStatus,
    
    // Sort state
    sortBy,
    sortDirection,
    
    // Pagination state
    currentPage,
    itemsPerPage,
    
    // UI state
    expandedDocument,
    
    // Selection actions
    toggleDocumentSelection,
    selectAllDocuments,
    clearSelection,
    isDocumentSelected,
    
    // Filter actions
    updateFilters,
    clearFilters,
    
    // Sort actions
    updateSorting,
    
    // Pagination actions
    goToPage,
    nextPage,
    previousPage,
    updateItemsPerPage,
    
    // UI actions
    toggleDocumentExpanded,
    isDocumentExpanded,
  };
}