import React from 'react';
import { FeatureFlagsDashboard } from '@/components/feature-flags/FeatureFlagsDashboard';

export default function AdminFeatureFlagsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <FeatureFlagsDashboard />
      </div>
    </div>
  );
}
