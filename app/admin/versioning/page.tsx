import React from 'react';
import { ContentVersioningDashboard } from '@/components/versioning/ContentVersioningDashboard';

export default function AdminVersioningPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ContentVersioningDashboard />
      </div>
    </div>
  );
}
