'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Users,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface FeatureFlag {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  category: string;
  is_enabled: boolean;
  rollout_percentage: number;
  created_at: string;
  updated_at: string;
}

interface CreateFeatureFlagData {
  name: string;
  display_name: string;
  description: string;
  category: string;
  is_enabled: boolean;
  rollout_percentage: number;
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'social', label: 'Social' },
  { value: 'gamification', label: 'Gamification' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'content', label: 'Content' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'future', label: 'Future Tech' },
  { value: 'moderation', label: 'Moderation' },
  { value: 'business', label: 'Business' }
];

export function FeatureFlagsDashboard() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [togglingFlag, setTogglingFlag] = useState<string | null>(null);

  useEffect(() => {
    fetchFeatureFlags();
  }, []);

  const fetchFeatureFlags = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/feature-flags');
      if (!response.ok) {
        throw new Error('Failed to fetch feature flags');
      }

      const data = await response.json();
      setFeatureFlags(data.featureFlags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async (flagId: string, currentState: boolean) => {
    setTogglingFlag(flagId);
    try {
      const response = await fetch(`/api/feature-flags/${flagId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_enabled: !currentState,
          reason: `Feature ${!currentState ? 'enabled' : 'disabled'} via admin dashboard`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle feature flag');
      }

      // Update local state
      setFeatureFlags(flags =>
        flags.map(flag =>
          flag.id === flagId
            ? { ...flag, is_enabled: !currentState, updated_at: new Date().toISOString() }
            : flag
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle feature flag');
    } finally {
      setTogglingFlag(null);
    }
  };

  const handleCreateFeature = async (data: CreateFeatureFlagData) => {
    try {
      const response = await fetch('/api/feature-flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create feature flag');
      }

      setShowCreateDialog(false);
      fetchFeatureFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create feature flag');
    }
  };

  const handleUpdateFeature = async (flagId: string, data: Partial<CreateFeatureFlagData>) => {
    try {
      const response = await fetch(`/api/feature-flags/${flagId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          reason: 'Feature updated via admin dashboard'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update feature flag');
      }

      setEditingFlag(null);
      fetchFeatureFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feature flag');
    }
  };

  const handleDeleteFeature = async (flagId: string) => {
    if (!confirm('Are you sure you want to delete this feature flag? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/feature-flags/${flagId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete feature flag');
      }

      fetchFeatureFlags();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete feature flag');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      general: 'bg-gray-100 text-gray-800',
      social: 'bg-blue-100 text-blue-800',
      gamification: 'bg-purple-100 text-purple-800',
      analytics: 'bg-green-100 text-green-800',
      content: 'bg-orange-100 text-orange-800',
      accessibility: 'bg-pink-100 text-pink-800',
      future: 'bg-indigo-100 text-indigo-800',
      moderation: 'bg-red-100 text-red-800',
      business: 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || colors.general;
  };

  const groupedFlags = featureFlags.reduce((acc, flag) => {
    if (!acc[flag.category]) {
      acc[flag.category] = [];
    }
    acc[flag.category].push(flag);
    return acc;
  }, {} as { [key: string]: FeatureFlag[] });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading feature flags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Feature Flags</h1>
            <p className="text-muted-foreground">
              Manage feature toggles and rollout percentages
            </p>
          </div>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Add Feature Flag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Feature Flag</DialogTitle>
              <DialogDescription>
                Add a new feature flag to control feature availability.
              </DialogDescription>
            </DialogHeader>
            <FeatureFlagForm
              onSubmit={handleCreateFeature}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <ToggleRight className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {featureFlags.filter(f => f.is_enabled).length}
                </p>
                <p className="text-sm text-muted-foreground">Enabled Features</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <ToggleLeft className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold">
                  {featureFlags.filter(f => !f.is_enabled).length}
                </p>
                <p className="text-sm text-muted-foreground">Disabled Features</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {featureFlags.filter(f => f.rollout_percentage < 100).length}
                </p>
                <p className="text-sm text-muted-foreground">Partial Rollouts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{featureFlags.length}</p>
                <p className="text-sm text-muted-foreground">Total Features</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Flags by Category */}
      <div className="space-y-6">
        {Object.entries(groupedFlags).map(([category, flags]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className={getCategoryColor(category)}>
                  {CATEGORIES.find(c => c.value === category)?.label || category}
                </Badge>
                <span className="text-lg">{flags.length} feature{flags.length !== 1 ? 's' : ''}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flags.map((flag) => (
                  <FeatureFlagItem
                    key={flag.id}
                    flag={flag}
                    onToggle={handleToggleFeature}
                    onEdit={setEditingFlag}
                    onDelete={handleDeleteFeature}
                    toggling={togglingFlag === flag.id}
                    categoryColor={getCategoryColor(flag.category)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingFlag && (
        <Dialog open={!!editingFlag} onOpenChange={() => setEditingFlag(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Feature Flag</DialogTitle>
              <DialogDescription>
                Update the feature flag settings.
              </DialogDescription>
            </DialogHeader>
            <FeatureFlagForm
              initialData={editingFlag}
              onSubmit={(data) => handleUpdateFeature(editingFlag.id, data)}
              onCancel={() => setEditingFlag(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Feature Flag Item Component
function FeatureFlagItem({
  flag,
  onToggle,
  onEdit,
  onDelete,
  toggling,
  categoryColor
}: {
  flag: FeatureFlag;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (flag: FeatureFlag) => void;
  onDelete: (id: string) => void;
  toggling: boolean;
  categoryColor: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-medium">{flag.display_name}</h3>
          <Badge className={categoryColor}>
            {flag.category}
          </Badge>
          <Badge variant={flag.is_enabled ? 'default' : 'secondary'}>
            {flag.is_enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>

        {flag.description && (
          <p className="text-sm text-muted-foreground mb-2">{flag.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Rollout: {flag.rollout_percentage}%</span>
          <span>Updated: {new Date(flag.updated_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={flag.is_enabled}
          onCheckedChange={() => onToggle(flag.id, flag.is_enabled)}
          disabled={toggling}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(flag)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(flag.id)}
          className="text-red-600 hover:text-red-800"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Feature Flag Form Component
function FeatureFlagForm({
  initialData,
  onSubmit,
  onCancel
}: {
  initialData?: FeatureFlag;
  onSubmit: (data: CreateFeatureFlagData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<CreateFeatureFlagData>({
    name: initialData?.name || '',
    display_name: initialData?.display_name || '',
    description: initialData?.description || '',
    category: initialData?.category || 'general',
    is_enabled: initialData?.is_enabled ?? false,
    rollout_percentage: initialData?.rollout_percentage ?? 100
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Feature Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., social_features"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Unique identifier for the feature (use snake_case)
        </p>
      </div>

      <div>
        <Label htmlFor="display_name">Display Name</Label>
        <Input
          id="display_name"
          value={formData.display_name}
          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
          placeholder="e.g., Social Features"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this feature does..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="rollout_percentage">Rollout Percentage</Label>
        <Input
          id="rollout_percentage"
          type="number"
          min="0"
          max="100"
          value={formData.rollout_percentage}
          onChange={(e) => setFormData({ ...formData, rollout_percentage: parseInt(e.target.value) || 0 })}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Percentage of users who will see this feature (0-100)
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_enabled"
          checked={formData.is_enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
        />
        <Label htmlFor="is_enabled">Enable feature immediately</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update' : 'Create'} Feature Flag
        </Button>
      </div>
    </form>
  );
}
