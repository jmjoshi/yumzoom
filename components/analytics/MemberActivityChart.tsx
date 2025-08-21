'use client';

import { MemberActivity } from '@/types/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StarRating } from '@/components/ui/Rating';
import { formatDate } from '@/lib/utils';
import { User, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MemberActivityChartProps {
  data: MemberActivity[];
}

export function MemberActivityChart({ data }: MemberActivityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No family member activity data available</p>
        <p className="text-sm text-gray-400 mt-1">
          Add family members and start rating together!
        </p>
      </div>
    );
  }

  // Prepare data for the chart
  const chartData = data.map(member => ({
    name: member.member_name.length > 10 
      ? member.member_name.substring(0, 10) + '...'
      : member.member_name,
    fullName: member.member_name,
    ratings: member.rating_count,
    averageRating: member.average_rating,
    relationship: member.relationship,
    lastActivity: member.most_recent_activity,
    favoriteRestaurant: member.favorite_restaurant,
    favoriteCuisine: member.favorite_cuisine,
    trend: member.engagement_trend,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center space-x-2 mb-2">
            <User className="h-4 w-4 text-gray-600" />
            <p className="font-semibold text-gray-900">{data.fullName}</p>
          </div>
          {data.relationship && (
            <p className="text-sm text-gray-600 mb-2">{data.relationship}</p>
          )}
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              Ratings: <span className="font-medium">{data.ratings}</span>
            </p>
            <p className="text-sm text-gray-600">
              Avg Rating: <span className="font-medium">{data.averageRating.toFixed(1)}/10</span>
            </p>
            {data.favoriteRestaurant && (
              <p className="text-sm text-gray-600">
                Favorite: <span className="font-medium">{data.favoriteRestaurant}</span>
              </p>
            )}
            {data.favoriteCuisine && (
              <p className="text-sm text-gray-600">
                Cuisine: <span className="font-medium">{data.favoriteCuisine}</span>
              </p>
            )}
            <p className="text-xs text-gray-500">
              Last activity: {formatDate(data.lastActivity)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Calculate engagement level
  const maxRatings = Math.max(...data.map(m => m.rating_count), 1);
  const getEngagementLevel = (ratings: number) => {
    if (ratings === 0) return 'No Activity';
    if (ratings < maxRatings * 0.3) return 'Low';
    if (ratings < maxRatings * 0.7) return 'Medium';
    return 'High';
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="name" 
              fontSize={12}
              stroke="#6b7280"
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="ratings" 
              fill="#8b5cf6" 
              radius={[4, 4, 0, 0]}
              name="Number of Ratings"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Member Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((member, index) => (
          <div 
            key={member.member_id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{member.member_name}</h4>
                  {member.relationship && (
                    <p className="text-sm text-gray-500">{member.relationship}</p>
                  )}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                getEngagementColor(getEngagementLevel(member.rating_count))
              }`}>
                {getEngagementLevel(member.rating_count)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{member.rating_count}</p>
                <p className="text-xs text-gray-500">Ratings</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">{member.average_rating.toFixed(1)}</p>
                <StarRating value={member.average_rating} size="sm" />
              </div>
            </div>

            {(member.favorite_restaurant || member.favorite_cuisine) && (
              <div className="space-y-2 mb-3">
                {member.favorite_restaurant && (
                  <div>
                    <p className="text-xs text-gray-500">Favorite Restaurant</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.favorite_restaurant}
                    </p>
                  </div>
                )}
                {member.favorite_cuisine && (
                  <div>
                    <p className="text-xs text-gray-500">Favorite Cuisine</p>
                    <p className="text-sm font-medium text-gray-900">
                      {member.favorite_cuisine}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                {getTrendIcon(member.engagement_trend)}
                <span className={`text-xs font-medium ${getTrendColor(member.engagement_trend)}`}>
                  {member.engagement_trend === 'up' ? 'More Active' : 
                   member.engagement_trend === 'down' ? 'Less Active' : 'Stable'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {member.rating_count > 0 ? formatDate(member.most_recent_activity) : 'No activity'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-purple-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-purple-900 mb-3">Activity Summary</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-purple-700">Most Active Member</p>
            <p className="font-medium text-purple-900">
              {data.length > 0 ? data[0].member_name : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-purple-700">Total Family Ratings</p>
            <p className="font-medium text-purple-900">
              {data.reduce((sum, member) => sum + member.rating_count, 0)}
            </p>
          </div>
          <div>
            <p className="text-purple-700">Average Family Rating</p>
            <p className="font-medium text-purple-900">
              {data.length > 0 
                ? (data.reduce((sum, member) => sum + member.average_rating, 0) / data.length).toFixed(1)
                : '0'
              }/10
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
