'use client';

import { useState, useEffect } from 'react';
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

interface UseFeatureFlagResult {
  enabled: boolean;
  loading: boolean;
  error: string | null;
}

interface UseFeatureFlagsResult {
  features: { [key: string]: boolean };
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to check if a specific feature is enabled for the current user
 */
export function useFeatureFlag(featureName: string): UseFeatureFlagResult {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkFeatureFlag();
  }, [featureName]);

  const checkFeatureFlag = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      const response = await fetch(
        `/api/feature-flags/check?feature=${encodeURIComponent(featureName)}${userId ? `&userId=${userId}` : ''}`
      );

      if (!response.ok) {
        throw new Error('Failed to check feature flag');
      }

      const data = await response.json();
      setEnabled(data.enabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  return { enabled, loading, error };
}

/**
 * Hook to check multiple feature flags at once
 */
export function useFeatureFlags(featureNames: string[]): UseFeatureFlagsResult {
  const [features, setFeatures] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkFeatureFlags = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      const response = await fetch('/api/feature-flags/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          features: featureNames,
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to check feature flags');
      }

      const data = await response.json();
      setFeatures(data.features);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Set all features to false on error
      const errorFeatures = featureNames.reduce((acc, name) => {
        acc[name] = false;
        return acc;
      }, {} as { [key: string]: boolean });
      setFeatures(errorFeatures);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (featureNames.length > 0) {
      checkFeatureFlags();
    }
  }, [featureNames.join(',')]);

  const refetch = () => {
    checkFeatureFlags();
  };

  return { features, loading, error, refetch };
}

/**
 * Hook to get all feature flags (admin use)
 */
export function useAllFeatureFlags() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchFeatureFlags();
  }, []);

  const refetch = () => {
    fetchFeatureFlags();
  };

  return { featureFlags, loading, error, refetch };
}

/**
 * Utility function to check feature flag synchronously (for server-side or immediate checks)
 */
export async function checkFeatureFlag(featureName: string, userId?: string): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/feature-flags/check?feature=${encodeURIComponent(featureName)}${userId ? `&userId=${userId}` : ''}`
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.enabled;
  } catch (error) {
    console.error('Error checking feature flag:', error);
    return false;
  }
}

/**
 * Utility function to track feature usage
 */
export async function trackFeatureUsage(
  featureName: string,
  action: string = 'used',
  metadata: any = {}
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) return;

    await supabase.rpc('track_feature_usage', {
      p_feature_name: featureName,
      p_user_id: userId,
      p_action: action,
      p_metadata: metadata
    });
  } catch (error) {
    console.error('Error tracking feature usage:', error);
  }
}
