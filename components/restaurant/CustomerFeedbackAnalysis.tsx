import React from 'react';
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  TrendingUp,
  Users,
  Star,
  Activity,
  AlertCircle,
  CheckCircle,
  Coffee,
  Utensils,
  MapPin,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import type { CustomerFeedbackInsights } from '@/types/restaurant-analytics';

interface CustomerFeedbackAnalysisProps {
  data: CustomerFeedbackInsights;
  timeRange: string;
}

export default function CustomerFeedbackAnalysis({ 
  data, 
  timeRange 
}: CustomerFeedbackAnalysisProps) {
  const { 
    feedback_summary, 
    sentiment_breakdown, 
    common_themes,
    actionable_insights 
  } = data;

  // Calculate sentiment percentages
  const neutralPercentage = 100 - sentiment_breakdown.positive_percentage - sentiment_breakdown.negative_percentage;

  // Theme icons mapping
  const themeIcons = {
    service_mentions: Users,
    food_quality_mentions: Utensils,
    ambiance_mentions: Coffee,
    value_mentions: DollarSign
  };

  const themeLabels = {
    service_mentions: 'Service & Staff',
    food_quality_mentions: 'Food Quality',
    ambiance_mentions: 'Atmosphere',
    value_mentions: 'Value & Pricing'
  };

  const getVolumeIndicator = (trend: string) => {
    switch (trend) {
      case 'high':
        return { color: 'text-green-600 bg-green-50', icon: TrendingUp, label: 'High Volume' };
      case 'moderate':
        return { color: 'text-yellow-600 bg-yellow-50', icon: Activity, label: 'Moderate Volume' };
      default:
        return { color: 'text-red-600 bg-red-50', icon: AlertCircle, label: 'Low Volume' };
    }
  };

  const getInsightIcon = (insight: string) => {
    if (insight.toLowerCase().includes('maintain') || insight.toLowerCase().includes('good')) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    if (insight.toLowerCase().includes('focus') || insight.toLowerCase().includes('consider')) {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
    return <Activity className="h-5 w-5 text-blue-600" />;
  };

  const volumeInfo = getVolumeIndicator(feedback_summary.review_volume_trend);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Feedback Analysis</h2>
          <p className="text-gray-600">Insights from {timeRange}</p>
        </div>
        <div className={`mt-4 sm:mt-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${volumeInfo.color}`}>
          <volumeInfo.icon className="h-4 w-4 mr-1" />
          {volumeInfo.label}
        </div>
      </div>

      {/* Summary Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{feedback_summary.total_reviews}</p>
                <p className="text-xs text-gray-500">Written feedback</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <div className="flex items-center space-x-1">
                  <p className="text-2xl font-bold text-gray-900">{feedback_summary.average_rating.toFixed(1)}</p>
                  <Star className="h-5 w-5 text-yellow-400" fill="currentColor" />
                </div>
                <p className="text-xs text-gray-500">Out of 10</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Positive Sentiment</p>
                <p className="text-2xl font-bold text-green-600">{sentiment_breakdown.positive_percentage.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Customer satisfaction</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ThumbsUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-purple-600" />
            <span>Sentiment Distribution</span>
          </CardTitle>
          <CardDescription>
            How customers feel about their experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Sentiment Bars */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Positive</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-gray-600">{sentiment_breakdown.positive}</span>
                  <span className="font-medium text-green-600">{sentiment_breakdown.positive_percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${sentiment_breakdown.positive_percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Activity className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Neutral</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-gray-600">{sentiment_breakdown.neutral}</span>
                  <span className="font-medium text-gray-600">{neutralPercentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gray-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${neutralPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ThumbsDown className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium">Negative</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-gray-600">{sentiment_breakdown.negative}</span>
                  <span className="font-medium text-red-600">{sentiment_breakdown.negative_percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-red-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${sentiment_breakdown.negative_percentage}%` }}
                />
              </div>
            </div>

            {/* Overall Sentiment Indicator */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Overall Sentiment</span>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  sentiment_breakdown.positive_percentage >= 70 ? 'text-green-800 bg-green-100' :
                  sentiment_breakdown.positive_percentage >= 50 ? 'text-yellow-800 bg-yellow-100' :
                  'text-red-800 bg-red-100'
                }`}>
                  {sentiment_breakdown.positive_percentage >= 70 ? 'Very Positive' :
                   sentiment_breakdown.positive_percentage >= 50 ? 'Mixed' : 'Needs Improvement'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Common Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <span>Common Themes</span>
          </CardTitle>
          <CardDescription>
            What customers are talking about most
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(common_themes).map(([key, count]) => {
              const Icon = themeIcons[key as keyof typeof themeIcons];
              const label = themeLabels[key as keyof typeof themeLabels];
              const totalMentions = Object.values(common_themes).reduce((sum, val) => sum + val, 0);
              const percentage = totalMentions > 0 ? ((count / totalMentions) * 100) : 0;

              return (
                <div key={key} className="text-center">
                  <div className="bg-gray-50 rounded-lg p-4 mb-3">
                    <Icon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500">mentions</p>
                  </div>
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>

          {Object.values(common_themes).every(count => count === 0) && (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No thematic data available for this period</p>
              <p className="text-sm">More detailed reviews needed for theme analysis</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actionable Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Actionable Insights</span>
          </CardTitle>
          <CardDescription>
            Recommendations based on customer feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actionable_insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                {getInsightIcon(insight)}
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{insight}</p>
                </div>
              </div>
            ))}

            {actionable_insights.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No specific insights available</p>
                <p className="text-sm">More customer feedback needed for detailed recommendations</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Quality Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Volume Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${volumeInfo.color}`}>
                <volumeInfo.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{volumeInfo.label}</p>
                <p className="text-sm text-gray-600">
                  {feedback_summary.review_volume_trend === 'high' 
                    ? 'Great customer engagement! Your restaurant is receiving plenty of feedback.'
                    : feedback_summary.review_volume_trend === 'moderate'
                    ? 'Good review activity. Consider encouraging more customers to share feedback.'
                    : 'Low review volume. Focus on encouraging customers to leave reviews.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Engagement Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke={sentiment_breakdown.positive_percentage >= 70 ? '#10b981' : 
                           sentiment_breakdown.positive_percentage >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3"
                    strokeDasharray={`${sentiment_breakdown.positive_percentage} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-900">
                    {sentiment_breakdown.positive_percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Customer Satisfaction</p>
                <p className="text-sm text-gray-600">
                  Based on sentiment analysis of reviews
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
