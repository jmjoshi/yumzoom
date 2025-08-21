'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useEnhancedProfile } from '@/hooks/useEnhancedProfile';
import { UpdatePersonalizationSettings } from '@/types/enhanced-profile';
import { 
  Settings, 
  Brain, 
  Target, 
  Zap, 
  Shield, 
  Users, 
  MapPin, 
  DollarSign,
  Lightbulb,
  Activity,
  AlertCircle,
  Save,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

const RECOMMENDATION_FREQUENCIES = [
  { value: 'conservative', label: 'Conservative', description: 'Fewer, highly relevant suggestions' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced mix of safe and new recommendations' },
  { value: 'aggressive', label: 'Aggressive', description: 'Many diverse suggestions to explore' }
];

const DIETARY_STRICTNESS_OPTIONS = [
  { value: 'flexible', label: 'Flexible', description: 'Show options that mostly match dietary needs' },
  { value: 'moderate', label: 'Moderate', description: 'Filter out obvious conflicts' },
  { value: 'strict', label: 'Strict', description: 'Only show perfectly matching options' }
];

export default function PersonalizationSettings() {
  const { 
    personalizationSettings, 
    updatePersonalizationSettings,
    refetch 
  } = useEnhancedProfile();
  
  const [formData, setFormData] = useState<UpdatePersonalizationSettings>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize form data when settings are loaded
  useEffect(() => {
    if (personalizationSettings) {
      setFormData({
        auto_learn_preferences: personalizationSettings.auto_learn_preferences,
        recommendation_frequency: personalizationSettings.recommendation_frequency,
        exploration_vs_exploitation: personalizationSettings.exploration_vs_exploitation,
        dietary_strictness: personalizationSettings.dietary_strictness,
        social_discovery_enabled: personalizationSettings.social_discovery_enabled,
        location_based_suggestions: personalizationSettings.location_based_suggestions,
        price_sensitivity: personalizationSettings.price_sensitivity
      });
    }
  }, [personalizationSettings]);

  // Track changes
  useEffect(() => {
    if (personalizationSettings) {
      const hasAnyChanges = Object.keys(formData).some(key => {
        const formValue = formData[key as keyof UpdatePersonalizationSettings];
        const settingsValue = personalizationSettings[key as keyof typeof personalizationSettings];
        return formValue !== settingsValue;
      });
      setHasChanges(hasAnyChanges);
    }
  }, [formData, personalizationSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePersonalizationSettings(formData);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (personalizationSettings) {
      setFormData({
        auto_learn_preferences: personalizationSettings.auto_learn_preferences,
        recommendation_frequency: personalizationSettings.recommendation_frequency,
        exploration_vs_exploitation: personalizationSettings.exploration_vs_exploitation,
        dietary_strictness: personalizationSettings.dietary_strictness,
        social_discovery_enabled: personalizationSettings.social_discovery_enabled,
        location_based_suggestions: personalizationSettings.location_based_suggestions,
        price_sensitivity: personalizationSettings.price_sensitivity
      });
    }
  };

  const updateFormData = (updates: Partial<UpdatePersonalizationSettings>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  if (!personalizationSettings) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Personalization Settings</h2>
          <p className="text-gray-600">
            Customize how YumZoom learns and recommends restaurants for you
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {hasChanges && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <p className="text-blue-800">You have unsaved changes. Don't forget to save!</p>
          </div>
        </div>
      )}

      {/* AI Learning Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Learning Preferences</span>
          </CardTitle>
          <CardDescription>
            Control how YumZoom learns from your behavior and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-learn Preferences */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Automatic Preference Learning</h4>
              <p className="text-sm text-gray-600">
                Allow YumZoom to automatically learn your preferences from your ratings and choices
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.auto_learn_preferences ?? true}
                onChange={(e) => updateFormData({ auto_learn_preferences: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Recommendation Frequency */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recommendation Frequency</h4>
            <div className="space-y-3">
              {RECOMMENDATION_FREQUENCIES.map((option) => (
                <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="recommendation_frequency"
                    value={option.value}
                    checked={formData.recommendation_frequency === option.value}
                    onChange={(e) => updateFormData({ recommendation_frequency: e.target.value as any })}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Exploration vs Exploitation */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Discovery Balance</h4>
            <p className="text-sm text-gray-600 mb-4">
              Balance between familiar favorites (left) and new discoveries (right)
            </p>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={formData.exploration_vs_exploitation ?? 50}
                onChange={(e) => updateFormData({ exploration_vs_exploitation: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Familiar (0%)</span>
                <span className="font-medium text-gray-900">
                  {formData.exploration_vs_exploitation ?? 50}% Discovery
                </span>
                <span>Adventurous (100%)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dietary and Safety Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Dietary & Safety Preferences</span>
          </CardTitle>
          <CardDescription>
            Configure how strictly dietary restrictions are applied
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dietary Strictness */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Dietary Restriction Strictness</h4>
            <div className="space-y-3">
              {DIETARY_STRICTNESS_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="dietary_strictness"
                    value={option.value}
                    checked={formData.dietary_strictness === option.value}
                    onChange={(e) => updateFormData({ dietary_strictness: e.target.value as any })}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Price Sensitivity */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Price Sensitivity</h4>
            <p className="text-sm text-gray-600 mb-4">
              How much should price factor into recommendations?
            </p>
            <div className="space-y-2">
              <input
                type="range"
                min="1"
                max="10"
                value={formData.price_sensitivity ?? 5}
                onChange={(e) => updateFormData({ price_sensitivity: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Not Important</span>
                <span className="font-medium text-gray-900">
                  Level {formData.price_sensitivity ?? 5}
                </span>
                <span>Very Important</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discovery and Social Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Discovery & Social Settings</span>
          </CardTitle>
          <CardDescription>
            Control how you discover new restaurants and interact socially
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Social Discovery */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Social Discovery</h4>
              <p className="text-sm text-gray-600">
                Include recommendations from friends and family networks
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.social_discovery_enabled ?? true}
                onChange={(e) => updateFormData({ social_discovery_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Location-based Suggestions */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Location-based Suggestions</h4>
              <p className="text-sm text-gray-600">
                Show restaurants near your current location or frequently visited areas
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.location_based_suggestions ?? true}
                onChange={(e) => updateFormData({ location_based_suggestions: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Current Configuration Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Learning Mode</h4>
              <p className="text-sm text-gray-600">
                {formData.auto_learn_preferences ? 'Active' : 'Manual Only'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Recommendation Style</h4>
              <p className="text-sm text-gray-600 capitalize">
                {formData.recommendation_frequency || 'Moderate'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Discovery Balance</h4>
              <p className="text-sm text-gray-600">
                {(formData.exploration_vs_exploitation ?? 50)}% New Places
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Dietary Strictness</h4>
              <p className="text-sm text-gray-600 capitalize">
                {formData.dietary_strictness || 'Moderate'}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Price Sensitivity</h4>
              <p className="text-sm text-gray-600">
                Level {formData.price_sensitivity ?? 5} of 10
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Social Features</h4>
              <p className="text-sm text-gray-600">
                {formData.social_discovery_enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button (sticky at bottom) */}
      {hasChanges && (
        <div className="sticky bottom-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              You have unsaved changes to your personalization settings.
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
