'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare,
  ChefHat,
  Download,
  RefreshCw,
  Building2,
  Calendar,
  FileSpreadsheet,
  FileText,
  FileCode
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { RestaurantOwnerOnly } from '@/components/auth/RoleGuard';
import { useRestaurantAnalytics } from '@/hooks/useRestaurantAnalytics';
import RestaurantAnalyticsDashboard from '@/components/restaurant/RestaurantAnalyticsDashboard';
import MenuItemAnalysis from '@/components/restaurant/MenuItemAnalysis';
import CustomerFeedbackAnalysis from '@/components/restaurant/CustomerFeedbackAnalysis';
import { ANALYTICS_TIME_RANGES } from '@/types/restaurant-analytics';

type AnalyticsTab = 'dashboard' | 'menu' | 'feedback';

export default function RestaurantAnalyticsPage() {
  return (
    <RestaurantOwnerOnly 
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
            <Building2 className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Restaurant Owner Access Required</h2>
            <p className="text-gray-600 mb-4">
              This page is only accessible to restaurant owners and administrators.
            </p>
            <a
              href="/restaurant-owner"
              className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Become a Restaurant Owner
            </a>
          </div>
        </div>
      }
    >
      <RestaurantAnalyticsContent />
    </RestaurantOwnerOnly>
  );
}

function RestaurantAnalyticsContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('dashboard');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const {
    performanceData,
    menuAnalytics,
    feedbackInsights,
    selectedRestaurant,
    timeRange,
    loading,
    error,
    setSelectedRestaurant,
    setTimeRange,
    refreshAnalytics,
    exportAnalytics
  } = useRestaurantAnalytics();

  const handleExport = (format: 'csv' | 'pdf' | 'json') => {
    exportAnalytics(format);
    setShowExportMenu(false);
  };

  const selectedRestaurantData = performanceData.find(r => r.restaurant_id === selectedRestaurant);
  const timeRangeLabel = ANALYTICS_TIME_RANGES.find(r => r.value === timeRange)?.label || 'Last 30 Days';

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-4">
            Please sign in to access restaurant analytics.
          </p>
          <a
            href="/signin"
            className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (loading && performanceData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <BarChart3 className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">Analytics Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refreshAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (performanceData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Restaurant Data</h1>
            <p className="text-gray-600 mb-6">
              You need to be a verified restaurant owner to access analytics.
            </p>
            <a
              href="/restaurant-owner"
              className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Get Verified as Restaurant Owner
            </a>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Performance Dashboard', icon: BarChart3 },
    { id: 'menu', label: 'Menu Analysis', icon: ChefHat },
    { id: 'feedback', label: 'Customer Feedback', icon: MessageSquare },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurant Analytics</h1>
              <p className="text-lg text-gray-600">
                Data-driven insights for your restaurant performance
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Restaurant Selector */}
              {performanceData.length > 1 && (
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <select
                    value={selectedRestaurant || ''}
                    onChange={(e) => setSelectedRestaurant(e.target.value || null)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {performanceData.map((restaurant) => (
                      <option key={restaurant.restaurant_id} value={restaurant.restaurant_id}>
                        {restaurant.restaurant_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Time Range Selector */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {ANALYTICS_TIME_RANGES.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Export Menu */}
              <div className="relative">
                <Button 
                  onClick={() => setShowExportMenu(!showExportMenu)} 
                  variant="outline" 
                  size="sm"
                  disabled={!selectedRestaurant}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Export as CSV</span>
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Export as Report</span>
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                    >
                      <FileCode className="h-4 w-4" />
                      <span>Export as JSON</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              <Button onClick={refreshAnalytics} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedRestaurantData && (
          <>
            {activeTab === 'dashboard' && (
              <RestaurantAnalyticsDashboard 
                data={selectedRestaurantData} 
                timeRange={timeRangeLabel}
              />
            )}
            
            {activeTab === 'menu' && (
              <MenuItemAnalysis 
                data={menuAnalytics} 
                timeRange={timeRangeLabel}
              />
            )}
            
            {activeTab === 'feedback' && feedbackInsights && (
              <CustomerFeedbackAnalysis 
                data={feedbackInsights} 
                timeRange={timeRangeLabel}
              />
            )}

            {activeTab === 'feedback' && !feedbackInsights && (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Feedback Data</h3>
                  <p className="text-gray-600">
                    No customer feedback available for the selected time period. 
                    Encourage customers to leave reviews to see insights here.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!selectedRestaurantData && selectedRestaurant && (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Analytics</h3>
            <p className="text-gray-600">Please wait while we load your restaurant data...</p>
          </div>
        )}
      </div>

      {/* Click outside to close export menu */}
      {showExportMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
}
