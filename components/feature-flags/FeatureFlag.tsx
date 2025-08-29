'use client';

import React from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';

interface FeatureFlagProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on feature flag status
 */
export function FeatureFlag({ feature, children, fallback = null, loading = null }: FeatureFlagProps) {
  const { enabled, loading: isLoading } = useFeatureFlag(feature);

  if (isLoading) {
    return <>{loading}</>;
  }

  if (!enabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for feature flag gating
 */
export function withFeatureFlag<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  featureName: string,
  fallback?: React.ComponentType<P> | React.ReactNode
) {
  return function FeatureFlaggedComponent(props: P) {
    const { enabled, loading } = useFeatureFlag(featureName);

    if (loading) {
      return <div>Loading...</div>; // You can customize this
    }

    if (!enabled) {
      if (React.isValidElement(fallback)) {
        return fallback;
      }
      if (typeof fallback === 'function') {
        const FallbackComponent = fallback;
        return <FallbackComponent {...props} />;
      }
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * Hook for imperative feature flag checks
 */
export function useFeatureFlagGuard(featureName: string) {
  const { enabled, loading, error } = useFeatureFlag(featureName);

  return {
    canAccess: enabled,
    loading,
    error,
    requireFeature: (callback: () => void, fallback?: () => void) => {
      if (loading) return;
      if (enabled) {
        callback();
      } else if (fallback) {
        fallback();
      }
    }
  };
}
