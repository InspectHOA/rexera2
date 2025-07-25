'use client';

import { useState, useEffect } from 'react';
import { Search, Building2, Phone, Mail, Plus, Check, Loader2, ChevronLeft, ChevronRight, Edit, X, Clock, MessageCircle, CheckCircle2 } from 'lucide-react';

import type { Counterparty, CounterpartyType, CreateCounterpartyRequest, WorkflowType, WorkflowCounterparty, WorkflowCounterpartyStatus } from '@rexera/shared';
import { getAllowedCounterpartyTypes, isApiError } from '@rexera/shared';

import { counterpartiesApi } from '@/lib/api/endpoints/counterparties';
import { workflowsApi } from '@/lib/api';
import { workflowCounterpartiesApi } from '@/lib/api/endpoints/workflow-counterparties';
import { toast } from '@/lib/hooks/use-toast';

import { AddCounterpartyModal } from './add-counterparty-modal';
import { EditCounterpartyModal } from './edit-counterparty-modal';

interface CounterpartySelectorProps {
  workflowId?: string;
  agentId: string;
}

export function CounterpartySelector({ workflowId, agentId }: CounterpartySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCounterparties, setSelectedCounterparties] = useState<string[]>([]);
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [workflowType, setWorkflowType] = useState<WorkflowType | null>(null);
  const [allowedTypes, setAllowedTypes] = useState<CounterpartyType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 12;
  const [assignedCounterparties, setAssignedCounterparties] = useState<(WorkflowCounterparty & { counterparty: Counterparty })[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCounterparty, setEditingCounterparty] = useState<Counterparty | null>(null);

  // Fetch workflow information to determine allowed counterparty types
  useEffect(() => {
    const fetchWorkflowInfo = async () => {
      if (!workflowId) {
        // If no workflow, allow all types
        setAllowedTypes(['hoa', 'lender', 'municipality', 'utility', 'tax_authority']);
        return;
      }
      
      try {
        const workflow = await workflowsApi.byId(workflowId);
        const allowed = getAllowedCounterpartyTypes(workflow.workflow_type);
        
        setWorkflowType(workflow.workflow_type);
        setAllowedTypes(allowed);
        
        // Fetch assigned counterparties if we have a workflow
        await fetchAssignedCounterparties();
      } catch (error) {
        console.error('Failed to fetch workflow:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load workflow information.',
        });
        // Fallback to all types
        setAllowedTypes(['hoa', 'lender', 'municipality', 'utility', 'tax_authority']);
      }
    };

    fetchWorkflowInfo();
  }, [workflowId]);

  // Fetch assigned counterparties for the workflow
  const fetchAssignedCounterparties = async () => {
    if (!workflowId) {
      setAssignedCounterparties([]);
      return [];
    }

    try {
      setLoadingAssigned(true);
      const response = await workflowCounterpartiesApi.list(workflowId, {
        include: 'counterparty'
      });
      
      // Transform the API response to match expected frontend format
      // API returns 'counterparties' but frontend expects 'counterparty'
      const data = (response as any[]).map(item => ({
        ...item,
        counterparty: item.counterparties // Map counterparties to counterparty
      })) as (WorkflowCounterparty & { counterparty: Counterparty })[];
      
      setAssignedCounterparties(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch assigned counterparties:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load assigned counterparties.',
      });
      return [];
    } finally {
      setLoadingAssigned(false);
    }
  };

  // Generate dynamic type filter options based on allowed types
  const types = [
    { value: 'all', label: 'All Allowed Types' },
    ...(allowedTypes.includes('lender') ? [{ value: 'lender', label: 'Lenders' }] : []),
    ...(allowedTypes.includes('hoa') ? [{ value: 'hoa', label: 'HOAs' }] : []),
    ...(allowedTypes.includes('municipality') ? [{ value: 'municipality', label: 'Municipalities' }] : []),
    ...(allowedTypes.includes('tax_authority') ? [{ value: 'tax_authority', label: 'Tax Authorities' }] : []),
    ...(allowedTypes.includes('utility') ? [{ value: 'utility', label: 'Utilities' }] : [])
  ];

  // Fetch counterparties from API
  useEffect(() => {
    const fetchCounterparties = async () => {
      if (allowedTypes.length === 0) return; // Wait for allowed types to be set
      
      try {
        setLoading(true);
        
        // Determine the type filter based on selection and allowed types
        let typeFilter: CounterpartyType | undefined;
        if (selectedType !== 'all') {
          typeFilter = selectedType as CounterpartyType;
          // Make sure the selected type is actually allowed
          if (!allowedTypes.includes(typeFilter)) {
            typeFilter = undefined;
          }
        }
        
        const response = await counterpartiesApi.list({
          search: searchTerm || undefined,
          type: typeFilter,
          page: currentPage,
          limit: itemsPerPage,
          sort: 'name',
          order: 'asc'
        });
        
        // Filter results to only include allowed types (extra safety)
        const filteredCounterparties = response.data.filter((cp: Counterparty) => 
          allowedTypes.includes(cp.type)
        );
        
        setCounterparties(filteredCounterparties);
        setTotalPages(response.pagination.totalPages);
        setTotalCount(response.pagination.total);
      } catch (error) {
        console.error('Failed to fetch counterparties:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load counterparties. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    // Debounce search and reset to page 1 if search terms change
    const timer = setTimeout(() => {
      if (currentPage !== 1 && (searchTerm !== '' || selectedType !== 'all')) {
        setCurrentPage(1);
      } else {
        fetchCounterparties();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedType, allowedTypes, currentPage]);

  // Handle adding selected counterparties to workflow
  const handleAddSelected = async () => {
    if (!workflowId || selectedCounterparties.length === 0) return;

    try {
      setSubmitting(true);
      
      // Refresh assigned counterparties to get the latest state
      const currentAssignedCounterparties = await fetchAssignedCounterparties();
      
      // Get currently assigned counterparty IDs to avoid duplicates
      const assignedIds = new Set(currentAssignedCounterparties?.map(a => a.counterparty_id) || []);
      
      // Filter out already assigned counterparties
      const newCounterpartyIds = selectedCounterparties.filter(id => !assignedIds.has(id));
      
      if (newCounterpartyIds.length === 0) {
        toast({
          title: 'No Changes',
          description: 'All selected counterparties are already assigned to this workflow.',
        });
        setSelectedCounterparties([]);
        return;
      }

      // Add each new counterparty to the workflow
      console.log('Adding counterparties:', newCounterpartyIds);
      
      // Add counterparties with individual error handling
      let successCount = 0;
      let conflictCount = 0;
      let errorCount = 0;
      
      for (const counterpartyId of newCounterpartyIds) {
        try {
          await workflowCounterpartiesApi.add(workflowId, {
            counterparty_id: counterpartyId,
            status: 'PENDING'
          });
          successCount++;
        } catch (error) {
          if (isApiError(error) && error.status === 409) {
            conflictCount++;
            console.log(`Counterparty ${counterpartyId} already assigned, skipping`);
          } else {
            errorCount++;
            console.error(`Failed to add counterparty ${counterpartyId}:`, error);
          }
        }
      }

      // Build success message based on results
      const skippedCount = selectedCounterparties.length - newCounterpartyIds.length;
      let message = '';
      
      if (successCount > 0) {
        message = `Added ${successCount} counterpartie(s) to workflow.`;
      }
      
      if (skippedCount > 0 || conflictCount > 0) {
        const totalSkipped = skippedCount + conflictCount;
        if (message) message += ' ';
        message += `${totalSkipped} were already assigned.`;
      }
      
      if (errorCount > 0) {
        if (message) message += ' ';
        message += `${errorCount} failed due to errors.`;
      }

      // Show appropriate toast based on results
      if (successCount > 0 && errorCount === 0) {
        toast({
          title: 'Success',
          description: message,
        });
      } else if (successCount > 0 && errorCount > 0) {
        toast({
          title: 'Partial Success',
          description: message,
        });
      } else if (errorCount > 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: message,
        });
      } else {
        toast({
          title: 'No Changes',
          description: 'All selected counterparties were already assigned.',
        });
      }

      // Clear selection and refresh assigned counterparties
      setSelectedCounterparties([]);
      await fetchAssignedCounterparties();
      
    } catch (error) {
      console.error('Unexpected error during counterparty addition:', error);
      
      // Handle unexpected errors (like network failures during the process)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred while adding counterparties.',
      });
      
      // Clear selection and refresh assigned counterparties
      setSelectedCounterparties([]);
      await fetchAssignedCounterparties();
    } finally {
      setSubmitting(false);
    }
  };

  // Handle successful counterparty creation
  const handleCounterpartyCreated = async (newCounterparty: Counterparty) => {
    if (!newCounterparty) {
      console.error('No counterparty data received');
      return;
    }

    // Add the new counterparty to the list
    setCounterparties(prev => [newCounterparty, ...prev]);
    
    // If we're in a workflow context, automatically assign the new counterparty
    if (workflowId) {
      try {
        await workflowCounterpartiesApi.add(workflowId, {
          counterparty_id: newCounterparty.id,
          status: 'PENDING'
        });

        // Refresh the assigned counterparties list
        await fetchAssignedCounterparties();

        toast({
          title: 'Success',
          description: `${newCounterparty.name} has been created and assigned to this workflow.`,
        });
      } catch (error) {
        console.error('Failed to assign new counterparty to workflow:', error);
        
        // Still select it so user can manually add it
        setSelectedCounterparties(prev => [...prev, newCounterparty.id]);
        
        toast({
          variant: 'destructive',
          title: 'Partial Success',
          description: `${newCounterparty.name} was created but couldn't be assigned to workflow. Please use "Add Selected" button.`,
        });
      }
    }
  };

  // Handle edit counterparty
  const handleEditCounterparty = (counterparty: Counterparty) => {
    setEditingCounterparty(counterparty);
    setShowEditModal(true);
  };

  // Handle successful counterparty edit
  const handleCounterpartyUpdated = (updatedCounterparty: Counterparty) => {
    // Update the counterparty in the available list
    setCounterparties(prev => 
      prev.map(cp => cp.id === updatedCounterparty.id ? updatedCounterparty : cp)
    );
    
    // Update the counterparty in the assigned list
    setAssignedCounterparties(prev =>
      prev.map(assignment =>
        assignment.counterparty.id === updatedCounterparty.id
          ? { ...assignment, counterparty: updatedCounterparty }
          : assignment
      )
    );
  };

  // Handle status update
  const handleStatusUpdate = async (assignmentId: string, newStatus: WorkflowCounterpartyStatus) => {
    if (!workflowId) return;

    try {
      await workflowCounterpartiesApi.updateStatus(workflowId, assignmentId, { status: newStatus });
      
      // Update the local state
      setAssignedCounterparties(prev =>
        prev.map(assignment =>
          assignment.id === assignmentId
            ? { ...assignment, status: newStatus }
            : assignment
        )
      );
      
      toast({
        title: 'Status Updated',
        description: `Counterparty status changed to ${newStatus.toLowerCase()}.`,
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update counterparty status. Please try again.',
      });
    }
  };

  // Handle remove counterparty from workflow
  const handleRemoveCounterparty = async (assignmentId: string, counterpartyName: string) => {
    if (!workflowId) return;

    try {
      await workflowCounterpartiesApi.remove(workflowId, assignmentId);
      
      // Remove from local state
      setAssignedCounterparties(prev =>
        prev.filter(assignment => assignment.id !== assignmentId)
      );
      
      toast({
        title: 'Counterparty Removed',
        description: `${counterpartyName} has been removed from this workflow.`,
      });
    } catch (error) {
      console.error('Failed to remove counterparty:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove counterparty from workflow. Please try again.',
      });
    }
  };

  // Counterparties are already filtered by API, no need to filter again
  const filteredCounterparties = counterparties;

  const toggleSelection = (id: string) => {
    setSelectedCounterparties(prev => 
      prev.includes(id) 
        ? prev.filter(cpId => cpId !== id)
        : [...prev, id]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lender': return '🏦';
      case 'hoa': return '🏘️';
      case 'tax_authority': return '🏛️';
      case 'municipality': return '🏢';
      case 'utility': return '⚡';
      default: return '🏢';
    }
  };

  const getStatusIcon = (status: WorkflowCounterpartyStatus) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'CONTACTED': return <MessageCircle className="w-4 h-4 text-blue-600" />;
      case 'RESPONDED': return <MessageCircle className="w-4 h-4 text-blue-600" />;
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: WorkflowCounterpartyStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700';
      case 'CONTACTED': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700';
      case 'RESPONDED': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700';
    }
  };

  return (
    <div className="h-full bg-background relative">
      {/* Loading Overlay */}
      {loading && allowedTypes.length === 0 && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading counterparties...</p>
          </div>
        </div>
      )}
      
      {/* Compact Top Bar */}
      <div className="bg-card p-3 flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search counterparties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dm-input w-full pl-10 pr-4 py-2 text-sm"
          />
        </div>
        
        {/* Type Filter */}
        <div className="w-40">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="dm-select w-full px-3 py-2 text-sm"
          >
            {types.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowAddModal(true)}
            title="Add New Counterparty"
            className="dm-button-primary p-2 rounded flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
          {selectedCounterparties.length > 0 && workflowId && (
            <button 
              onClick={handleAddSelected}
              disabled={submitting}
              title={`Add ${selectedCounterparties.length} selected counterparties`}
              className="bg-green-600 text-white p-2 rounded flex items-center justify-center hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-700 dark:hover:bg-green-600"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
          )}
          {selectedCounterparties.length > 0 && (
            <span className="text-xs text-muted-foreground ml-1">
              {selectedCounterparties.length}
            </span>
          )}
        </div>
      </div>
      
      <div className="p-4">

        {/* Assigned Counterparties Section */}
        {workflowId && (
          <div className="mb-6">
            <div className="text-xs font-medium text-muted-foreground mb-3 px-1">
              ASSIGNED ({assignedCounterparties?.length || 0})
            </div>
            <div className="space-y-3">
              {!assignedCounterparties || assignedCounterparties.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground/60">
                  <Building2 className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm">No assigned counterparties</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(assignedCounterparties || []).map((assignment) => (
                      <div
                        key={assignment.id}
                        className="bg-muted/30 rounded-lg border border-border p-3"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-xl">{getTypeIcon(assignment.counterparty.type)}</span>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-foreground truncate">
                                {assignment.counterparty.name}
                              </h4>
                              <span className="text-xs text-muted-foreground capitalize">
                                {assignment.counterparty.type.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              title="Edit counterparty"
                              onClick={() => handleEditCounterparty(assignment.counterparty)}
                              className="p-1.5 hover:bg-muted rounded-md transition-colors"
                            >
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              title="Remove from workflow"
                              onClick={() => handleRemoveCounterparty(assignment.id, assignment.counterparty.name)}
                              className="p-1.5 hover:bg-destructive/10 rounded-md text-destructive transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Status Update Dropdown */}
                        <div className="flex items-center gap-2 mb-3">
                          {getStatusIcon(assignment.status)}
                          <select
                            value={assignment.status}
                            onChange={(e) => handleStatusUpdate(assignment.id, e.target.value as WorkflowCounterpartyStatus)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 ${getStatusColor(assignment.status)}`}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="RESPONDED">Responded</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-1.5">
                          {assignment.counterparty.email && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="w-3.5 h-3.5" />
                              <span className="truncate">{assignment.counterparty.email}</span>
                            </div>
                          )}
                          {assignment.counterparty.phone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{assignment.counterparty.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Assignment Date */}
                        <div className="mt-3 pt-2 border-t border-border/30">
                          <span className="text-xs text-muted-foreground">
                            Added {new Date(assignment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Available Counterparties Section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3 px-1">
            <div className="text-xs font-medium text-muted-foreground">
              AVAILABLE ({totalCount})
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && !loading && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-muted-foreground px-2">
                  {currentPage}/{totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          {/* Results Count Info */}
          <div className="mb-4 px-1">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading...
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {totalCount > 0 ? (
                  <>
                    
                    {selectedCounterparties.length > 0 && (
                      <span className="ml-2 text-primary font-medium">
                        • {selectedCounterparties.length} selected
                      </span>
                    )}
                  </>
                ) : (
                  'No counterparties found'
                )}
              </p>
            )}
          </div>

          {/* Counterparty Grid */}
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(filteredCounterparties || []).map((counterparty) => (
                <div
                  key={counterparty.id}
                  onClick={() => toggleSelection(counterparty.id)}
                  className={`bg-card/50 rounded-lg border p-4 cursor-pointer transition-all hover:bg-card/80 hover:shadow-sm ${
                    selectedCounterparties.includes(counterparty.id)
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border/50 hover:border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getTypeIcon(counterparty.type)}</span>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {counterparty.name}
                        </h3>
                        <span className="text-xs text-muted-foreground capitalize">
                          {counterparty.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    {selectedCounterparties.includes(counterparty.id) && (
                      <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    {counterparty.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{counterparty.email}</span>
                      </div>
                    )}
                    {counterparty.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{counterparty.phone}</span>
                      </div>
                    )}
                    {counterparty.address && (
                      <div className="flex items-start gap-2">
                        <Building2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span className="text-xs leading-tight">{counterparty.address}</span>
                      </div>
                    )}
                    {!counterparty.email && !counterparty.phone && !counterparty.address && (
                      <div className="text-xs text-muted-foreground/60 italic">
                        No contact information available
                      </div>
                    )}
                  </div>
                  </div>
                ))}
                
              {(!filteredCounterparties || filteredCounterparties.length === 0) && !loading && (
                <div className="text-center py-12 col-span-full">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-2">No counterparties found</p>
                  <p className="text-sm text-muted-foreground/60">
                    Try adjusting your search criteria or add a new counterparty
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Counterparty Modal */}
      <AddCounterpartyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleCounterpartyCreated}
        allowedTypes={allowedTypes}
      />

      {/* Edit Counterparty Modal */}
      <EditCounterpartyModal
        isOpen={showEditModal && editingCounterparty !== null}
        onClose={() => {
          setShowEditModal(false);
          setEditingCounterparty(null);
        }}
        onSuccess={handleCounterpartyUpdated}
        counterparty={editingCounterparty!}
        allowedTypes={allowedTypes}
      />
    </div>
  );
}