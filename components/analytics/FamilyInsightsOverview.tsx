'use client';

import { FamilyInsights, TimeRange } from '@/types/analytics';
import { Card, CardContent } from '@/components/ui/Card';
import { MapPin, Star, Users, DollarSign, Calendar, TrendingUp } from 'lucide-react';

interface FamilyInsightsOverviewProps {
  data: FamilyInsights | null;
  timeRange: TimeRange;
}

export function FamilyInsightsOverview({ data, timeRange }: FamilyInsightsOverviewProps) {
  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No data available for the selected time period</p>
      </div>
    );
  }

  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case 'week': return 'this week';
      case 'month': return 'this month';
      case 'quarter': return 'this quarter';
      case 'year': return 'this year';
      default: return 'this period';
    }
  };

  const insightCards = [
    {
      title: 'Restaurants Visited',
      value: data.total_restaurants,
      description: `Different restaurants visited ${getTimeRangeLabel(timeRange)}`,
      icon: MapPin,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Ratings',
      value: data.total_ratings,
      description: `Menu items rated by your family`,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Average Rating',
      value: data.average_family_rating,
      description: 'Family\'s average satisfaction score',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      suffix: '/10',
    },
    {
      title: 'Active Members',
      value: `${data.active_members}/${data.total_family_members}`,
      description: 'Family members who rated this period',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Estimated Spending',
      value: data.estimated_spending,
      description: 'Based on rated menu item prices',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      prefix: '$',
    },
  ];

  const engagementPercentage = data.total_family_members > 0 
    ? (data.active_members / data.total_family_members) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {insightCards.map((card, index) => (
          <Card key={index} className={`${card.bgColor} border-0`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {card.prefix}{card.value}{card.suffix}
                </p>
                <p className="text-xs font-medium text-gray-700">
                  {card.title}
                </p>
                <p className="text-xs text-gray-600">
                  {card.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Family Engagement */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Family Engagement</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Members</span>
                <span className="text-sm font-medium">{data.active_members} of {data.total_family_members}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${engagementPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {engagementPercentage.toFixed(1)}% of your family actively rated restaurants {getTimeRangeLabel(timeRange)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dining Activity */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Dining Activity</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg. Ratings per Restaurant</span>
                <span className="text-sm font-medium">
                  {data.total_restaurants > 0 ? (data.total_ratings / data.total_restaurants).toFixed(1) : '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estimated per Visit</span>
                <span className="text-sm font-medium">
                  ${data.total_restaurants > 0 ? (data.estimated_spending / data.total_restaurants).toFixed(2) : '0'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Your family has been actively exploring different dining options
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600 text-center">
          Analytics for {getTimeRangeLabel(timeRange)} 
          <span className="text-gray-500 ml-2">
            ({new Date(data.period_start).toLocaleDateString()} - {new Date(data.period_end).toLocaleDateString()})
          </span>
        </p>
      </div>
    </div>
  );
}
