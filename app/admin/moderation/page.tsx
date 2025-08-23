import React from 'react';
import { ModerationDashboard } from '@/components/moderation/ModerationDashboard';

export default function AdminModerationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ModerationDashboard />
      </div>
    </div>
  );
}
