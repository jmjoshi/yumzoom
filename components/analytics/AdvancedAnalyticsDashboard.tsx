/**
 * Advanced Analytics Dashboard - Phase 2
 * Main dashboard component for advanced analytics including predictive insights,
 * competitive analysis, platform statistics, and custom reports
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdvancedAnalytics, usePredictiveAnalytics } from '@/hooks/useAdvancedAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  Globe,
  Users,
  Building2,
  Download,
  RefreshCw,
  Settings,
  Filter,
  Share2,
  Bell,
  Lightbulb,
  Zap,
  Shield,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Eye,
  ThumbsUp,
  ThumbsDown,
  FileSpreadsheet,
  FileText,
  FileCode,
  Plus,
  Search,
  Calendar,
  MapPin
} from 'lucide-react';
import type {
  AdvancedAnalyticsFilters,
  PredictiveInsight,
  RestaurantCompetitiveAnalysis,
  PlatformUsageStatistics,
  AnalyticsExportRequest
} from '@/types/advanced-analytics';

export default function AdvancedAnalyticsDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'predictive' | 'competitive' | 'platform' | 'reports'>('overview');
  const [filters, setFilters] = useState<AdvancedAnalyticsFilters>({
    date_range: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    confidence_threshold: 0.7,
    only_actionable: true
  });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const {
    platformStatistics,
    platformGrowthMetrics,
    competitiveAnalysis,
    marketBenchmarks,
    predictiveInsights,
    recommendations,
    geographicAnalytics,
    customReports,
    reportTemplates,
    loading,
    error,
    lastUpdated,
    refreshAnalytics,
    generateReport,
    exportData,
    shareInsight,
    provideFeedback
  } = useAdvancedAnalytics(filters);

  const {
    insights: aiInsights,
    generateInsights,
    updateInsightFeedback,
    markInsightAsActioned
  } = usePredictiveAnalytics('platform');

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

  const handleExportData = async (format: 'csv' | 'pdf' | 'json' | 'excel') => {
    try {
      const exportRequest: AnalyticsExportRequest = {
        report_type: activeTab === 'platform' ? 'platform_statistics' : 
                    activeTab === 'competitive' ? 'competitive_analysis' :
                    activeTab === 'predictive' ? 'predictive_insights' : 'custom_report',
        format,
        filters,
        include_charts: true,
        include_raw_data: true
      };

      const result = await exportData(exportRequest);
      
      if (result.download_url) {
        window.open(result.download_url, '_blank');
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
    
    setShowExportMenu(false);
  };

  const handleInsightFeedback = async (insightId: string, rating: number) => {
    try {
      await updateInsightFeedback(insightId, rating);
    } catch (error) {
      console.error('Failed to provide feedback:', error);
    }
  };

  const handleMarkAsActioned = async (insightId: string) => {
    try {
      await markInsightAsActioned(insightId);
    } catch (error) {
      console.error('Failed to mark as actioned:', error);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please sign in to access advanced analytics
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
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
            Error loading advanced analytics
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Advanced Analytics Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              AI-powered insights, competitive analysis, and business intelligence
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
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
                    onClick={() => handleExportData('excel')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Export as Excel</span>
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

        {/* Last Updated */}
        {lastUpdated && (
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Clock className="h-4 w-4 mr-1" />
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'predictive', name: 'AI Insights', icon: Brain },
              { id: 'competitive', name: 'Competition', icon: Target },
              { id: 'platform', name: 'Platform Stats', icon: Globe },
              { id: 'reports', name: 'Custom Reports', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Analytics Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.date_range.start}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      date_range: { ...prev.date_range, start: e.target.value }
                    }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  />
                  <input
                    type="date"
                    value={filters.date_range.end}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      date_range: { ...prev.date_range, end: e.target.value }
                    }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confidence Threshold
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.confidence_threshold || 0.7}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    confidence_threshold: parseFloat(e.target.value)
                  }))}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">
                  {((filters.confidence_threshold || 0.7) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.only_actionable || false}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      only_actionable: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-orange-600 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">Actionable insights only</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          platformStatistics={platformStatistics}
          platformGrowthMetrics={platformGrowthMetrics}
          predictiveInsights={predictiveInsights}
          competitiveAnalysis={competitiveAnalysis}
          recommendations={recommendations}
        />
      )}

      {activeTab === 'predictive' && (
        <PredictiveInsightsTab
          insights={predictiveInsights}
          recommendations={recommendations}
          onProvideFeedback={handleInsightFeedback}
          onMarkAsActioned={handleMarkAsActioned}
          onShare={shareInsight}
        />
      )}

      {activeTab === 'competitive' && (
        <CompetitiveAnalysisTab
          analysis={competitiveAnalysis}
          benchmarks={marketBenchmarks}
        />
      )}

      {activeTab === 'platform' && (
        <PlatformStatisticsTab
          statistics={platformStatistics}
          growthMetrics={platformGrowthMetrics}
          geographicAnalytics={geographicAnalytics}
        />
      )}

      {activeTab === 'reports' && (
        <CustomReportsTab
          reports={customReports}
          templates={reportTemplates}
          onGenerateReport={generateReport}
        />
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  platformStatistics,
  platformGrowthMetrics,
  predictiveInsights,
  competitiveAnalysis,
  recommendations
}: {
  platformStatistics: PlatformUsageStatistics[] | null;
  platformGrowthMetrics: any;
  predictiveInsights: PredictiveInsight[] | null;
  competitiveAnalysis: RestaurantCompetitiveAnalysis[] | null;
  recommendations: any;
}) {
  const latestStats = platformStatistics?.[platformStatistics.length - 1];
  const highConfidenceInsights = predictiveInsights?.filter(i => i.confidence_score > 0.8) || [];
  const actionableInsights = predictiveInsights?.filter(i => !i.action_taken && i.confidence_score > 0.7) || [];

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {latestStats?.total_active_users.toLocaleString() || 0}
                </p>
                {latestStats?.user_growth_rate && (
                  <div className="flex items-center mt-1">
                    {latestStats.user_growth_rate > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      latestStats.user_growth_rate > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(latestStats.user_growth_rate).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Restaurants</p>
                <p className="text-2xl font-bold text-gray-900">
                  {latestStats?.total_restaurants.toLocaleString() || 0}
                </p>
                {latestStats?.restaurant_growth_rate && (
                  <div className="flex items-center mt-1">
                    {latestStats.restaurant_growth_rate > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      latestStats.restaurant_growth_rate > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(latestStats.restaurant_growth_rate).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Insights</p>
                <p className="text-2xl font-bold text-gray-900">
                  {highConfidenceInsights.length}
                </p>
                <div className="flex items-center mt-1">
                  <Zap className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm font-medium text-orange-600">
                    High confidence
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Brain className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Actionable Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {actionableInsights.length}
                </p>
                <div className="flex items-center mt-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium text-yellow-600">
                    Needs attention
                  </span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Bell className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* High-Priority Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <span>Top AI Insights</span>
          </CardTitle>
          <CardDescription>
            High-confidence recommendations that require attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {highConfidenceInsights.slice(0, 5).map((insight) => (
              <div key={insight.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge
                        variant={insight.insight_category === 'recommendation' ? 'secondary' :
                                insight.insight_category === 'risk_alert' ? 'destructive' :
                                insight.insight_category === 'opportunity' ? 'default' : 'outline'}
                      >
                        {insight.insight_category}
                      </Badge>
                      <Badge variant="outline">
                        {(insight.confidence_score * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                    <p className="text-gray-600 text-sm mb-2">{insight.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Impact: {(insight.impact_score * 100).toFixed(0)}%</span>
                      <span>Entity: {insight.entity_type}</span>
                      {insight.valid_until && (
                        <span>Valid until: {new Date(insight.valid_until).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {insight.action_taken ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-orange-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {highConfidenceInsights.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No high-confidence insights available at the moment</p>
                <p className="text-sm">Check back later or adjust your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Platform Health Summary */}
      {platformGrowthMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>User Acquisition</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New Users</span>
                  <span className="font-medium">{platformGrowthMetrics.user_acquisition.new_users}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Growth Rate</span>
                  <span className="font-medium">{platformGrowthMetrics.user_acquisition.growth_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Retention Rate</span>
                  <span className="font-medium">{platformGrowthMetrics.user_acquisition.retention_rate.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-green-600" />
                <span>Content Growth</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New Restaurants</span>
                  <span className="font-medium">{platformGrowthMetrics.content_growth.new_restaurants}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New Ratings</span>
                  <span className="font-medium">{platformGrowthMetrics.content_growth.new_ratings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Quality Score</span>
                  <span className="font-medium">{platformGrowthMetrics.content_growth.content_quality_score.toFixed(1)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <span>Engagement</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Session</span>
                  <span className="font-medium">{platformGrowthMetrics.engagement_metrics.avg_session_duration.toFixed(1)}m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pages/Session</span>
                  <span className="font-medium">{platformGrowthMetrics.engagement_metrics.pages_per_session.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bounce Rate</span>
                  <span className="font-medium">{platformGrowthMetrics.engagement_metrics.bounce_rate.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Predictive Insights Tab Component
function PredictiveInsightsTab({
  insights,
  recommendations,
  onProvideFeedback,
  onMarkAsActioned,
  onShare
}: {
  insights: PredictiveInsight[] | null;
  recommendations: any;
  onProvideFeedback: (insightId: string, rating: number) => void;
  onMarkAsActioned: (insightId: string) => void;
  onShare: (request: any) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredInsights = insights?.filter(insight => 
    !selectedCategory || insight.insight_category === selectedCategory
  ) || [];

  const categories = Array.from(new Set(insights?.map(i => i.insight_category) || []));

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setSelectedCategory(null)}
          variant={selectedCategory === null ? "primary" : "outline"}
          size="sm"
        >
          All Categories
        </Button>
        {categories.map(category => (
          <Button
            key={category}
            onClick={() => setSelectedCategory(category)}
            variant={selectedCategory === category ? "primary" : "outline"}
            size="sm"
          >
            {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Button>
        ))}
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.map((insight) => (
          <Card key={insight.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge
                      variant={insight.insight_category === 'recommendation' ? 'secondary' :
                              insight.insight_category === 'risk_alert' ? 'destructive' :
                              insight.insight_category === 'opportunity' ? 'default' : 'outline'}
                    >
                      {insight.insight_category}
                    </Badge>
                    <Badge variant="outline">
                      {insight.insight_type.replace('_', ' ')}
                    </Badge>
                    {insight.action_taken && (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Actioned
                      </Badge>
                    )}
                  </div>
                  <CardTitle>{insight.title}</CardTitle>
                  <CardDescription>{insight.description}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => onShare({
                      data_type: 'insight',
                      data_id: insight.id,
                      share_with: [],
                      access_level: 'view'
                    })}
                    variant="outline"
                    size="sm"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  {!insight.action_taken && (
                    <Button
                      onClick={() => onMarkAsActioned(insight.id)}
                      variant="outline"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(insight.confidence_score * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {(insight.impact_score * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Impact</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {insight.entity_type}
                  </div>
                  <div className="text-sm text-gray-600">Entity Type</div>
                </div>
              </div>

              {/* Prediction Data */}
              {insight.prediction_data && Object.keys(insight.prediction_data).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Prediction Details</h5>
                  <div className="space-y-2">
                    {Object.entries(insight.prediction_data).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600">{key.replace('_', ' ')}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Was this helpful?</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => onProvideFeedback(insight.id, rating)}
                          className={`p-1 rounded transition-colors ${
                            insight.feedback_rating && insight.feedback_rating >= rating
                              ? 'text-yellow-500 hover:text-yellow-600'
                              : 'text-gray-300 hover:text-yellow-400'
                          }`}
                        >
                          <Star className="h-4 w-4" fill="currentColor" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(insight.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredInsights.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No insights available</h3>
            <p>No predictive insights match your current filters</p>
            {selectedCategory && (
              <Button
                onClick={() => setSelectedCategory(null)}
                variant="outline"
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Competitive Analysis Tab Component
function CompetitiveAnalysisTab({
  analysis,
  benchmarks
}: {
  analysis: RestaurantCompetitiveAnalysis[] | null;
  benchmarks: any[] | null;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center py-12 text-gray-500">
        <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Competitive Analysis</h3>
        <p>This feature is available to restaurant owners</p>
        <p className="text-sm mt-2">Restaurant competitive insights and market benchmarks</p>
      </div>
    </div>
  );
}

// Platform Statistics Tab Component
function PlatformStatisticsTab({
  statistics,
  growthMetrics,
  geographicAnalytics
}: {
  statistics: PlatformUsageStatistics[] | null;
  growthMetrics: any;
  geographicAnalytics: any[] | null;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center py-12 text-gray-500">
        <Globe className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Platform Statistics</h3>
        <p>This feature is available to platform administrators</p>
        <p className="text-sm mt-2">Platform-wide usage statistics and geographic insights</p>
      </div>
    </div>
  );
}

// Custom Reports Tab Component
function CustomReportsTab({
  reports,
  templates,
  onGenerateReport
}: {
  reports: any[] | null;
  templates: any[] | null;
  onGenerateReport: (definition: any) => Promise<any>;
}) {
  return (
    <div className="space-y-6">
      {/* Create New Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Create Custom Report</span>
          </CardTitle>
          <CardDescription>
            Generate custom analytics reports with your preferred metrics and filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => onGenerateReport({
                report_name: 'Family Insights Report',
                report_type: 'family_insights'
              })}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <Users className="h-6 w-6" />
              <span>Family Insights</span>
            </Button>
            <Button
              onClick={() => onGenerateReport({
                report_name: 'Platform Analytics Report',
                report_type: 'platform_statistics'
              })}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <BarChart3 className="h-6 w-6" />
              <span>Platform Stats</span>
            </Button>
            <Button
              onClick={() => onGenerateReport({
                report_name: 'Predictive Insights Report',
                report_type: 'predictive_insights'
              })}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <Brain className="h-6 w-6" />
              <span>AI Insights</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            Your recently generated custom reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No custom reports yet</p>
            <p className="text-sm">Create your first report using the templates above</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
