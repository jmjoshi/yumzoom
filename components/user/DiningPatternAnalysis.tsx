'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useEnhancedProfile } from '@/hooks/useEnhancedProfile';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign,
  Users,
  Utensils,
  Activity,
  PieChart,
  LineChart,
  RefreshCw,
  Eye,
  Target,
  Zap
} from 'lucide-react';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export default function DiningPatternAnalysis() {
  const { 
    diningPatterns, 
    familyStats, 
    preferences, 
    refetch 
  } = useEnhancedProfile();
  
  const [activeView, setActiveView] = useState<'overview' | 'frequency' | 'timing' | 'seasonal' | 'spending'>('overview');
  const [loading, setLoading] = useState(false);

  // Process dining patterns data
  const processedPatterns = useMemo(() => {
    const patterns = {
      frequency: diningPatterns.filter(p => p.pattern_type === 'frequency'),
      timing: diningPatterns.filter(p => p.pattern_type === 'timing'),
      seasonal: diningPatterns.filter(p => p.pattern_type === 'seasonal'),
      social: diningPatterns.filter(p => p.pattern_type === 'social'),
      spending: diningPatterns.filter(p => p.pattern_type === 'spending')
    };

    return patterns;
  }, [diningPatterns]);

  // Generate mock chart data for visualization
  const getFrequencyData = (): ChartData[] => {
    if (!familyStats) return [];
    
    return [
      { label: 'Monday', value: 15, color: '#3B82F6' },
      { label: 'Tuesday', value: 12, color: '#3B82F6' },
      { label: 'Wednesday', value: 18, color: '#3B82F6' },
      { label: 'Thursday', value: 20, color: '#3B82F6' },
      { label: 'Friday', value: 35, color: '#10B981' },
      { label: 'Saturday', value: 45, color: '#10B981' },
      { label: 'Sunday', value: 25, color: '#F59E0B' }
    ];
  };

  const getCuisineData = (): ChartData[] => {
    if (!familyStats?.favorite_cuisines) return [];
    
    return familyStats.favorite_cuisines.map((cuisine, index) => ({
      label: cuisine.cuisine,
      value: cuisine.percentage,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]
    }));
  };

  const getPriceDistributionData = (): ChartData[] => {
    if (!familyStats?.price_distribution) return [];
    
    return [
      { label: 'Budget ($)', value: familyStats.price_distribution.budget, color: '#10B981' },
      { label: 'Moderate ($$)', value: familyStats.price_distribution.moderate, color: '#3B82F6' },
      { label: 'Upscale ($$$)', value: familyStats.price_distribution.upscale, color: '#F59E0B' },
      { label: 'Fine Dining ($$$$)', value: familyStats.price_distribution.fine_dining, color: '#EF4444' }
    ];
  };

  const handleRefreshPatterns = async () => {
    setLoading(true);
    try {
      await refetch.patterns();
      await refetch.stats();
    } finally {
      setLoading(false);
    }
  };

  const renderBarChart = (data: ChartData[], title: string) => (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900">{title}</h4>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-20 text-sm text-gray-600 truncate">{item.label}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${item.value}%`,
                  backgroundColor: item.color || '#3B82F6'
                }}
              ></div>
            </div>
            <div className="w-12 text-sm text-gray-900 text-right">
              {Math.round(item.value)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInsightCard = (
    title: string,
    value: string | number,
    description: string,
    icon: React.ComponentType<any>,
    trend?: 'up' | 'down' | 'stable'
  ) => {
    const Icon = icon;
    
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <Icon className="h-5 w-5 text-gray-600" />
          {trend && (
            <TrendingUp 
              className={`h-4 w-4 ${
                trend === 'up' ? 'text-green-600' : 
                trend === 'down' ? 'text-red-600' : 
                'text-gray-600'
              }`} 
            />
          )}
        </div>
        <div className="text-xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-sm font-medium text-gray-900 mb-1">{title}</div>
        <div className="text-xs text-gray-600">{description}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dining Pattern Analysis</h2>
          <p className="text-gray-600">
            Discover insights about your dining habits and behavioral patterns
          </p>
        </div>
        <Button 
          onClick={handleRefreshPatterns}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Analysis
        </Button>
      </div>

      {/* View Selector */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'overview', label: 'Overview', icon: Activity },
          { key: 'frequency', label: 'Frequency', icon: Calendar },
          { key: 'timing', label: 'Timing', icon: Clock },
          { key: 'seasonal', label: 'Seasonal', icon: TrendingUp },
          { key: 'spending', label: 'Spending', icon: DollarSign }
        ].map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={activeView === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView(key as any)}
          >
            <Icon className="h-4 w-4 mr-1" />
            {label}
          </Button>
        ))}
      </div>

      {/* Overview */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Key Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderInsightCard(
              'Weekly Dining',
              familyStats?.dining_frequency.weekly_average || 0,
              'Average restaurant visits per week',
              Utensils,
              familyStats?.dining_frequency.monthly_trend
            )}
            
            {renderInsightCard(
              'Restaurants Tried',
              familyStats?.total_restaurants_visited || 0,
              'Unique restaurants visited',
              MapPin,
              'up'
            )}
            
            {renderInsightCard(
              'Reviews Written',
              familyStats?.total_reviews_written || 0,
              'Total reviews and ratings',
              Eye,
              'up'
            )}
            
            {renderInsightCard(
              'Preference Strength',
              preferences.length > 0 ? 
                Math.round(preferences.reduce((sum, p) => sum + p.preference_strength, 0) / preferences.length) 
                : 0,
              'Average preference intensity',
              Target
            )}
          </div>

          {/* Quick Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Cuisine Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderBarChart(getCuisineData(), 'Top Cuisines by Frequency')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Price Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderBarChart(getPriceDistributionData(), 'Spending Patterns')}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Frequency Analysis */}
      {activeView === 'frequency' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Dining Frequency Patterns</span>
              </CardTitle>
              <CardDescription>
                How often you dine out throughout the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderBarChart(getFrequencyData(), 'Weekly Dining Distribution')}
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Key Insights</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Weekend dining is 40% higher than weekdays</li>
                  <li>• Friday is your most popular dining day</li>
                  <li>• You tend to avoid dining out on Tuesdays</li>
                  <li>• Average of {familyStats?.dining_frequency.weekly_average || 0} restaurant visits per week</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInsightCard(
              'Peak Day',
              'Friday',
              'Most popular dining day',
              Calendar,
              'up'
            )}
            
            {renderInsightCard(
              'Monthly Trend',
              familyStats?.dining_frequency.monthly_trend || 'stable',
              'Compared to last month',
              TrendingUp,
              familyStats?.dining_frequency.monthly_trend as any
            )}
            
            {renderInsightCard(
              'Consistency',
              '72%',
              'Regular dining pattern',
              Activity
            )}
          </div>
        </div>
      )}

      {/* Timing Analysis */}
      {activeView === 'timing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Dining Time Patterns</span>
            </CardTitle>
            <CardDescription>
              When you prefer to dine out during the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {renderBarChart([
                { label: 'Breakfast', value: 10, color: '#F59E0B' },
                { label: 'Brunch', value: 25, color: '#10B981' },
                { label: 'Lunch', value: 30, color: '#3B82F6' },
                { label: 'Dinner', value: 65, color: '#EF4444' },
                { label: 'Late Night', value: 5, color: '#8B5CF6' }
              ], 'Meal Time Preferences')}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Peak Hours</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Lunch:</span>
                      <span className="font-medium">12:00 - 2:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dinner:</span>
                      <span className="font-medium">7:00 - 9:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weekend Brunch:</span>
                      <span className="font-medium">10:00 AM - 1:00 PM</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Timing Insights</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• You prefer dinner over lunch dining</li>
                    <li>• Weekend brunch is a favorite</li>
                    <li>• Rarely dine out for breakfast</li>
                    <li>• Consistent with dinner timing</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seasonal Analysis */}
      {activeView === 'seasonal' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Seasonal Patterns</span>
            </CardTitle>
            <CardDescription>
              How your dining habits change throughout the year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {renderBarChart([
                { label: 'Spring', value: 85, color: '#10B981' },
                { label: 'Summer', value: 95, color: '#F59E0B' },
                { label: 'Fall', value: 75, color: '#EF4444' },
                { label: 'Winter', value: 60, color: '#3B82F6' }
              ], 'Seasonal Dining Activity')}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Seasonal Preferences</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Summer:</span>
                      <Badge variant="secondary">Outdoor Dining +40%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Winter:</span>
                      <Badge variant="secondary">Comfort Food +60%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Spring:</span>
                      <Badge variant="secondary">Fresh Cuisine +30%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Fall:</span>
                      <Badge variant="secondary">Warm Drinks +50%</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Holiday Impact</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Thanksgiving week: -30% dining out</p>
                    <p>• Valentine's Day: +80% fine dining</p>
                    <p>• New Year's Eve: +120% celebration</p>
                    <p>• Summer holidays: +45% casual dining</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spending Analysis */}
      {activeView === 'spending' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Spending Patterns</span>
              </CardTitle>
              <CardDescription>
                Your dining budget distribution and spending habits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {renderBarChart(getPriceDistributionData(), 'Price Range Distribution')}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderInsightCard(
                    'Average Spend',
                    '$45',
                    'Per dining experience',
                    DollarSign,
                    'stable'
                  )}
                  
                  {renderInsightCard(
                    'Monthly Budget',
                    '$380',
                    'Total restaurant spending',
                    BarChart3,
                    'up'
                  )}
                  
                  {renderInsightCard(
                    'Preferred Range',
                    '$$',
                    'Moderate pricing tier',
                    Target
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spending Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Budget-Friendly Insights</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• You balance budget and quality well</li>
                  <li>• 80% of dining stays within moderate range</li>
                  <li>• Special occasions: fine dining 2-3x per month</li>
                  <li>• Lunch spending is 40% less than dinner</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pattern Confidence */}
      {diningPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Pattern Confidence</span>
            </CardTitle>
            <CardDescription>
              How confident we are in these pattern analyses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(processedPatterns).map(([type, patterns]) => {
                if (patterns.length === 0) return null;
                
                const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence_level, 0) / patterns.length;
                
                return (
                  <div key={type} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 capitalize mb-2">{type}</h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${avgConfidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {Math.round(avgConfidence * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
