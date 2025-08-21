'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useEnhancedProfile } from '@/hooks/useEnhancedProfile';
import { CreatePreferenceTracking } from '@/types/enhanced-profile';
import { 
  Plus, 
  TrendingUp, 
  Heart, 
  Star, 
  Clock, 
  MapPin, 
  DollarSign,
  Utensils,
  Calendar,
  Edit,
  Trash2,
  Brain,
  Target,
  ChefHat
} from 'lucide-react';
import toast from 'react-hot-toast';

const PREFERENCE_TYPES = [
  { value: 'cuisine', label: 'Cuisine', icon: ChefHat },
  { value: 'dietary', label: 'Dietary', icon: Heart },
  { value: 'ambiance', label: 'Ambiance', icon: MapPin },
  { value: 'price_range', label: 'Price Range', icon: DollarSign },
  { value: 'occasion', label: 'Occasion', icon: Calendar },
  { value: 'ingredient', label: 'Ingredient', icon: Utensils }
];

const PREFERENCE_STRENGTH_LABELS = [
  { value: 1, label: 'Dislike', color: 'bg-red-100 text-red-800' },
  { value: 2, label: 'Avoid', color: 'bg-red-50 text-red-600' },
  { value: 3, label: 'Neutral', color: 'bg-gray-100 text-gray-600' },
  { value: 4, label: 'Like', color: 'bg-blue-50 text-blue-600' },
  { value: 5, label: 'Prefer', color: 'bg-blue-100 text-blue-700' },
  { value: 6, label: 'Enjoy', color: 'bg-green-50 text-green-600' },
  { value: 7, label: 'Love', color: 'bg-green-100 text-green-700' },
  { value: 8, label: 'Adore', color: 'bg-purple-50 text-purple-600' },
  { value: 9, label: 'Crave', color: 'bg-purple-100 text-purple-700' },
  { value: 10, label: 'Obsessed', color: 'bg-pink-100 text-pink-700' }
];

const SOURCE_LABELS = {
  manual: { label: 'Manual', icon: Edit, color: 'bg-blue-100 text-blue-800' },
  learned: { label: 'AI Learned', icon: Brain, color: 'bg-green-100 text-green-800' },
  inferred: { label: 'Inferred', icon: Target, color: 'bg-yellow-100 text-yellow-800' }
};

export default function PreferenceTracker() {
  const { preferences, updatePreference, refetch } = useEnhancedProfile();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPreference, setEditingPreference] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('cuisine');
  const [formData, setFormData] = useState<CreatePreferenceTracking>({
    preference_type: 'cuisine',
    preference_value: '',
    preference_strength: 5,
    source: 'manual'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.preference_value.trim()) {
      toast.error('Please enter a preference value');
      return;
    }

    try {
      await updatePreference(formData);
      setShowAddForm(false);
      setEditingPreference(null);
      setFormData({
        preference_type: 'cuisine',
        preference_value: '',
        preference_strength: 5,
        source: 'manual'
      });
    } catch (error) {
      console.error('Error saving preference:', error);
    }
  };

  const handleEdit = (preference: any) => {
    setEditingPreference(preference.id);
    setFormData({
      preference_type: preference.preference_type,
      preference_value: preference.preference_value,
      preference_strength: preference.preference_strength,
      source: preference.source,
      family_member_id: preference.family_member_id
    });
    setShowAddForm(true);
  };

  const getStrengthLabel = (strength: number) => {
    return PREFERENCE_STRENGTH_LABELS.find(s => s.value === strength) || PREFERENCE_STRENGTH_LABELS[2];
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.preference_type]) {
      acc[pref.preference_type] = [];
    }
    acc[pref.preference_type].push(pref);
    return acc;
  }, {} as Record<string, typeof preferences>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Preference Tracking</h2>
          <p className="text-gray-600">Manage your detailed food and dining preferences</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Preference
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingPreference ? 'Edit Preference' : 'Add New Preference'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preference Type
                  </label>
                  <select
                    value={formData.preference_type}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      preference_type: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {PREFERENCE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preference Value
                  </label>
                  <Input
                    value={formData.preference_value}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      preference_value: e.target.value 
                    }))}
                    placeholder="e.g., Italian, Spicy, Vegetarian"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preference Strength: {getStrengthLabel(formData.preference_strength).label}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.preference_strength}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    preference_strength: parseInt(e.target.value) 
                  }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Dislike</span>
                  <span>Neutral</span>
                  <span>Love</span>
                  <span>Obsessed</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingPreference(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPreference ? 'Update' : 'Add'} Preference
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Preference Categories */}
      <div className="space-y-6">
        {PREFERENCE_TYPES.map(type => {
          const Icon = type.icon;
          const typePreferences = groupedPreferences[type.value] || [];
          
          if (typePreferences.length === 0) return null;

          return (
            <Card key={type.value}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon className="h-5 w-5" />
                  <span>{type.label} Preferences</span>
                  <Badge variant="secondary">{typePreferences.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typePreferences
                    .sort((a, b) => b.preference_strength - a.preference_strength)
                    .map(preference => {
                      const strengthInfo = getStrengthLabel(preference.preference_strength);
                      const sourceInfo = SOURCE_LABELS[preference.source as keyof typeof SOURCE_LABELS];
                      const SourceIcon = sourceInfo.icon;

                      return (
                        <div
                          key={preference.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">
                              {preference.preference_value}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(preference)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Strength:</span>
                              <Badge className={strengthInfo.color}>
                                {strengthInfo.label} ({preference.preference_strength})
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Confidence:</span>
                              <span className={`text-sm font-medium ${getConfidenceColor(preference.confidence_score)}`}>
                                {Math.round(preference.confidence_score * 100)}%
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Source:</span>
                              <Badge className={sourceInfo.color}>
                                <SourceIcon className="h-3 w-3 mr-1" />
                                {sourceInfo.label}
                              </Badge>
                            </div>

                            <div className="text-xs text-gray-500">
                              Updated: {new Date(preference.last_updated).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Strength visualization */}
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  preference.preference_strength <= 2 ? 'bg-red-500' :
                                  preference.preference_strength <= 4 ? 'bg-yellow-500' :
                                  preference.preference_strength <= 6 ? 'bg-blue-500' :
                                  preference.preference_strength <= 8 ? 'bg-green-500' :
                                  'bg-purple-500'
                                }`}
                                style={{ width: `${preference.preference_strength * 10}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {preferences.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No preferences tracked yet
            </h3>
            <p className="text-gray-500 mb-4">
              Start building your preference profile to get better recommendations
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Preference
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preference Insights */}
      {preferences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Preference Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {preferences.filter(p => p.preference_strength >= 7).length}
                </div>
                <p className="text-sm text-gray-600">Strong Preferences</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {preferences.filter(p => p.source === 'learned').length}
                </div>
                <p className="text-sm text-gray-600">AI Learned</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(
                    preferences.reduce((sum, p) => sum + p.confidence_score, 0) / 
                    preferences.length * 100
                  )}%
                </div>
                <p className="text-sm text-gray-600">Avg. Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
