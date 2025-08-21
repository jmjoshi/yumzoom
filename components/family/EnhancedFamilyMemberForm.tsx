'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EnhancedFamilyMember, CreateFamilyMember, UpdateFamilyMember, DietaryRestriction } from '@/types/user';
import { 
  FAMILY_RELATIONSHIPS, 
  AGE_RANGES, 
  DIETARY_RESTRICTIONS, 
  CUISINE_TYPES, 
  PRIVACY_LEVELS 
} from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { X, Plus, Save, Calendar, Shield } from 'lucide-react';

interface EnhancedFamilyMemberFormProps {
  member?: EnhancedFamilyMember;
  onSave: () => void;
  onCancel: () => void;
}

export default function EnhancedFamilyMemberForm({ 
  member, 
  onSave, 
  onCancel 
}: EnhancedFamilyMemberFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryRestriction[]>([]);
  
  const [formData, setFormData] = useState<CreateFamilyMember>({
    name: member?.name || '',
    relationship: member?.relationship || '',
    age_range: member?.age_range || 'adult',
    dietary_restrictions: member?.dietary_restrictions || [],
    favorite_cuisines: member?.favorite_cuisines || [],
    notes: member?.notes || '',
    date_of_birth: member?.date_of_birth || '',
    allergies: member?.allergies || [],
    privacy_level: member?.privacy_level || 'family',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newAllergy, setNewAllergy] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'dietary' | 'preferences' | 'privacy'>('basic');

  // Fetch dietary restrictions on component mount
  useEffect(() => {
    fetchDietaryRestrictions();
  }, []);

  const fetchDietaryRestrictions = async () => {
    try {
      const { data, error } = await supabase
        .from('dietary_restrictions')
        .select('*')
        .order('name');

      if (error) throw error;
      setDietaryRestrictions(data || []);
    } catch (error) {
      console.error('Error fetching dietary restrictions:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.relationship) {
      newErrors.relationship = 'Relationship is required';
    }

    // Age validation for children
    if (formData.age_range === 'child' && formData.privacy_level === 'public') {
      newErrors.privacy_level = 'Children cannot have public profiles for safety';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof CreateFamilyMember, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMultiSelectChange = (field: 'dietary_restrictions' | 'favorite_cuisines' | 'allergies', value: string) => {
    const currentValues = formData[field] || [];
    const updatedValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    
    handleChange(field, updatedValues);
  };

  const addCustomAllergy = () => {
    if (newAllergy.trim() && !formData.allergies?.includes(newAllergy.trim())) {
      handleChange('allergies', [...(formData.allergies || []), newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    handleChange('allergies', formData.allergies?.filter(item => item !== allergy) || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      const memberData: CreateFamilyMember | UpdateFamilyMember = {
        name: formData.name.trim(),
        relationship: formData.relationship,
        age_range: formData.age_range,
        dietary_restrictions: formData.dietary_restrictions,
        favorite_cuisines: formData.favorite_cuisines,
        notes: formData.notes?.trim() || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        allergies: formData.allergies,
        privacy_level: formData.privacy_level,
      };

      if (member) {
        // Update existing member
        const { error } = await supabase
          .from('family_members')
          .update(memberData)
          .eq('id', member.id);

        if (error) throw error;
        toast.success('Family member updated successfully!');
      } else {
        // Create new member
        const { error } = await supabase
          .from('family_members')
          .insert({
            ...memberData,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success('Family member added successfully!');
      }

      onSave();
    } catch (error) {
      console.error('Error saving family member:', error);
      toast.error('Failed to save family member');
    } finally {
      setLoading(false);
    }
  };

  const tabButtons = [
    { id: 'basic', label: 'Basic Info', icon: null },
    { id: 'dietary', label: 'Dietary', icon: null },
    { id: 'preferences', label: 'Preferences', icon: null },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ] as const;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>
          {member ? 'Edit Family Member' : 'Add New Family Member'}
        </CardTitle>
        <CardDescription>
          Provide detailed information to personalize the dining experience.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b border-gray-200 mb-6">
          {tabButtons.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon && <tab.icon className="h-4 w-4" />}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="John Doe"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship *
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => handleChange('relationship', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select relationship</option>
                    {FAMILY_RELATIONSHIPS.map((relationship) => (
                      <option key={relationship} value={relationship}>
                        {relationship}
                      </option>
                    ))}
                  </select>
                  {errors.relationship && (
                    <p className="mt-1 text-sm text-red-600">{errors.relationship}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age Range
                  </label>
                  <select
                    value={formData.age_range || 'adult'}
                    onChange={(e) => handleChange('age_range', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {AGE_RANGES.map((range) => (
                      <option key={range} value={range}>
                        {range.charAt(0).toUpperCase() + range.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Date of Birth (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Any additional notes about this family member..."
                />
              </div>
            </div>
          )}

          {/* Dietary Restrictions Tab */}
          {activeTab === 'dietary' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Dietary Restrictions
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {DIETARY_RESTRICTIONS.map((restriction) => (
                    <label key={restriction} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.dietary_restrictions?.includes(restriction) || false}
                        onChange={() => handleMultiSelectChange('dietary_restrictions', restriction)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{restriction}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Allergies
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <Input
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      placeholder="Add custom allergy..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAllergy())}
                    />
                    <Button
                      type="button"
                      onClick={addCustomAllergy}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {formData.allergies && formData.allergies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.allergies.map((allergy) => (
                        <span
                          key={allergy}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                        >
                          {allergy}
                          <button
                            type="button"
                            onClick={() => removeAllergy(allergy)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Favorite Cuisines
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CUISINE_TYPES.map((cuisine) => (
                    <label key={cuisine} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.favorite_cuisines?.includes(cuisine) || false}
                        onChange={() => handleMultiSelectChange('favorite_cuisines', cuisine)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{cuisine}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Shield className="inline h-4 w-4 mr-1" />
                  Profile Privacy Level
                </label>
                <select
                  value={formData.privacy_level || 'family'}
                  onChange={(e) => handleChange('privacy_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {PRIVACY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.privacy_level && (
                  <p className="mt-1 text-sm text-red-600">{errors.privacy_level}</p>
                )}
                <div className="mt-2 text-sm text-gray-600">
                  <p><strong>Public:</strong> Visible to all YumZoom users</p>
                  <p><strong>Family:</strong> Visible only to your family</p>
                  <p><strong>Private:</strong> Visible only to you</p>
                </div>
              </div>

              {formData.age_range === 'child' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <Shield className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Enhanced Privacy Protection
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Children's profiles have enhanced privacy protection:</p>
                        <ul className="list-disc list-inside mt-1">
                          <li>Cannot be set to public visibility</li>
                          <li>Limited visibility in family recommendations</li>
                          <li>Additional safety controls enabled</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {member ? 'Update Member' : 'Add Member'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
