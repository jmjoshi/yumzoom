import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Star, 
  ThumbsUp,
  BarChart3,
  PieChart,
  Activity,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import type { 
  RestaurantPerformanceDashboard, 
  PerformanceMetricCard,
  RatingDistributionData 
} from '@/types/restaurant-analytics';

interface RestaurantAnalyticsDashboardProps {
  data: RestaurantPerformanceDashboard;
  timeRange: string;
}

export default function RestaurantAnalyticsDashboard({ 
  data, 
  timeRange 
}: RestaurantAnalyticsDashboardProps) {
  const { 
    restaurant_name,
    current_period,
    previous_period,
    period_comparison,
    rating_distribution,
    customer_insights
  } = data;

  // Calculate rating distribution percentages
  const totalRatings = Object.values(rating_distribution).reduce((sum, count) => sum + count, 0);
  const ratingDistData: RatingDistributionData[] = Object.entries(rating_distribution)
    .map(([key, count]) => ({
      rating: parseInt(key.replace('_star', '')),
      count: count as number,
      percentage: totalRatings > 0 ? ((count as number) / totalRatings) * 100 : 0
    }))
    .filter(item => item.rating <= 10)
    .sort((a, b) => b.rating - a.rating);

  // Performance metrics cards data
  const metricsCards: PerformanceMetricCard[] = [
    {
      title: 'Total Ratings',
      value: current_period.total_ratings,
      change: period_comparison.ratings_change,
      changeType: period_comparison.ratings_change > 0 ? 'increase' : 
                  period_comparison.ratings_change < 0 ? 'decrease' : 'neutral',
      format: 'number',
      icon: Star
    },
    {
      title: 'Average Rating',
      value: current_period.average_rating,
      change: period_comparison.rating_change,
      changeType: period_comparison.rating_change > 0 ? 'increase' : 
                  period_comparison.rating_change < 0 ? 'decrease' : 'neutral',
      format: 'rating',
      icon: TrendingUp
    },
    {
      title: 'Unique Customers',
      value: current_period.unique_customers,
      change: period_comparison.customers_change,
      changeType: period_comparison.customers_change > 0 ? 'increase' : 
                  period_comparison.customers_change < 0 ? 'decrease' : 'neutral',
      format: 'number',
      icon: Users
    },
    {
      title: 'Response Rate',
      value: current_period.response_rate,
      format: 'percentage',
      icon: MessageSquare
    }
  ];

  const formatValue = (value: number | string, format?: string): string => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'rating':
        return `${value.toFixed(1)}/10`;
      case 'currency':
        return `$${value.toFixed(2)}`;
      default:
        return value.toLocaleString();
    }
  };

  const getChangeIcon = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChangeColor = (changeType?: string): string => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-gray-600">{restaurant_name} • {timeRange}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            customer_insights.avg_rating_trend === 'improving' 
              ? 'bg-green-100 text-green-800'
              : customer_insights.avg_rating_trend === 'declining'
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {customer_insights.avg_rating_trend === 'improving' && <TrendingUp className="h-4 w-4 mr-1" />}
            {customer_insights.avg_rating_trend === 'declining' && <TrendingDown className="h-4 w-4 mr-1" />}
            {customer_insights.avg_rating_trend === 'stable' && <Activity className="h-4 w-4 mr-1" />}
            Rating Trend: {customer_insights.avg_rating_trend}
          </div>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsCards.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatValue(metric.value, metric.format)}
                  </p>
                  {metric.change !== undefined && (
                    <div className={`flex items-center mt-1 ${getChangeColor(metric.changeType)}`}>
                      {getChangeIcon(metric.changeType)}
                      <span className="ml-1 text-sm font-medium">
                        {metric.change > 0 ? '+' : ''}{formatValue(metric.change, metric.format)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  {metric.icon && (() => {
                    const IconComponent = metric.icon;
                    return <IconComponent className="h-6 w-6 text-orange-600" />;
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rating Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle>Rating Distribution</CardTitle>
            </div>
            <CardDescription>
              How customers rate your restaurant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ratingDistData.map((item) => (
                <div key={item.rating} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 w-16">
                    <span className="text-sm font-medium">{item.rating}</span>
                    <Star className="h-3 w-3 text-yellow-400" fill="currentColor" />
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm text-gray-600">{item.count}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {totalRatings === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No ratings data available for this period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Insights */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <CardTitle>Customer Insights</CardTitle>
            </div>
            <CardDescription>
              Understanding your customer base
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Retention</p>
                <p className="text-lg font-bold text-gray-900">
                  {customer_insights.customer_retention.toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">New Customers</span>
                <span className="text-sm font-medium">
                  {period_comparison.customers_change > 0 ? period_comparison.customers_change : 0}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Reviews with Responses</span>
                <span className="text-sm font-medium">
                  {current_period.total_responses} of {current_period.total_reviews}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Response Rate Goal</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        current_period.response_rate >= 80 ? 'bg-green-500' :
                        current_period.response_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(current_period.response_rate, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">80%</span>
                </div>
              </div>
            </div>

            {/* Rating trend indicator */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overall Performance</span>
                <div className="flex items-center space-x-1">
                  {current_period.average_rating >= 8 && (
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    current_period.average_rating >= 8 ? 'text-green-600' :
                    current_period.average_rating >= 6 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {current_period.average_rating >= 8 ? 'Excellent' :
                     current_period.average_rating >= 6 ? 'Good' : 'Needs Improvement'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-purple-600" />
            <CardTitle>Period Comparison</CardTitle>
          </div>
          <CardDescription>
            Performance changes compared to previous {timeRange}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Ratings Change</p>
              <div className="flex items-center justify-center space-x-1">
                {getChangeIcon(period_comparison.ratings_change > 0 ? 'increase' : 
                              period_comparison.ratings_change < 0 ? 'decrease' : 'neutral')}
                <span className={`text-lg font-bold ${getChangeColor(
                  period_comparison.ratings_change > 0 ? 'increase' : 
                  period_comparison.ratings_change < 0 ? 'decrease' : 'neutral'
                )}`}>
                  {period_comparison.ratings_change > 0 ? '+' : ''}{period_comparison.ratings_change}
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Rating Change</p>
              <div className="flex items-center justify-center space-x-1">
                {getChangeIcon(period_comparison.rating_change > 0 ? 'increase' : 
                              period_comparison.rating_change < 0 ? 'decrease' : 'neutral')}
                <span className={`text-lg font-bold ${getChangeColor(
                  period_comparison.rating_change > 0 ? 'increase' : 
                  period_comparison.rating_change < 0 ? 'decrease' : 'neutral'
                )}`}>
                  {period_comparison.rating_change > 0 ? '+' : ''}{period_comparison.rating_change.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Customer Change</p>
              <div className="flex items-center justify-center space-x-1">
                {getChangeIcon(period_comparison.customers_change > 0 ? 'increase' : 
                              period_comparison.customers_change < 0 ? 'decrease' : 'neutral')}
                <span className={`text-lg font-bold ${getChangeColor(
                  period_comparison.customers_change > 0 ? 'increase' : 
                  period_comparison.customers_change < 0 ? 'decrease' : 'neutral'
                )}`}>
                  {period_comparison.customers_change > 0 ? '+' : ''}{period_comparison.customers_change}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
