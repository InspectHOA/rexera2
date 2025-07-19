'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Building, MapPin, Calendar, User, FileText, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkflows } from '@/lib/hooks/useWorkflows';
import { useAuth } from '@/lib/auth/provider';
import { api } from '@/lib/api/client';
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
      { key: 'municipality_name', label: 'Municipality', type: 'text', placeholder: 'City of Springfield', required: true, icon: Building },
      { key: 'apn', label: 'APN/Parcel Number', type: 'text', placeholder: '123-456-789', icon: FileText },
      { key: 'closing_date', label: 'Closing Date', type: 'date', placeholder: '', icon: Calendar },
    ],
    titleTemplate: (metadata) => `Muni Lien Search - ${metadata.property_address || 'New Property'}`
  },
  HOA_ACQUISITION: {
    name: 'HOA Document Acquisition',
    description: 'Request and collect HOA documents, fees, and governing documents',
    icon: '🏘️',
    fields: [
      { key: 'property_address', label: 'Property Address', type: 'text', placeholder: '123 Main St, City, State 12345', required: true, icon: MapPin },
      { key: 'hoa_name', label: 'HOA Name', type: 'text', placeholder: 'Sunset Ridge HOA', required: true, icon: Building },
      { key: 'hoa_management_company', label: 'Management Company', type: 'text', placeholder: 'ABC Property Management', icon: Building },
      { key: 'hoa_phone', label: 'HOA Phone', type: 'text', placeholder: '(555) 123-4567', icon: User },
      { key: 'closing_date', label: 'Closing Date', type: 'date', placeholder: '', icon: Calendar },
    ],
    titleTemplate: (metadata) => `HOA Docs - ${metadata.hoa_name || metadata.property_address || 'New Request'}`
  },
  PAYOFF_REQUEST: {
    name: 'Mortgage Payoff Request',
    description: 'Request payoff statements and coordinate loan payoffs for property closings',
    icon: '💰',
    fields: [
      { key: 'property_address', label: 'Property Address', type: 'text', placeholder: '123 Main St, City, State 12345', required: true, icon: MapPin },
      { key: 'borrower_name', label: 'Borrower Name', type: 'text', placeholder: 'John & Jane Smith', required: true, icon: User },
      { key: 'loan_number', label: 'Loan Number', type: 'text', placeholder: '1234567890', required: true, icon: FileText },
      { key: 'lender_name', label: 'Lender Name', type: 'text', placeholder: 'First National Bank', required: true, icon: Building },
      { key: 'closing_date', label: 'Closing Date', type: 'date', placeholder: '', required: true, icon: Calendar },
      { key: 'payoff_amount_estimate', label: 'Est. Payoff Amount', type: 'number', placeholder: '250000', icon: DollarSign },
    ],
    titleTemplate: (metadata) => `Payoff - ${metadata.borrower_name || metadata.property_address || 'New Request'}`
  }
};

const PRIORITY_OPTIONS: { value: PriorityLevel; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'text-green-600' },
  { value: 'NORMAL', label: 'Normal', color: 'text-blue-600' },
  { value: 'HIGH', label: 'High', color: 'text-orange-600' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-600' },
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
    if (!formData.client_id) newErrors.client_id = 'Client is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';

    // Validate workflow-specific metadata
    workflowInfo.fields.forEach(field => {
      if (field.required && !formData.metadata[field.key]?.trim()) {
        newErrors[`metadata.${field.key}`] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user?.id) return;

    try {
      const workflowData = {
        workflow_type: formData.workflow_type,
        client_id: formData.client_id,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        metadata: formData.metadata,
        due_date: formData.due_date || undefined,
        created_by: user.id
      };

      await createWorkflowAsync(workflowData);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create workflow:', error);
      setErrors({ submit: 'Failed to create workflow. Please try again.' });
    }
  };

  const currentWorkflowInfo = WORKFLOW_TYPES[formData.workflow_type];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200/50 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{currentWorkflowInfo.icon}</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Create New Workflow</h2>
                <p className="text-sm text-gray-600 mt-1">{currentWorkflowInfo.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isCreating}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Workflow Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-900">
                Workflow Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(WORKFLOW_TYPES).map(([type, info]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleInputChange('workflow_type', type as WorkflowType)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      formData.workflow_type === type
                        ? 'border-primary-500 bg-primary-50 text-primary-900'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => handleInputChange('client_id', e.target.value)}
                disabled={loadingClients}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.client_id ? 'border-red-300' : 'border-gray-300'
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
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.client_id}
                </p>
              )}
            </div>

            {/* Workflow-Specific Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <span className="text-xl">{currentWorkflowInfo.icon}</span>
                {currentWorkflowInfo.name} Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentWorkflowInfo.fields.map((field) => {
                  const IconComponent = field.icon;
                  return (
                    <div key={field.key} className={field.key === 'property_address' ? 'sm:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <div className="relative">
                        {IconComponent && (
                          <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        )}
                        <input
                          type={field.type}
                          value={formData.metadata[field.key] || ''}
                          onChange={(e) => handleMetadataChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className={`w-full ${IconComponent ? 'pl-10' : 'pl-3'} pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                            errors[`metadata.${field.key}`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {errors[`metadata.${field.key}`] && (
                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {errors[`metadata.${field.key}`]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* General Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value as PriorityLevel)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Title (Auto-generated but editable) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Workflow title will be auto-generated"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.title && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Optional additional details about this workflow..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            {errors.submit && (
              <p className="text-sm text-red-600 flex items-center gap-1">
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