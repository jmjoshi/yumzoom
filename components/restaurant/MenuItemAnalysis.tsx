import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Star, 
  DollarSign,
  ChefHat,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { MenuItemPerformance } from '@/types/restaurant-analytics';

interface MenuItemAnalysisProps {
  data: MenuItemPerformance[];
  timeRange: string;
}

type SortField = 'name' | 'rating' | 'volume' | 'score' | 'trend';
type SortOrder = 'asc' | 'desc';

export default function MenuItemAnalysis({ data, timeRange }: MenuItemAnalysisProps) {
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Get unique categories for filtering
  const categories = ['all', ...new Set(data.map(item => item.category).filter(Boolean))];

  // Filter and sort data
  const filteredAndSortedData = data
    .filter(item => categoryFilter === 'all' || item.category === categoryFilter)
    .sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'name':
          aValue = a.menu_item_name.toLowerCase();
          bValue = b.menu_item_name.toLowerCase();
          break;
        case 'rating':
          aValue = a.average_rating;
          bValue = b.average_rating;
          break;
        case 'volume':
          aValue = a.total_ratings;
          bValue = b.total_ratings;
          break;
        case 'score':
          aValue = a.performance_score;
          bValue = b.performance_score;
          break;
        case 'trend':
          aValue = a.rating_trend === 'improving' ? 3 : a.rating_trend === 'stable' ? 2 : 1;
          bValue = b.rating_trend === 'improving' ? 3 : b.rating_trend === 'stable' ? 2 : 1;
          break;
        default:
          aValue = a.performance_score;
          bValue = b.performance_score;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? 
        (aValue as number) - (bValue as number) : 
        (bValue as number) - (aValue as number);
    });

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-50';
      case 'declining':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRecommendationIcon = (recommendation: string) => {
    if (recommendation.toLowerCase().includes('popular') || recommendation.toLowerCase().includes('featuring')) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (recommendation.toLowerCase().includes('review') || recommendation.toLowerCase().includes('investigate')) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
    return <Info className="h-4 w-4 text-blue-600" />;
  };

  // Calculate summary statistics
  const topPerformers = filteredAndSortedData.filter(item => item.performance_score >= 80);
  const needsAttention = filteredAndSortedData.filter(item => item.performance_score < 60);
  const improvingItems = filteredAndSortedData.filter(item => item.rating_trend === 'improving');
  const decliningItems = filteredAndSortedData.filter(item => item.rating_trend === 'declining');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Menu Item Performance</h2>
          <p className="text-gray-600">Analysis for {timeRange}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Performers</p>
                <p className="text-2xl font-bold text-green-600">{topPerformers.length}</p>
                <p className="text-xs text-gray-500">Score ≥ 80</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Needs Attention</p>
                <p className="text-2xl font-bold text-red-600">{needsAttention.length}</p>
                <p className="text-xs text-gray-500">Score &lt; 60</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Improving</p>
                <p className="text-2xl font-bold text-green-600">{improvingItems.length}</p>
                <p className="text-xs text-gray-500">Trending up</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Declining</p>
                <p className="text-2xl font-bold text-red-600">{decliningItems.length}</p>
                <p className="text-xs text-gray-500">Trending down</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category || 'Uncategorized'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <ArrowUpDown className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortField(field as SortField);
                  setSortOrder(order as SortOrder);
                }}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="score-desc">Performance Score (High to Low)</option>
                <option value="score-asc">Performance Score (Low to High)</option>
                <option value="rating-desc">Rating (High to Low)</option>
                <option value="rating-asc">Rating (Low to High)</option>
                <option value="volume-desc">Review Volume (High to Low)</option>
                <option value="volume-asc">Review Volume (Low to High)</option>
                <option value="name-asc">Name (A to Z)</option>
                <option value="name-desc">Name (Z to A)</option>
                <option value="trend-desc">Trend (Best to Worst)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items List */}
      <div className="space-y-4">
        {filteredAndSortedData.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
              <p className="text-gray-600">
                {categoryFilter !== 'all' 
                  ? `No items found in the "${categoryFilter}" category for this time period.`
                  : 'No menu item data available for this time period.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedData.map((item) => (
            <Card key={item.menu_item_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  {/* Item Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{item.menu_item_name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          {item.category && (
                            <span className="flex items-center">
                              <ChefHat className="h-4 w-4 mr-1" />
                              {item.category}
                            </span>
                          )}
                          {item.price && (
                            <span className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {item.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Average Rating</p>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                          <span className="font-semibold">{item.average_rating.toFixed(1)}</span>
                          <span className="text-gray-500">/10</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Ratings</p>
                        <p className="font-semibold">{item.total_ratings}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Performance Score</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(item.performance_score)}`}>
                          {item.performance_score.toFixed(0)}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Trend</p>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(item.rating_trend)}`}>
                          {getTrendIcon(item.rating_trend)}
                          <span className="ml-1 capitalize">{item.rating_trend}</span>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {item.recommendations && item.recommendations.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Recommendations:</p>
                        <div className="space-y-1">
                          {item.recommendations.slice(0, 2).map((rec, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              {getRecommendationIcon(rec)}
                              <span className="text-sm text-gray-700">{rec}</span>
                            </div>
                          ))}
                          {item.recommendations.length > 2 && (
                            <p className="text-xs text-gray-500 ml-6">
                              +{item.recommendations.length - 2} more recommendations
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Performance Visual */}
                  <div className="lg:w-32 lg:text-center">
                    <div className="w-full lg:w-24 mx-auto">
                      <div className="relative w-20 h-20 mx-auto">
                        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
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
                            stroke={item.performance_score >= 80 ? '#10b981' : 
                                   item.performance_score >= 60 ? '#f59e0b' : '#ef4444'}
                            strokeWidth="3"
                            strokeDasharray={`${(item.performance_score / 100) * 100} 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-900">
                            {item.performance_score.toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Performance</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
