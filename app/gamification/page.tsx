import React from 'react';
import { Metadata } from 'next';
import AdvancedGamificationDashboard from '@/components/gamification/AdvancedGamificationDashboard';

export const metadata: Metadata = {
  title: 'Advanced Gamification - YumZoom',
  description: 'Take on dining challenges, set goals, and compete with your family for culinary achievements',
};

export default function GamificationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <AdvancedGamificationDashboard />
    </div>
  );
}
