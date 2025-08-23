'use client';

import { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  Languages,
  Accessibility,
  Globe,
  Users,
  FileText,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

interface I18nAccessibilityStats {
  translations: {
    total: number;
    byLocale: Record<string, number>;
    pending: number;
    approved: number;
  };
  accessibility: {
    restaurantsWithInfo: number;
    totalRestaurants: number;
    reportsOpen: number;
    reportsResolved: number;
  };
  userPreferences: {
    localePreferences: Record<string, number>;
    accessibilityUsers: number;
  };
}

export default function I18nAccessibilityAdminPage() {
  const [stats, setStats] = useState<I18nAccessibilityStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'translations' | 'accessibility' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API endpoints
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        translations: {
          total: 1247,
          byLocale: {
            'en': 1247,
            'es': 892,
            'fr': 654,
            'de': 445,
            'it': 332,
            'pt': 278,
            'ja': 156,
            'ko': 134,
            'zh': 98,
            'ar': 67,
            'hi': 45,
            'ru': 34,
          },
          pending: 89,
          approved: 1158,
        },
        accessibility: {
          restaurantsWithInfo: 342,
          totalRestaurants: 456,
          reportsOpen: 23,
          reportsResolved: 178,
        },
        userPreferences: {
          localePreferences: {
            'en': 1456,
            'es': 234,
            'fr': 156,
            'de': 89,
            'it': 67,
            'pt': 45,
            'ja': 34,
            'ko': 23,
            'zh': 18,
            'ar': 12,
            'hi': 8,
            'ru': 6,
          },
          accessibilityUsers: 89,
        },
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading internationalization and accessibility data...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load data. Please try again.</p>
          <Button onClick={fetchStats} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const accessibilityPercentage = Math.round((stats.accessibility.restaurantsWithInfo / stats.accessibility.totalRestaurants) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Internationalization & Accessibility Administration
          </h1>
          <p className="text-gray-600">
            Manage multi-language content and accessibility features across the platform
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'translations', label: 'Translations', icon: Languages },
                { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
                { id: 'reports', label: 'Reports', icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Translations</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.translations.total.toLocaleString()}</p>
                  </div>
                  <Languages className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-green-600 font-medium">+12%</span>
                  <span className="text-gray-600 ml-1">from last month</span>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Supported Languages</p>
                    <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.translations.byLocale).length}</p>
                  </div>
                  <Globe className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-green-600 font-medium">+2</span>
                  <span className="text-gray-600 ml-1">new languages</span>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Accessibility Coverage</p>
                    <p className="text-2xl font-bold text-gray-900">{accessibilityPercentage}%</p>
                  </div>
                  <Accessibility className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-green-600 font-medium">+8%</span>
                  <span className="text-gray-600 ml-1">improvement</span>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">{Object.values(stats.userPreferences.localePreferences).reduce((a, b) => a + b, 0).toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-green-600 font-medium">+15%</span>
                  <span className="text-gray-600 ml-1">growth rate</span>
                </div>
              </Card>
            </div>

            {/* Translation Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Translation Status
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Approved Translations</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary">{stats.translations.approved}</Badge>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending Review</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{stats.translations.pending}</Badge>
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(stats.translations.approved / stats.translations.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {Math.round((stats.translations.approved / stats.translations.total) * 100)}% of translations approved
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Accessibility className="h-5 w-5" />
                  Accessibility Reports
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Open Reports</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{stats.accessibility.reportsOpen}</Badge>
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Resolved Reports</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary">{stats.accessibility.reportsResolved}</Badge>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(stats.accessibility.reportsResolved / (stats.accessibility.reportsOpen + stats.accessibility.reportsResolved)) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {Math.round((stats.accessibility.reportsResolved / (stats.accessibility.reportsOpen + stats.accessibility.reportsResolved)) * 100)}% resolution rate
                  </p>
                </div>
              </Card>
            </div>

            {/* Language Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Content by Language
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(stats.translations.byLocale)
                  .sort(([,a], [,b]) => b - a)
                  .map(([locale, count]) => (
                    <div key={locale} className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{count}</div>
                      <div className="text-sm text-gray-600 uppercase">{locale}</div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full" 
                          style={{ width: `${(count / stats.translations.byLocale.en) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                  <Languages className="h-5 w-5 mb-1" />
                  <span className="text-sm">Review Translations</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                  <Accessibility className="h-5 w-5 mb-1" />
                  <span className="text-sm">Update Accessibility</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                  <FileText className="h-5 w-5 mb-1" />
                  <span className="text-sm">Generate Report</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                  <Settings className="h-5 w-5 mb-1" />
                  <span className="text-sm">Configure Settings</span>
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Other tabs would be implemented here with similar structure */}
        {activeTab !== 'overview' && (
          <Card className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              <FileText className="h-12 w-12 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Coming Soon</h3>
              <p>The {activeTab} management interface is under development.</p>
            </div>
            <Button onClick={() => setActiveTab('overview')}>
              Return to Overview
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
