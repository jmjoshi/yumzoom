'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFamilyAnalytics } from '@/hooks/useFamilyAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FamilyInsightsOverview } from '@/components/analytics/FamilyInsightsOverview';
import { PopularRestaurantsChart } from '@/components/analytics/PopularRestaurantsChart';
import { CuisinePreferencesChart } from '@/components/analytics/CuisinePreferencesChart';
import { MemberActivityChart } from '@/components/analytics/MemberActivityChart';
import { TimeRangeSelector } from '@/components/analytics/TimeRangeSelector';
import { exportToCSV, exportToPDF, exportToJSON } from '@/lib/analytics-export';
import { BarChart3, TrendingUp, Users, Calendar, Download, RefreshCw, FileText, FileSpreadsheet, FileCode } from 'lucide-react';
import { TimeRange } from '@/types/analytics';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const { 
    familyInsights, 
    popularRestaurants, 
    cuisinePreferences, 
    memberActivity, 
    loading, 
    error,
    refreshAnalytics 
  } = useFamilyAnalytics(timeRange);

  // Close export menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExportData = (format: 'csv' | 'pdf' | 'json') => {
    const exportData = {
      familyInsights,
      popularRestaurants,
      cuisinePreferences,
      memberActivity,
      timeRange,
      exportDate: new Date().toISOString(),
    };

    switch (format) {
      case 'csv':
        exportToCSV(exportData);
        break;
      case 'pdf':
        exportToPDF(exportData);
        break;
      case 'json':
        exportToJSON(exportData);
        break;
    }
    
    setShowExportMenu(false);
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please sign in to view analytics
          </h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error loading analytics
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refreshAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Family Analytics Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Insights and patterns from your family's dining experiences
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            <div className="relative" ref={exportMenuRef}>
              <Button 
                onClick={() => setShowExportMenu(!showExportMenu)} 
                variant="outline" 
                size="sm"
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={() => handleExportData('csv')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Export as CSV</span>
                  </button>
                  <button
                    onClick={() => handleExportData('pdf')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Export as PDF</span>
                  </button>
                  <button
                    onClick={() => handleExportData('json')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                  >
                    <FileCode className="h-4 w-4" />
                    <span>Export as JSON</span>
                  </button>
                </div>
              )}
            </div>
            <Button onClick={refreshAnalytics} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Family Insights Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle>Family Dining Insights</CardTitle>
            </div>
            <CardDescription>
              Overview of your family's dining patterns and statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FamilyInsightsOverview data={familyInsights} timeRange={timeRange} />
          </CardContent>
        </Card>

        {/* Popular Restaurants */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle>Popular Restaurants</CardTitle>
            </div>
            <CardDescription>
              Most frequently visited restaurants by your family
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PopularRestaurantsChart data={popularRestaurants} />
          </CardContent>
        </Card>

        {/* Cuisine Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <CardTitle>Cuisine Preferences</CardTitle>
            </div>
            <CardDescription>
              Your family's favorite types of cuisine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CuisinePreferencesChart data={cuisinePreferences} />
          </CardContent>
        </Card>

        {/* Member Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <CardTitle>Family Member Activity</CardTitle>
            </div>
            <CardDescription>
              Rating activity and engagement for each family member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberActivityChart data={memberActivity} />
          </CardContent>
        </Card>
      </div>

      {/* Key Insights Summary */}
      {familyInsights && (
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>
              Highlights from your family's dining patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Most Active Period</h4>
                <p className="text-sm text-blue-700">
                  Your family is most active during {timeRange === 'week' ? 'weekends' : 'dinner time'}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Top Cuisine</h4>
                <p className="text-sm text-green-700">
                  {cuisinePreferences?.[0]?.cuisine_type || 'No data'} is your family's favorite cuisine
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">Family Engagement</h4>
                <p className="text-sm text-purple-700">
                  {memberActivity?.filter(m => m.rating_count > 0).length || 0} members actively rating
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
