'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { TakedownRequestForm } from '@/types/compliance';

interface RestaurantTakedownRequestFormProps {
  restaurantId?: string;
  restaurantName?: string;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

export function RestaurantTakedownRequestForm({
  restaurantId = '',
  restaurantName = '',
  onSuccess,
  onCancel
}: RestaurantTakedownRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [formData, setFormData] = useState<TakedownRequestForm>({
    restaurant_id: restaurantId,
    requester_type: 'customer',
    reason: 'incorrect_information',
    description: '',
    contact_email: '',
    verification_documents: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors: formErrors }
  } = useForm<TakedownRequestForm>({
    defaultValues: formData,
  });

  const watchedRequesterType = watch('requester_type');
  const watchedReason = watch('reason');

  const requesterTypeOptions = [
    { value: 'owner', label: 'Restaurant Owner' },
    { value: 'legal_representative', label: 'Legal Representative' },
    { value: 'customer', label: 'Customer' },
    { value: 'other', label: 'Other' },
  ];

  const reasonOptions = [
    { value: 'ownership_dispute', label: 'Ownership Dispute' },
    { value: 'incorrect_information', label: 'Incorrect Information' },
    { value: 'privacy_violation', label: 'Privacy Violation' },
    { value: 'copyright_violation', label: 'Copyright Violation' },
    { value: 'other', label: 'Other' },
  ];

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const urls = files.map(file => URL.createObjectURL(file));
    setUploadedDocuments(urls);
    setValue('verification_documents', urls);
  };

  const validateForm = (data: TakedownRequestForm): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    if (!data.restaurant_id) newErrors.restaurant_id = 'Restaurant is required';
    if (!data.contact_email) newErrors.contact_email = 'Email is required';
    if (!data.description || data.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    const requiresDocuments = ['ownership_dispute', 'copyright_violation'].includes(data.reason);
    if (requiresDocuments && uploadedDocuments.length === 0) {
      newErrors.verification_documents = 'Supporting documents are required for this type of request';
    }
    
    return newErrors;
  };

  const onSubmit = async (data: TakedownRequestForm) => {
    const validationErrors = validateForm(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const response = await fetch('/api/restaurant-compliance/takedown-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          verification_documents: uploadedDocuments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit takedown request');
      }

      const result = await response.json();
      
      alert('Takedown Request Submitted: Your takedown request has been submitted successfully. We will review it within 48 hours.');
      onSuccess?.(result);
    } catch (error) {
      console.error('Error submitting takedown request:', error);
      alert('Submission Failed: ' + (error instanceof Error ? error.message : 'Failed to submit takedown request'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDescriptionPlaceholder = () => {
    switch (watchedReason) {
      case 'ownership_dispute':
        return 'Please explain why you believe you are the rightful owner of this restaurant listing. Include details about your ownership, management role, or legal authority.';
      case 'incorrect_information':
        return 'Please describe what information is incorrect and provide the correct details. Be specific about which fields need to be updated.';
      case 'privacy_violation':
        return 'Please explain how your privacy has been violated. Include details about what personal information was used without permission.';
      case 'copyright_violation':
        return 'Please describe the copyrighted material that has been used without permission. Include details about your ownership of the content.';
      default:
        return 'Please provide a detailed explanation of your request and the reason for the takedown.';
    }
  };

  const requiresDocuments = ['ownership_dispute', 'copyright_violation'].includes(watchedReason);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Submit Takedown Request</CardTitle>
        <CardDescription>
          {restaurantName ? `Request takedown for ${restaurantName}` : 'Request removal or correction of restaurant information'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Restaurant Selection (if not pre-filled) */}
          {!restaurantId && (
            <div className="space-y-2">
              <Label htmlFor="restaurant_id">Restaurant *</Label>
              <Input
                id="restaurant_id"
                placeholder="Enter restaurant ID or search"
                {...register('restaurant_id')}
              />
              {errors.restaurant_id && (
                <p className="text-sm text-red-500">{errors.restaurant_id}</p>
              )}
            </div>
          )}

          {/* Requester Type */}
          <div className="space-y-2">
            <Label htmlFor="requester_type">Your Relationship to Restaurant *</Label>
            <Select onValueChange={(value) => setValue('requester_type', value as any)}>
              <SelectTrigger>
                <SelectValue>
                  {watch('requester_type') ? requesterTypeOptions.find(opt => opt.value === watch('requester_type'))?.label : 'Select your relationship'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {requesterTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.requester_type && (
              <p className="text-sm text-red-500">{errors.requester_type}</p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Takedown *</Label>
            <Select onValueChange={(value) => setValue('reason', value as any)}>
              <SelectTrigger>
                <SelectValue>
                  {watch('reason') ? reasonOptions.find(opt => opt.value === watch('reason'))?.label : 'Select reason'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {reasonOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason}</p>
            )}
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email *</Label>
            <Input
              id="contact_email"
              type="email"
              placeholder="your@email.com"
              {...register('contact_email')}
            />
            {errors.contact_email && (
              <p className="text-sm text-red-500">{errors.contact_email}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              placeholder={getDescriptionPlaceholder()}
              className="min-h-[120px]"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
            <p className="text-sm text-gray-500">
              {watch('description')?.length || 0}/2000 characters
            </p>
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label>Supporting Documents {requiresDocuments && '*'}</Label>
            <Input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleDocumentUpload}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            />
            <p className="text-sm text-gray-500">
              Upload supporting documents (images, PDFs, documents). Max 5 files.
            </p>
            {errors.verification_documents && (
              <p className="text-sm text-red-500">{errors.verification_documents}</p>
            )}
            {uploadedDocuments.length > 0 && (
              <div className="text-sm text-green-600">
                {uploadedDocuments.length} file(s) selected
              </div>
            )}
          </div>

          {/* Legal Notice */}
          <Alert>
            <AlertDescription>
              <strong>Legal Notice:</strong> By submitting this request, you affirm that the information provided is accurate and that you have the legal authority to make this request. False or fraudulent requests may result in legal action.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || (requiresDocuments && uploadedDocuments.length === 0)}
              onClick={handleSubmit(onSubmit)}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
