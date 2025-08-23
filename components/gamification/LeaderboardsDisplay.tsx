import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useAdvancedGamification } from '@/hooks/useAdvancedGamification';
import {
  Users,
  Crown,
  Trophy,
  Medal,
  TrendingUp,
  Calendar,
  Star,
  Target,
  Award,
  Zap
} from 'lucide-react';

export default function LeaderboardsDisplay() {
  const { familyLeaderboards, globalLeaderboards, loading } = useAdvancedGamification();
  const [activeTab, setActiveTab] = useState('family');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-orange-500" />;
      default: return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 2: return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 3: return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200';
      default: return 'bg-white border-gray-200';
    }
  };

  const getLeaderboardTypeIcon = (type: string) => {
    switch (type) {
      case 'monthly_reviews': return '✍️';
      case 'cuisine_exploration': return '🌍';
      case 'achievement_points': return '🏆';
      case 'dining_frequency': return '📅';
      case 'social_engagement': return '👥';
      case 'top_reviewers': return '⭐';
      case 'cuisine_explorers': return '🗺️';
      case 'achievement_hunters': return '🎯';
      case 'social_connectors': return '🤝';
      case 'challenge_champions': return '💪';
      default: return '🏅';
    }
  };

  const formatLeaderboardName = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatPeriod = (start: string, end: string, periodType?: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (periodType === 'weekly') {
      return `Week of ${startDate.toLocaleDateString()}`;
    } else if (periodType === 'monthly') {
      return startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (periodType === 'yearly') {
      return startDate.getFullYear().toString();
    } else if (periodType === 'all_time') {
      return 'All Time';
    } else {
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leaderboards</h2>
          <p className="text-gray-600">
            See how you and your family rank against others
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <span className="text-sm text-gray-500">Updated daily</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="family" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Family Rankings
          </TabsTrigger>
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Global Rankings
          </TabsTrigger>
        </TabsList>

        {/* Family Leaderboards */}
        <TabsContent value="family" className="space-y-6">
          {familyLeaderboards.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {familyLeaderboards.map((leaderboard) => (
                <Card key={leaderboard.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span className="text-2xl">
                        {getLeaderboardTypeIcon(leaderboard.leaderboard_type)}
                      </span>
                      <span>{formatLeaderboardName(leaderboard.leaderboard_type)}</span>
                    </CardTitle>
                    <CardDescription>
                      {formatPeriod(leaderboard.period_start, leaderboard.period_end)} • {leaderboard.total_participants} participants
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(leaderboard.rankings as any[]).slice(0, 10).map((ranking, index) => (
                        <div 
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg border ${getRankBgColor(ranking.rank)}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8">
                              {getRankIcon(ranking.rank)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {ranking.display_name}
                              </div>
                              {ranking.family_name && (
                                <div className="text-sm text-gray-500">
                                  {ranking.family_name}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-gray-900">
                              {ranking.score}
                            </div>
                            <div className="text-sm text-gray-500">
                              {leaderboard.leaderboard_type.includes('points') ? 'points' :
                               leaderboard.leaderboard_type.includes('reviews') ? 'reviews' :
                               leaderboard.leaderboard_type.includes('frequency') ? 'visits' :
                               leaderboard.leaderboard_type.includes('exploration') ? 'cuisines' :
                               'score'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Family Leaderboards Yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Your family needs to have some activity to generate leaderboards.
                </p>
                <Button>
                  <Target className="h-4 w-4 mr-2" />
                  Start a Challenge
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Global Leaderboards */}
        <TabsContent value="global" className="space-y-6">
          {globalLeaderboards.length > 0 ? (
            <div className="space-y-6">
              {/* Current Period Leaderboards */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Period</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {globalLeaderboards
                    .filter(lb => lb.period_type === 'monthly' || lb.period_type === 'weekly')
                    .slice(0, 4)
                    .map((leaderboard) => (
                      <Card key={leaderboard.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <span className="text-2xl">
                              {getLeaderboardTypeIcon(leaderboard.leaderboard_type)}
                            </span>
                            <span>{formatLeaderboardName(leaderboard.leaderboard_type)}</span>
                          </CardTitle>
                          <CardDescription>
                            {formatPeriod(leaderboard.period_start, leaderboard.period_end, leaderboard.period_type)} • {leaderboard.total_participants.toLocaleString()} participants
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {(leaderboard.rankings as any[]).slice(0, 5).map((ranking, index) => (
                              <div 
                                key={index}
                                className={`flex items-center justify-between p-2 rounded-lg ${getRankBgColor(ranking.rank)}`}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center justify-center w-6 h-6">
                                    {ranking.rank <= 3 ? getRankIcon(ranking.rank) : (
                                      <span className="text-sm font-bold text-gray-600">
                                        #{ranking.rank}
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-medium text-gray-900">
                                    {ranking.display_name}
                                  </div>
                                </div>
                                <div className="font-bold text-gray-900">
                                  {ranking.score.toLocaleString()}
                                </div>
                              </div>
                            ))}
                            
                            {(leaderboard.rankings as any[]).length > 5 && (
                              <div className="text-center pt-2">
                                <Button variant="ghost" size="sm">
                                  View Full Leaderboard
                                  <TrendingUp className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>

              {/* All-Time Champions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All-Time Champions</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {globalLeaderboards
                    .filter(lb => lb.period_type === 'all_time')
                    .slice(0, 3)
                    .map((leaderboard) => (
                      <Card key={leaderboard.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2 text-center">
                            <span className="text-3xl">
                              {getLeaderboardTypeIcon(leaderboard.leaderboard_type)}
                            </span>
                            <span className="text-base">{formatLeaderboardName(leaderboard.leaderboard_type)}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {(leaderboard.rankings as any[]).slice(0, 3).map((ranking, index) => (
                            <div 
                              key={index}
                              className={`flex items-center space-x-3 p-3 rounded-lg mb-2 ${getRankBgColor(ranking.rank)}`}
                            >
                              <div className="flex items-center justify-center w-8 h-8">
                                {getRankIcon(ranking.rank)}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {ranking.display_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {ranking.score.toLocaleString()} total
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Global Leaderboards Coming Soon
                </h3>
                <p className="text-gray-500 mb-4">
                  Global leaderboards will be available once more users join the platform.
                </p>
                <Button variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Invite Friends
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
