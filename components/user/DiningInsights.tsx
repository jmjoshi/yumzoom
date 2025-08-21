'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useEnhancedProfile } from '@/hooks/useEnhancedProfile';
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  Star, 
  Calendar, 
  MapPin, 
  Clock, 
  Target,
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

const INSIGHT_TYPES = {
  preference_change: {
    icon: TrendingUp,
    title: 'Preference Change',
    color: 'bg-blue-100 text-blue-800'
  },
  new_favorite: {
    icon: Star,
    title: 'New Favorite',
    color: 'bg-yellow-100 text-yellow-800'
  },
  dining_pattern: {
    icon: BarChart3,
    title: 'Dining Pattern',
    color: 'bg-green-100 text-green-800'
  },
  recommendation: {
    icon: Target,
    title: 'Recommendation',
    color: 'bg-purple-100 text-purple-800'
  },
  milestone: {
    icon: Sparkles,
    title: 'Milestone',
    color: 'bg-pink-100 text-pink-800'
  }
};

const IMPORTANCE_COLORS = {
  1: 'border-l-gray-300',
  2: 'border-l-gray-400',
  3: 'border-l-gray-500',
  4: 'border-l-blue-300',
  5: 'border-l-blue-400',
  6: 'border-l-blue-500',
  7: 'border-l-green-400',
  8: 'border-l-green-500',
  9: 'border-l-orange-500',
  10: 'border-l-red-500'
};

export default function DiningInsights() {
  const { 
    insights, 
    markInsightAsRead, 
    generateInsights, 
    refetch 
  } = useEnhancedProfile();
  
  const [filter, setFilter] = useState<'all' | 'unread' | string>('all');
  const [loading, setLoading] = useState(false);

  const handleGenerateInsights = async () => {
    setLoading(true);
    try {
      await generateInsights();
      toast.success('New insights generated!');
    } catch (error) {
      toast.error('Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (insightId: string) => {
    try {
      await markInsightAsRead(insightId);
    } catch (error) {
      toast.error('Failed to mark insight as read');
    }
  };

  const filteredInsights = insights.filter(insight => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !insight.is_read;
    return insight.insight_type === filter;
  });

  const unreadCount = insights.filter(i => !i.is_read).length;

  const getInsightTypeInfo = (type: string) => {
    return INSIGHT_TYPES[type as keyof typeof INSIGHT_TYPES] || INSIGHT_TYPES.recommendation;
  };

  const getImportanceColor = (score: number) => {
    return IMPORTANCE_COLORS[score as keyof typeof IMPORTANCE_COLORS] || 'border-l-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dining Insights</h2>
          <p className="text-gray-600">
            AI-powered insights about your dining patterns and preferences
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handleGenerateInsights}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Generate Insights
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Insights ({insights.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </Button>
        {Object.entries(INSIGHT_TYPES).map(([type, info]) => {
          const count = insights.filter(i => i.insight_type === type).length;
          if (count === 0) return null;
          
          return (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(type)}
            >
              {info.title} ({count})
            </Button>
          );
        })}
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'unread' ? 'No unread insights' : 'No insights yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {filter === 'unread' 
                  ? 'All your insights have been read!'
                  : 'Rate more restaurants and interact with the platform to generate insights'
                }
              </p>
              {filter !== 'unread' && (
                <Button onClick={handleGenerateInsights} disabled={loading}>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Your First Insights
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredInsights.map((insight) => {
            const typeInfo = getInsightTypeInfo(insight.insight_type);
            const Icon = typeInfo.icon;
            const importanceColor = getImportanceColor(insight.importance_score);

            return (
              <Card 
                key={insight.id} 
                className={`border-l-4 ${importanceColor} ${
                  !insight.is_read ? 'bg-blue-50' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {insight.title}
                          </h3>
                          {!insight.is_read && (
                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                              New
                            </Badge>
                          )}
                          <Badge className={typeInfo.color}>
                            {typeInfo.title}
                          </Badge>
                        </div>

                        <p className="text-gray-600 mb-3">
                          {insight.description}
                        </p>

                        {/* Insight Data */}
                        {insight.data && Object.keys(insight.data).length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Additional Details:
                            </h4>
                            <div className="space-y-1">
                              {Object.entries(insight.data).map(([key, value]) => (
                                <div key={key} className="text-sm">
                                  <span className="text-gray-600 capitalize">
                                    {key.replace(/_/g, ' ')}:
                                  </span>
                                  <span className="ml-2 text-gray-900">
                                    {typeof value === 'object' 
                                      ? JSON.stringify(value) 
                                      : String(value)
                                    }
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(insight.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <Activity className="h-4 w-4 mr-1" />
                              Importance: {insight.importance_score}/10
                            </span>
                            {insight.expiry_date && (
                              <span className="flex items-center text-orange-600">
                                <Calendar className="h-4 w-4 mr-1" />
                                Expires: {new Date(insight.expiry_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      {!insight.is_read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(insight.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Insights Summary */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Insights Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(INSIGHT_TYPES).map(([type, info]) => {
                const count = insights.filter(i => i.insight_type === type).length;
                const Icon = info.icon;
                
                return (
                  <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                    <Icon className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <div className="text-lg font-bold text-gray-900">{count}</div>
                    <div className="text-xs text-gray-600">{info.title}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
                <p className="text-sm text-gray-600">Unread Insights</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {insights.filter(i => i.importance_score >= 7).length}
                </div>
                <p className="text-sm text-gray-600">High Importance</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {insights.filter(i => 
                    i.expiry_date && new Date(i.expiry_date) > new Date()
                  ).length}
                </div>
                <p className="text-sm text-gray-600">Active Insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
