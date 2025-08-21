'use client';

import { SocialStats as SocialStatsType } from '@/types/social';
import { Users, Heart, MessageSquare, Vote, Activity, TrendingUp } from 'lucide-react';

interface SocialStatsProps {
  stats: SocialStatsType | null;
}

export function SocialStats({ stats }: SocialStatsProps) {
  if (!stats) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      icon: Users,
      label: 'Connections',
      value: stats.connections_count,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: Heart,
      label: 'Recommendations',
      value: stats.recommendations_received_count,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      badge: stats.unread_recommendations_count > 0 ? stats.unread_recommendations_count : undefined
    },
    {
      icon: Vote,
      label: 'Collaborations',
      value: stats.active_collaborations_count,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: Activity,
      label: 'Activities',
      value: stats.total_activities_count,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="space-y-4">
      {statItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <div key={item.label} className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${item.bgColor}`}>
              <IconComponent className={`h-4 w-4 ${item.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.label}
                </p>
                {item.badge && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-lg font-semibold text-gray-900">{item.value}</p>
            </div>
          </div>
        );
      })}
      
      {stats.pending_requests_count > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                {stats.pending_requests_count} pending request{stats.pending_requests_count !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-blue-600">
                Review connection requests
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
