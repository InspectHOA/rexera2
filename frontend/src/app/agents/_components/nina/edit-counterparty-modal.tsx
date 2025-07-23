'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2, Mail, Phone, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { counterpartiesApi } from '@/lib/api/counterparties';
import { toast } from '@/lib/hooks/use-toast';
import type { CounterpartyType, UpdateCounterpartyRequest, Counterparty } from '@rexera/shared';

interface EditCounterpartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (counterparty: Counterparty) => void;
  counterparty: Counterparty;
  allowedTypes?: CounterpartyType[];
}

interface FormData {
  name: string;
  type: CounterpartyType;
  email: string;
  phone: string;
  address: string;
}

const COUNTERPARTY_TYPE_INFO: Record<CounterpartyType, { name: string; icon: string; description: string }> = {
  hoa: {
    name: 'HOA',
    icon: '🏘️',
    description: 'Homeowners Association'
  },
  lender: {
    name: 'Lender',
    icon: '🏦',
    description: 'Financial Institution'
  },
  municipality: {
    name: 'Municipality',
    icon: '🏢',
    description: 'City or Government Entity'
  },
  utility: {
    name: 'Utility',
    icon: '⚡',
    description: 'Utility Company'
  },
  tax_authority: {
    name: 'Tax Authority',
    icon: '🏛️',
    description: 'Tax Collection Agency'
  }
};

export function EditCounterpartyModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  counterparty,
  allowedTypes = ['hoa', 'lender', 'municipality', 'utility', 'tax_authority']
}: EditCounterpartyModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'hoa',
    email: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with counterparty data when modal opens
  useEffect(() => {
    if (isOpen && counterparty) {
      setFormData({
        name: counterparty.name,
        type: counterparty.type,
        email: counterparty.email || '',
        phone: counterparty.phone || '',
        address: counterparty.address || ''
      });
      setErrors({});
    }
  }, [isOpen, counterparty]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Name must be less than 255 characters';
    }

    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    // Optional email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: UpdateCounterpartyRequest = {
        name: formData.name.trim() !== counterparty.name ? formData.name.trim() : undefined,
        type: formData.type !== counterparty.type ? formData.type : undefined,
        email: formData.email.trim() !== (counterparty.email || '') ? formData.email.trim() || undefined : undefined,
        phone: formData.phone.trim() !== (counterparty.phone || '') ? formData.phone.trim() || undefined : undefined,
        address: formData.address.trim() !== (counterparty.address || '') ? formData.address.trim() || undefined : undefined,
      };

      // Only send fields that have changed
      const hasChanges = Object.values(updateData).some(value => value !== undefined);
      
      if (!hasChanges) {
        toast({
          title: 'No Changes',
          description: 'No changes were made to the counterparty.',
        });
        onClose();
        return;
      }

      const result = await counterpartiesApi.update(counterparty.id, updateData);

      toast({
        title: 'Success',
        description: `${formData.name} has been updated successfully.`,
      });

      onSuccess?.(result.data);
      onClose();
    } catch (error) {
      console.error('Failed to update counterparty:', error);
      
      let errorMessage = 'Failed to update counterparty. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Edit Counterparty</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Update counterparty information and contact details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name Field */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground/70">
              Name <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter counterparty name"
                className={`w-full pl-10 pr-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground ${
                  errors.name ? 'border-destructive' : 'border-border'
                }`}
                disabled={isSubmitting}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Type Selection */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground/70">
              Type <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allowedTypes.map((type) => {
                const info = COUNTERPARTY_TYPE_INFO[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleInputChange('type', type)}
                    disabled={isSubmitting}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      formData.type === type
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card hover:border-border/70 text-foreground'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{info.icon}</span>
                      <span className="font-medium text-sm">{info.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                  </button>
                );
              })}
            </div>
            {errors.type && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.type}
              </p>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground/70">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@example.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground ${
                    errors.email ? 'border-destructive' : 'border-border'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground/70">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className={`w-full pl-10 pr-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground ${
                    errors.phone ? 'border-destructive' : 'border-border'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          {/* Address Field */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground/70">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter full address"
                rows={2}
                className={`w-full pl-10 pr-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground resize-none ${
                  errors.address ? 'border-destructive' : 'border-border'
                }`}
                disabled={isSubmitting}
              />
            </div>
            {errors.address && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.address}
              </p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Update Counterparty
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}