import React from 'react';
import { CommunityGuidelines } from '@/components/moderation/CommunityGuidelines';

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <CommunityGuidelines />
      </div>
    </div>
  );
}
