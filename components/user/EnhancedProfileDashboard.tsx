'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useEnhancedProfile } from '@/hooks/useEnhancedProfile';
import { 
  User, 
  Trophy, 
  Target, 
  TrendingUp, 
  Heart, 
  Settings, 
  Lightbulb,
  Star,
  Flame,
  BarChart3,
  Calendar,
  MapPin,
  Clock,
  Zap,
  Award,
  Sparkles,
  Brain,
  Activity
} from 'lucide-react';

// Import sub-components
import DiningInsights from './DiningInsights';
import WishlistManager from './WishlistManager';
import AchievementDisplay from './AchievementDisplay';
import PersonalizationSettings from './PersonalizationSettings';
import DiningPatternAnalysis from './DiningPatternAnalysis';

export default function EnhancedProfileDashboard() {
  const {
    loading,
    preferences,
    diningPatterns,
    wishlists,
    achievements,
    streaks,
    personalizationSettings,
    insights,
    familyStats,
    calculatePreferenceAnalytics
  } = useEnhancedProfile();

  const [activeTab, setActiveTab] = useState('overview');

  // Get achievement statistics
  const unlockedAchievements = achievements.filter(a => a.is_unlocked);
  const totalPoints = unlockedAchievements.reduce((sum, a) => sum + (a.achievement?.points_value || 0), 0);
  const recentAchievements = unlockedAchievements.slice(0, 3);

  // Get streak statistics
  const activeStreaks = streaks.filter(s => s.current_streak > 0);
  const longestStreak = streaks.reduce((max, s) => Math.max(max, s.best_streak), 0);

  // Get preference analytics
  const analytics = calculatePreferenceAnalytics;

  // Get unread insights
  const unreadInsights = insights.filter(i => !i.is_read);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <Sparkles className="inline h-8 w-8 mr-3 text-purple-600" />
          Enhanced Profile
        </h1>
        <p className="text-lg text-gray-600">
          Deep insights into your dining preferences, achievements, and personalized recommendations
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Profile Completeness */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profile Strength</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((analytics?.preference_stability || 0) * 100)}%
                </p>
              </div>
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(analytics?.preference_stability || 0) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievement Points */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Achievement Points</p>
                <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {unlockedAchievements.length} of {achievements.length} unlocked
            </p>
          </CardContent>
        </Card>

        {/* Active Streaks */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Streaks</p>
                <p className="text-2xl font-bold text-gray-900">{activeStreaks.length}</p>
              </div>
              <Flame className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Best: {longestStreak} days
            </p>
          </CardContent>
        </Card>

        {/* New Insights */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Insights</p>
                <p className="text-2xl font-bold text-gray-900">{unreadInsights.length}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {insights.length} total insights
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center space-x-2">
            <Heart className="h-4 w-4" />
            <span>Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Insights</span>
          </TabsTrigger>
          <TabsTrigger value="wishlists" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Wishlists</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Achievements</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dining Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Dining Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {familyStats ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Restaurants Visited</span>
                      <span className="font-bold">{familyStats.total_restaurants_visited}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Reviews Written</span>
                      <span className="font-bold">{familyStats.total_reviews_written}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Weekly Dining</span>
                      <span className="font-bold">{familyStats.dining_frequency.weekly_average}x</span>
                    </div>
                    
                    {/* Top Cuisines */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Favorite Cuisines</h4>
                      <div className="space-y-2">
                        {familyStats.favorite_cuisines.slice(0, 3).map((cuisine, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{cuisine.cuisine}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${cuisine.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">{Math.round(cuisine.percentage)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Start dining and rating to see statistics</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span>Recent Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentAchievements.length > 0 ? (
                  <div className="space-y-3">
                    {recentAchievements.map((userAchievement) => (
                      <div key={userAchievement.id} className="flex items-center space-x-3">
                        <div className="text-2xl">{userAchievement.achievement?.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{userAchievement.achievement?.name}</h4>
                          <p className="text-sm text-gray-600">{userAchievement.achievement?.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary">
                              +{userAchievement.achievement?.points_value} points
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {userAchievement.achievement?.rarity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Complete activities to earn achievements</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Streaks */}
          {activeStreaks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Flame className="h-5 w-5" />
                  <span>Active Streaks</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {activeStreaks.map((streak) => (
                    <div key={streak.id} className="text-center p-4 bg-orange-50 rounded-lg border">
                      <Flame className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 capitalize">
                        {streak.streak_type.replace('_', ' ')}
                      </h4>
                      <p className="text-2xl font-bold text-orange-600">{streak.current_streak}</p>
                      <p className="text-sm text-gray-600">
                        Best: {streak.best_streak}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preference Analytics */}
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Preference Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(analytics.preference_stability * 100)}%
                    </div>
                    <p className="text-sm text-gray-600">Preference Stability</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(analytics.discovery_rate * 100)}%
                    </div>
                    <p className="text-sm text-gray-600">Discovery Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(analytics.recommendation_acceptance * 100)}%
                    </div>
                    <p className="text-sm text-gray-600">Recommendation Acceptance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Preferences Tab */}
        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <div className="p-8 text-center text-gray-500">
            Preference Tracker component not yet implemented
          </div>
        </TabsContent>
        {/* Insights Tab */}
        <TabsContent value="insights">
          <DiningInsights />
        </TabsContent>

        {/* Wishlists Tab */}
        <TabsContent value="wishlists">
          <WishlistManager />
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <AchievementDisplay />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <PersonalizationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
