'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Building, MapPin, Calendar, User, FileText, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkflows } from '@/lib/hooks/use-workflows';
import { useAuth } from '@/lib/auth/provider';
import { api } from '@/lib/api/client';
import { SKIP_AUTH, SKIP_AUTH_USER } from '@/lib/auth/config';
import type { WorkflowType, PriorityLevel } from '@rexera/shared';

interface WorkflowCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ClientOption {
  id: string;
  name: string;
  domain?: string;
}

interface FormData {
  workflow_type: WorkflowType;
  client_id: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  due_date: string;
  metadata: Record<string, any>;
}

interface WorkflowTypeInfo {
  name: string;
  description: string;
  icon: string;
  fields: {
    key: string;
    label: string;
    type: 'text' | 'date' | 'number' | 'email';
    placeholder: string;
    required?: boolean;
    icon?: any;
  }[];
  titleTemplate: (metadata: Record<string, any>) => string;
}

const WORKFLOW_TYPES: Record<WorkflowType, WorkflowTypeInfo> = {
  MUNI_LIEN_SEARCH: {
    name: 'Municipal Lien Search',
    description: 'Research and obtain municipal lien certificates for property transactions',
    icon: '🏛️',
    fields: [
      { key: 'property_address', label: 'Property Address', type: 'text', placeholder: '123 Main St, City, State 12345', required: true, icon: MapPin },
      { key: 'closing_date', label: 'Closing Date', type: 'date', placeholder: '', required: true, icon: Calendar },
      { key: 'municipality_name', label: 'Municipality', type: 'text', placeholder: 'City of Springfield', icon: Building },
      { key: 'apn', label: 'APN/Parcel Number', type: 'text', placeholder: '123-456-789', icon: FileText },
    ],
    titleTemplate: (metadata) => `Muni Lien Search - ${metadata.property_address || 'New Property'}`
  },
  HOA_ACQUISITION: {
    name: 'HOA Document Acquisition',
    description: 'Request and collect HOA documents, fees, and governing documents',
    icon: '🏘️',
    fields: [
      { key: 'property_address', label: 'Property Address', type: 'text', placeholder: '123 Main St, City, State 12345', required: true, icon: MapPin },
      { key: 'closing_date', label: 'Closing Date', type: 'date', placeholder: '', required: true, icon: Calendar },
      { key: 'hoa_name', label: 'HOA Name', type: 'text', placeholder: 'Sunset Ridge HOA', icon: Building },
      { key: 'hoa_management_company', label: 'Management Company', type: 'text', placeholder: 'ABC Property Management', icon: Building },
      { key: 'hoa_phone', label: 'HOA Phone', type: 'text', placeholder: '(555) 123-4567', icon: User },
    ],
    titleTemplate: (metadata) => `HOA Docs - ${metadata.hoa_name || metadata.property_address || 'New Request'}`
  },
  PAYOFF_REQUEST: {
    name: 'Mortgage Payoff Request',
    description: 'Request payoff statements and coordinate loan payoffs for property closings',
    icon: '💰',
    fields: [
      { key: 'property_address', label: 'Property Address', type: 'text', placeholder: '123 Main St, City, State 12345', required: true, icon: MapPin },
      { key: 'closing_date', label: 'Closing Date', type: 'date', placeholder: '', required: true, icon: Calendar },
      { key: 'borrower_name', label: 'Borrower Name', type: 'text', placeholder: 'John & Jane Smith', icon: User },
      { key: 'loan_number', label: 'Loan Number', type: 'text', placeholder: '1234567890', icon: FileText },
      { key: 'lender_name', label: 'Lender Name', type: 'text', placeholder: 'First National Bank', icon: Building },
      { key: 'payoff_amount_estimate', label: 'Est. Payoff Amount', type: 'number', placeholder: '250000', icon: DollarSign },
    ],
    titleTemplate: (metadata) => `Payoff - ${metadata.borrower_name || metadata.property_address || 'New Request'}`
  }
};

const PRIORITY_OPTIONS: { value: PriorityLevel; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'text-green-600 dark:text-green-400' },
  { value: 'NORMAL', label: 'Normal', color: 'text-blue-600 dark:text-blue-400' },
  { value: 'HIGH', label: 'High', color: 'text-orange-600 dark:text-orange-400' },
  { value: 'URGENT', label: 'Urgent', color: 'text-destructive' },
];

export function WorkflowCreationModal({ isOpen, onClose, onSuccess }: WorkflowCreationModalProps) {
  const { user } = useAuth();
  const { createWorkflowAsync, isCreating } = useWorkflows();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    workflow_type: 'MUNI_LIEN_SEARCH',
    client_id: '',
    title: '',
    description: '',
    priority: 'NORMAL',
    due_date: '',
    metadata: {}
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load clients on mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await api.clients.list();
        setClients(clientsData);
      } catch (error) {
        console.error('Failed to load clients:', error);
        setClients([]);
      } finally {
        setLoadingClients(false);
      }
    };

    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  // Auto-generate title when workflow type or metadata changes
  useEffect(() => {
    const workflowInfo = WORKFLOW_TYPES[formData.workflow_type];
    const autoTitle = workflowInfo.titleTemplate(formData.metadata);
    if (autoTitle !== formData.title) {
      setFormData(prev => ({ ...prev, title: autoTitle }));
    }
  }, [formData.workflow_type, formData.metadata]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        workflow_type: 'MUNI_LIEN_SEARCH',
        client_id: '',
        title: '',
        description: '',
        priority: 'NORMAL',
        due_date: '',
        metadata: {}
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMetadataChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: value }
    }));
    if (errors[`metadata.${field}`]) {
      setErrors(prev => ({ ...prev, [`metadata.${field}`]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const workflowInfo = WORKFLOW_TYPES[formData.workflow_type];

    // Required fields
    if (!formData.client_id) {
      newErrors.client_id = 'Client is required';
    }
    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    }

    // Validate workflow-specific metadata (property_address and closing_date are required)
    workflowInfo.fields.forEach(field => {
      const value = formData.metadata[field.key];
      
      if (field.required && !value?.trim()) {
        newErrors[`metadata.${field.key}`] = `${field.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isFormValid = validateForm();
    
    if (!isFormValid) {
      return;
    }
    
    // Handle SKIP_AUTH mode - use hardcoded user if no user is available
    let userId = user?.id;
    if (!userId && SKIP_AUTH) {
      userId = SKIP_AUTH_USER.id;
    }
    
    if (!userId) {
      setErrors({ submit: 'User not authenticated. Please refresh and try again.' });
      return;
    }

    try {
      // Convert date string to ISO datetime format
      const convertToDateTime = (dateString: string) => {
        if (!dateString) return undefined;
        const date = new Date(dateString + 'T23:59:59.999Z'); // End of day
        return date.toISOString();
      };

      // Convert any date fields in metadata to datetime format
      const processedMetadata = { ...formData.metadata };
      if (processedMetadata.closing_date) {
        processedMetadata.closing_date = convertToDateTime(processedMetadata.closing_date);
      }

      const workflowData = {
        workflow_type: formData.workflow_type,
        client_id: formData.client_id,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        metadata: processedMetadata,
        due_date: convertToDateTime(formData.due_date),
        created_by: userId
      };

      const result = await createWorkflowAsync(workflowData);
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('❌ Failed to create workflow:', error);
      console.error('❌ Error details:', {
        message: (error as any)?.message,
        status: (error as any)?.status,
        response: (error as any)?.response?.data,
        stack: (error as any)?.stack
      });
      setErrors({ submit: 'Failed to create workflow. Please try again.' });
    }
  };

  const currentWorkflowInfo = WORKFLOW_TYPES[formData.workflow_type];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-2xl border border-border/50 w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{currentWorkflowInfo.icon}</div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Create New Workflow</h2>
                <p className="text-sm text-muted-foreground mt-1">{currentWorkflowInfo.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              disabled={isCreating}
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-140px)]">
          <div className="p-6 space-y-4">
            {/* Workflow Type Selection */}
            <div className="space-y-3">

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(WORKFLOW_TYPES).map(([type, info]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleInputChange('workflow_type', type as WorkflowType)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      formData.workflow_type === type
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card hover:border-border/70 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{info.icon}</span>
                      <span className="font-medium text-sm">{info.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Client Selection */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground/70">
                Client <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => handleInputChange('client_id', e.target.value)}
                disabled={loadingClients}
                className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground ${
                  errors.client_id ? 'border-destructive' : 'border-border'
                }`}
              >
                <option value="">
                  {loadingClients ? 'Loading clients...' : 'Select a client'}
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {errors.client_id && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.client_id}
                </p>
              )}
            </div>

            {/* Workflow-Specific Fields */}
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentWorkflowInfo.fields.map((field, index) => {
                  const IconComponent = field.icon;
                  const isPropertyAddress = field.key === 'property_address';
                  const isClosingDate = field.key === 'closing_date';
                  
                  return (
                    <React.Fragment key={field.key}>
                      <div className={`${isPropertyAddress ? 'sm:col-span-2' : ''} space-y-1`}>
                        <label className="text-xs text-muted-foreground/70">
                          {field.label} {field.required && <span className="text-destructive">*</span>}
                        </label>
                        <div className="relative">
                          {IconComponent && (
                            <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          )}
                          <input
                            type={field.type}
                            value={formData.metadata[field.key] || ''}
                            onChange={(e) => handleMetadataChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className={`w-full ${IconComponent ? 'pl-10' : 'pl-3'} pr-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground ${
                              errors[`metadata.${field.key}`] ? 'border-destructive' : 'border-border'
                            }`}
                          />
                        </div>
                        {errors[`metadata.${field.key}`] && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {errors[`metadata.${field.key}`]}
                          </p>
                        )}
                      </div>
                      
                      {/* Add Due Date right after Closing Date */}
                      {isClosingDate && (
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground/70">
                            Due Date <span className="text-destructive">*</span>
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                              type="date"
                              value={formData.due_date}
                              onChange={(e) => handleInputChange('due_date', e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className={`w-full pl-10 pr-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground ${
                                errors.due_date ? 'border-destructive' : 'border-border'
                              }`}
                            />
                          </div>
                          {errors.due_date && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {errors.due_date}
                            </p>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* General Fields */}
            <div className="space-y-3">
              {/* Priority */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground/70">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value as PriorityLevel)}
                  className="w-full px-3 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
                >
                  <option value="" disabled>Select Priority</option>
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>


            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground/70">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Optional additional details about this workflow..."
                rows={3}
                className="w-full px-3 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-muted/50 px-6 py-4 border-t border-border flex items-center justify-between">
            {errors.submit && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.submit}
              </p>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || loadingClients}
                className="flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Workflow
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}