'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Mail, Phone, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { counterpartiesApi } from '@/lib/api/endpoints/counterparties';
import { toast } from '@/lib/hooks/use-toast';
import type { CounterpartyType, UpdateCounterpartyRequest, Counterparty } from '@rexera/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Counterparty</DialogTitle>
          <DialogDescription>
            Update counterparty information and contact details
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter counterparty name"
                className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
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
          <div className="space-y-2">
            <Label>
              Type <span className="text-destructive">*</span>
            </Label>
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
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@example.com"
                  className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
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
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
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
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter full address"
                rows={2}
                className={`flex w-full rounded-md border border-input bg-transparent pl-10 pr-4 py-3 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none md:text-sm ${
                  errors.address ? 'border-destructive' : ''
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Counterparty'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}