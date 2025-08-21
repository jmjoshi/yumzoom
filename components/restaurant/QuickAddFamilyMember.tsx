'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { FAMILY_RELATIONSHIPS } from '@/lib/constants';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuickAddFamilyMemberProps {
  onMemberAdded: () => void;
  onCancel: () => void;
}

interface QuickFamilyMemberForm {
  name: string;
  relationship: string;
}

export function QuickAddFamilyMember({ onMemberAdded, onCancel }: QuickAddFamilyMemberProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<QuickFamilyMemberForm>({
    name: '',
    relationship: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof QuickFamilyMemberForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('family_members')
        .insert({
          user_id: user.id,
          name: formData.name.trim(),
          relationship: formData.relationship || 'Other',
        });

      if (error) throw error;
      toast.success('Family member added successfully!');
      onMemberAdded();
    } catch (error) {
      console.error('Error adding family member:', error);
      toast.error('Failed to add family member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Quick Add Family Member</CardTitle>
            <CardDescription className="text-sm">
              Add a family member to rate this item
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name *"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            placeholder="Enter name"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship
            </label>
            <select
              value={formData.relationship}
              onChange={(e) => handleChange('relationship', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select relationship</option>
              {FAMILY_RELATIONSHIPS.map((relationship) => (
                <option key={relationship} value={relationship}>
                  {relationship}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3 pt-2">
            <Button
              type="submit"
              size="sm"
              loading={submitting}
              disabled={submitting}
              className="flex-1"
            >
              Add Member
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
