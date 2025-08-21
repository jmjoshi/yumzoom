'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserPrivacySettings, UpdateUserPrivacySettings } from '@/types/user';
import { PRIVACY_LEVELS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Users, 
  Globe, 
  Lock, 
  Bell, 
  Mail,
  Smartphone,
  UserCheck,
  Activity,
  Save
} from 'lucide-react';

export default function PrivacySettings() {
  const { user } = useAuth();
  const [privacySettings, setPrivacySettings] = useState<UserPrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateUserPrivacySettings>({});

  const fetchPrivacySettings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPrivacySettings(data);
        setFormData({
          profile_visibility: data.profile_visibility,
          dining_history_visibility: data.dining_history_visibility,
          reviews_visibility: data.reviews_visibility,
          favorites_visibility: data.favorites_visibility,
          allow_friend_requests: data.allow_friend_requests,
          show_activity_status: data.show_activity_status,
          email_notifications: data.email_notifications,
          push_notifications: data.push_notifications,
          family_member_public_visibility: data.family_member_public_visibility,
        });
      } else {
        // Create default privacy settings if none exist
        await createDefaultPrivacySettings();
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      toast.error('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createDefaultPrivacySettings = async () => {
    if (!user) return;

    try {
      const defaultSettings = {
        user_id: user.id,
        profile_visibility: 'family' as const,
        dining_history_visibility: 'family' as const,
        reviews_visibility: 'public' as const,
        favorites_visibility: 'family' as const,
        allow_friend_requests: true,
        show_activity_status: true,
        email_notifications: true,
        push_notifications: true,
        family_member_public_visibility: false,
      };

      const { data, error } = await supabase
        .from('user_privacy_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (error) throw error;

      setPrivacySettings(data);
      setFormData({
        profile_visibility: data.profile_visibility,
        dining_history_visibility: data.dining_history_visibility,
        reviews_visibility: data.reviews_visibility,
        favorites_visibility: data.favorites_visibility,
        allow_friend_requests: data.allow_friend_requests,
        show_activity_status: data.show_activity_status,
        email_notifications: data.email_notifications,
        push_notifications: data.push_notifications,
        family_member_public_visibility: data.family_member_public_visibility,
      });
    } catch (error) {
      console.error('Error creating default privacy settings:', error);
      toast.error('Failed to create privacy settings');
    }
  };

  useEffect(() => {
    if (user) {
      fetchPrivacySettings();
    }
  }, [user, fetchPrivacySettings]);

  const handleChange = (field: keyof UpdateUserPrivacySettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user || !privacySettings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_privacy_settings')
        .update(formData)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Privacy settings updated successfully!');
      fetchPrivacySettings();
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error('Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const getVisibilityIcon = (level: string) => {
    switch (level) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'friends': return <UserCheck className="h-4 w-4" />;
      case 'family': return <Users className="h-4 w-4" />;
      case 'private': return <Lock className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getVisibilityDescription = (level: string) => {
    switch (level) {
      case 'public': return 'Visible to all YumZoom users';
      case 'friends': return 'Visible to friends and connections';
      case 'family': return 'Visible only to your family';
      case 'private': return 'Visible only to you';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          <Shield className="inline h-8 w-8 mr-2" />
          Privacy & Security Settings
        </h1>
        <p className="text-lg text-gray-600">
          Control who can see your information and how you receive notifications.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Visibility Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Profile Visibility
            </CardTitle>
            <CardDescription>
              Choose who can see different parts of your YumZoom profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Information
                </label>
                <select
                  value={formData.profile_visibility || 'family'}
                  onChange={(e) => handleChange('profile_visibility', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {PRIVACY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {getVisibilityDescription(formData.profile_visibility || 'family')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dining History
                </label>
                <select
                  value={formData.dining_history_visibility || 'family'}
                  onChange={(e) => handleChange('dining_history_visibility', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {PRIVACY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {getVisibilityDescription(formData.dining_history_visibility || 'family')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reviews & Ratings
                </label>
                <select
                  value={formData.reviews_visibility || 'public'}
                  onChange={(e) => handleChange('reviews_visibility', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {PRIVACY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {getVisibilityDescription(formData.reviews_visibility || 'public')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Favorites & Wishlist
                </label>
                <select
                  value={formData.favorites_visibility || 'family'}
                  onChange={(e) => handleChange('favorites_visibility', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {PRIVACY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {getVisibilityDescription(formData.favorites_visibility || 'family')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Social Settings
            </CardTitle>
            <CardDescription>
              Manage how you interact with other families on YumZoom.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Allow Friend Requests
                </label>
                <p className="text-sm text-gray-500">
                  Let other families send you friend requests
                </p>
              </div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={formData.allow_friend_requests ?? true}
                  onChange={(e) => handleChange('allow_friend_requests', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Show Activity Status
                </label>
                <p className="text-sm text-gray-500">
                  Let friends see when you're active on YumZoom
                </p>
              </div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={formData.show_activity_status ?? true}
                  onChange={(e) => handleChange('show_activity_status', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Family Member Public Visibility
                </label>
                <p className="text-sm text-gray-500">
                  Allow family members to appear in public recommendations
                </p>
              </div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={formData.family_member_public_visibility ?? false}
                  onChange={(e) => handleChange('family_member_public_visibility', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose how you want to be notified about YumZoom activities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Receive updates and recommendations via email
                  </p>
                </div>
              </div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={formData.email_notifications ?? true}
                  onChange={(e) => handleChange('email_notifications', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Smartphone className="h-4 w-4 mr-2 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Push Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Receive real-time notifications on your device
                  </p>
                </div>
              </div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={formData.push_notifications ?? true}
                  onChange={(e) => handleChange('push_notifications', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Child Safety Information */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <Shield className="h-5 w-5 mr-2" />
              Child Safety & Privacy
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Enhanced protection measures for children in your family.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-yellow-800">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <Lock className="h-4 w-4 mr-2" />
                Children's profiles are automatically restricted from public visibility
              </li>
              <li className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Additional privacy controls are applied to protect minors
              </li>
              <li className="flex items-center">
                <EyeOff className="h-4 w-4 mr-2" />
                Limited exposure in social features and recommendations
              </li>
              <li className="flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Activity monitoring with parental oversight capabilities
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={saving}
            className="px-6"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Privacy Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
