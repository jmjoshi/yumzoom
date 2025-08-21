'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useEnhancedProfile } from '@/hooks/useEnhancedProfile';
import { 
  Trophy, 
  Award, 
  Star, 
  Lock, 
  Unlock, 
  Target,
  BarChart3,
  Calendar,
  Sparkles,
  Crown,
  Medal,
  Gem,
  Zap,
  TrendingUp,
  Users,
  Heart,
  Eye,
  EyeOff
} from 'lucide-react';

const RARITY_INFO = {
  common: {
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: Medal,
    label: 'Common'
  },
  uncommon: {
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: Award,
    label: 'Uncommon'
  },
  rare: {
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Star,
    label: 'Rare'
  },
  epic: {
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: Crown,
    label: 'Epic'
  },
  legendary: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Gem,
    label: 'Legendary'
  }
};

const CATEGORY_INFO = {
  explorer: {
    icon: Target,
    label: 'Explorer',
    color: 'text-blue-600',
    description: 'Discover new restaurants and cuisines'
  },
  reviewer: {
    icon: Star,
    label: 'Reviewer',
    color: 'text-green-600',
    description: 'Share your dining experiences'
  },
  social: {
    icon: Users,
    label: 'Social',
    color: 'text-purple-600',
    description: 'Connect with other food lovers'
  },
  loyalty: {
    icon: Heart,
    label: 'Loyalty',
    color: 'text-red-600',
    description: 'Show loyalty to favorite places'
  },
  milestone: {
    icon: Trophy,
    label: 'Milestone',
    color: 'text-yellow-600',
    description: 'Reach important milestones'
  }
};

export default function AchievementDisplay() {
  const { 
    achievements, 
    streaks, 
    checkAchievements,
    refetch 
  } = useEnhancedProfile();
  
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked' | string>('all');
  const [showHidden, setShowHidden] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCheckAchievements = async () => {
    setLoading(true);
    try {
      await checkAchievements();
    } finally {
      setLoading(false);
    }
  };

  // Calculate achievement statistics
  const unlockedAchievements = achievements.filter(a => a.is_unlocked);
  const totalPoints = unlockedAchievements.reduce((sum, a) => sum + (a.achievement?.points_value || 0), 0);
  const recentAchievements = unlockedAchievements
    .filter(a => a.earned_date)
    .sort((a, b) => new Date(b.earned_date!).getTime() - new Date(a.earned_date!).getTime())
    .slice(0, 5);

  // Filter achievements
  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'unlocked') return achievement.is_unlocked;
    if (filter === 'locked') return !achievement.is_unlocked;
    if (filter !== 'all') return achievement.achievement?.category === filter;
    if (!showHidden && !achievement.is_displayed) return false;
    return true;
  });

  // Group achievements by category
  const groupedAchievements = filteredAchievements.reduce((acc, achievement) => {
    const category = achievement.achievement?.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, typeof achievements>);

  const getRarityInfo = (rarity: string) => {
    return RARITY_INFO[rarity as keyof typeof RARITY_INFO] || RARITY_INFO.common;
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORY_INFO[category as keyof typeof CATEGORY_INFO] || CATEGORY_INFO.milestone;
  };

  const getCompletionPercentage = () => {
    if (achievements.length === 0) return 0;
    return Math.round((unlockedAchievements.length / achievements.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Achievements & Gamification</h2>
          <p className="text-gray-600">
            Track your progress and unlock rewards for your dining activities
          </p>
        </div>
        <Button 
          onClick={handleCheckAchievements}
          disabled={loading}
        >
          <Zap className={`h-4 w-4 mr-2 ${loading ? 'animate-pulse' : ''}`} />
          Check Progress
        </Button>
      </div>

      {/* Achievement Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{unlockedAchievements.length}</div>
            <p className="text-sm text-gray-600">Achievements Unlocked</p>
            <div className="mt-2">
              <div className="text-xs text-gray-500">
                {getCompletionPercentage()}% Complete
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-yellow-600 h-2 rounded-full" 
                  style={{ width: `${getCompletionPercentage()}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Star className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{totalPoints}</div>
            <p className="text-sm text-gray-600">Total Points</p>
            <div className="text-xs text-gray-500 mt-2">
              Avg: {achievements.length > 0 ? Math.round(totalPoints / achievements.length) : 0} per achievement
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {streaks.reduce((max, s) => Math.max(max, s.current_streak), 0)}
            </div>
            <p className="text-sm text-gray-600">Best Current Streak</p>
            <div className="text-xs text-gray-500 mt-2">
              {streaks.filter(s => s.current_streak > 0).length} active streaks
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Gem className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {unlockedAchievements.filter(a => 
                a.achievement?.rarity === 'rare' || 
                a.achievement?.rarity === 'epic' || 
                a.achievement?.rarity === 'legendary'
              ).length}
            </div>
            <p className="text-sm text-gray-600">Rare+ Achievements</p>
            <div className="text-xs text-gray-500 mt-2">
              Special accomplishments
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span>Recent Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentAchievements.map((userAchievement) => {
                const achievement = userAchievement.achievement!;
                const rarityInfo = getRarityInfo(achievement.rarity);
                const categoryInfo = getCategoryInfo(achievement.category);
                const RarityIcon = rarityInfo.icon;
                const CategoryIcon = categoryInfo.icon;

                return (
                  <div 
                    key={userAchievement.id}
                    className={`border-2 rounded-lg p-4 ${rarityInfo.color} bg-gradient-to-br from-white to-gray-50`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-2xl">{achievement.icon}</div>
                      <RarityIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    
                    <h4 className="font-bold text-gray-900 mb-1">{achievement.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <Badge className={categoryInfo.color}>
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {categoryInfo.label}
                      </Badge>
                      <span className="text-gray-500">
                        {new Date(userAchievement.earned_date!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({achievements.length})
        </Button>
        
        <Button
          variant={filter === 'unlocked' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unlocked')}
        >
          Unlocked ({unlockedAchievements.length})
        </Button>
        
        <Button
          variant={filter === 'locked' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('locked')}
        >
          Locked ({achievements.length - unlockedAchievements.length})
        </Button>

        {Object.entries(CATEGORY_INFO).map(([category, info]) => {
          const count = achievements.filter(a => a.achievement?.category === category).length;
          if (count === 0) return null;
          
          const Icon = info.icon;
          return (
            <Button
              key={category}
              variant={filter === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(category)}
            >
              <Icon className="h-3 w-3 mr-1" />
              {info.label} ({count})
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHidden(!showHidden)}
        >
          {showHidden ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
          {showHidden ? 'Hide Secret' : 'Show All'}
        </Button>
      </div>

      {/* Achievement Categories */}
      <div className="space-y-6">
        {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => {
          const categoryInfo = getCategoryInfo(category);
          const CategoryIcon = categoryInfo.icon;
          
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CategoryIcon className={`h-5 w-5 ${categoryInfo.color}`} />
                  <span>{categoryInfo.label} Achievements</span>
                  <Badge variant="secondary">{categoryAchievements.length}</Badge>
                </CardTitle>
                <CardDescription>{categoryInfo.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryAchievements.map((userAchievement) => {
                    const achievement = userAchievement.achievement!;
                    const rarityInfo = getRarityInfo(achievement.rarity);
                    const RarityIcon = rarityInfo.icon;
                    const isUnlocked = userAchievement.is_unlocked;

                    return (
                      <div 
                        key={userAchievement.id}
                        className={`border rounded-lg p-4 transition-all ${
                          isUnlocked 
                            ? `${rarityInfo.color} shadow-md` 
                            : 'bg-gray-50 border-gray-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`text-2xl ${isUnlocked ? '' : 'grayscale'}`}>
                            {achievement.icon}
                          </div>
                          <div className="flex items-center space-x-1">
                            <RarityIcon className="h-4 w-4 text-gray-600" />
                            {isUnlocked ? (
                              <Unlock className="h-4 w-4 text-green-600" />
                            ) : (
                              <Lock className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>

                        <h4 className={`font-bold mb-1 ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                          {achievement.name}
                        </h4>
                        
                        <p className={`text-sm mb-3 ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                          {achievement.description}
                        </p>

                        {/* Progress Bar for Locked Achievements */}
                        {!isUnlocked && userAchievement.progress > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{userAchievement.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${userAchievement.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={rarityInfo.color}>
                              {rarityInfo.label}
                            </Badge>
                            <span className={`text-sm font-medium ${isUnlocked ? 'text-blue-600' : 'text-gray-400'}`}>
                              +{achievement.points_value} pts
                            </span>
                          </div>
                          
                          {isUnlocked && userAchievement.earned_date && (
                            <span className="text-xs text-gray-500">
                              {new Date(userAchievement.earned_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Requirements (for locked achievements) */}
                        {!isUnlocked && achievement.requirements && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs text-gray-500">
                              <strong>Requirements:</strong>
                              <div className="mt-1 space-y-1">
                                {Object.entries(achievement.requirements).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                                    <span>{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No achievements found
            </h3>
            <p className="text-gray-500 mb-4">
              {filter === 'unlocked' 
                ? 'You haven\'t unlocked any achievements yet. Keep using YumZoom to earn your first achievement!'
                : 'Try adjusting your filters to see more achievements.'
              }
            </p>
            {filter !== 'all' && (
              <Button onClick={() => setFilter('all')}>
                Show All Achievements
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
