'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useAdvancedGamification } from '@/hooks/useAdvancedGamification';
import AchievementNotifications from './AchievementNotifications';
import RewardRedemptionSystem from './RewardRedemptionSystem';
import {
  Trophy,
  Target,
  Users,
  Crown,
  Star,
  Zap,
  TrendingUp,
  Calendar,
  Award,
  Gift,
  Settings,
  Flame,
  ChevronRight,
  Clock,
  CheckCircle,
  Lock,
  Unlock,
  Bell
} from 'lucide-react';

export default function AdvancedGamificationDashboard() {
  const {
    summary,
    challengesWithProgress,
    goalsWithProgress,
    familyLeaderboards,
    globalLeaderboards,
    rewards,
    enhancedStreaks,
    settings,
    joinChallenge,
    createGoal,
    claimReward,
    loading,
    error
  } = useAdvancedGamification();

  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Zap className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Gamification</h3>
          <p className="text-gray-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Gamification</h1>
          <p className="text-gray-600">
            Take on challenges, set goals, and compete with your family for dining achievements
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary?.level || 1}</div>
            <div className="text-sm text-gray-500">Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary?.total_points || 0}</div>
            <div className="text-sm text-gray-500">Points</div>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      {summary && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Level {summary.level} Progress</h3>
                <p className="text-sm text-gray-600">
                  {summary.next_level_points} points to level {summary.level + 1}
                </p>
              </div>
              <Crown className="h-8 w-8 text-yellow-600" />
            </div>
            <Progress value={summary.level_progress} className="h-3" />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>Level {summary.level}</span>
              <span>{Math.round(summary.level_progress)}%</span>
              <span>Level {summary.level + 1}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="leaderboards" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Leaderboards
          </TabsTrigger>
          <TabsTrigger value="streaks" className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Streaks
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Rewards
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {summary && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{summary.active_challenges}</div>
                    <div className="text-sm text-gray-600">Active Challenges</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <Trophy className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{summary.active_goals}</div>
                    <div className="text-sm text-gray-600">Active Goals</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <Flame className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{summary.streak_count}</div>
                    <div className="text-sm text-gray-600">Active Streaks</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <Gift className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{summary.unclaimed_rewards}</div>
                    <div className="text-sm text-gray-600">Unclaimed Rewards</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Challenges Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Active Challenges</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {challengesWithProgress
                      .filter(cp => cp.participation && !cp.participation.is_completed)
                      .slice(0, 3)
                      .map((challengeProgress) => (
                        <div key={challengeProgress.challenge.id} className="flex items-center justify-between p-3 border rounded-lg mb-2 last:mb-0">
                          <div>
                            <div className="font-medium">{challengeProgress.challenge.name}</div>
                            <div className="text-sm text-gray-500">
                              {challengeProgress.participation?.completion_percentage || 0}% complete
                            </div>
                          </div>
                          <div className="text-2xl">{challengeProgress.challenge.icon}</div>
                        </div>
                      ))}
                    {challengesWithProgress.filter(cp => cp.participation && !cp.participation.is_completed).length === 0 && (
                      <p className="text-gray-500 text-center py-4">No active challenges</p>
                    )}
                  </CardContent>
                </Card>

                {/* Active Goals Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Trophy className="h-5 w-5" />
                      <span>Active Goals</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {goalsWithProgress
                      .filter(gp => gp.goal.status === 'active')
                      .slice(0, 3)
                      .map((goalProgress) => (
                        <div key={goalProgress.goal.id} className="flex items-center justify-between p-3 border rounded-lg mb-2 last:mb-0">
                          <div>
                            <div className="font-medium">{goalProgress.goal.title}</div>
                            <div className="text-sm text-gray-500">
                              {goalProgress.progress_percentage}% complete
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {goalProgress.goal.current_value}/{goalProgress.goal.target_value}
                            </div>
                            <div className="text-xs text-gray-500">
                              {goalProgress.days_remaining} days left
                            </div>
                          </div>
                        </div>
                      ))}
                    {goalsWithProgress.filter(gp => gp.goal.status === 'active').length === 0 && (
                      <p className="text-gray-500 text-center py-4">No active goals</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Dining Challenges</h2>
            <Button>
              <Target className="h-4 w-4 mr-2" />
              Browse All Challenges
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challengesWithProgress.map((challengeProgress) => {
              const challenge = challengeProgress.challenge;
              const participation = challengeProgress.participation;

              return (
                <Card key={challenge.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="text-3xl">{challenge.icon}</div>
                      <Badge 
                        variant={challenge.difficulty_level === 'easy' ? 'default' : 
                                challenge.difficulty_level === 'medium' ? 'secondary' : 
                                challenge.difficulty_level === 'hard' ? 'destructive' : 'default'}
                      >
                        {challenge.difficulty_level}
                      </Badge>
                    </div>
                    <CardTitle>{challenge.name}</CardTitle>
                    <CardDescription>{challenge.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Challenge Details */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Duration:</span>
                        <span>{challenge.duration_days} days</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Category:</span>
                        <span className="capitalize">{challenge.category}</span>
                      </div>

                      {/* Progress */}
                      {participation && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{participation.completion_percentage}%</span>
                          </div>
                          <Progress value={participation.completion_percentage} />
                          
                          {!participation.is_completed && challengeProgress.time_remaining && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              {Math.floor(challengeProgress.time_remaining / 24)} days, {challengeProgress.time_remaining % 24} hours left
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="pt-2">
                        {!participation ? (
                          <Button 
                            onClick={() => joinChallenge(challenge.id)}
                            className="w-full"
                          >
                            Join Challenge
                          </Button>
                        ) : participation.is_completed ? (
                          <Button variant="secondary" disabled className="w-full">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed
                          </Button>
                        ) : (
                          <Button variant="outline" className="w-full">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            View Progress
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Personal Goals</h2>
            <Button>
              <Trophy className="h-4 w-4 mr-2" />
              Create New Goal
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goalsWithProgress.map((goalProgress) => {
              const goal = goalProgress.goal;

              return (
                <Card key={goal.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{goal.title}</CardTitle>
                        <CardDescription>{goal.description}</CardDescription>
                      </div>
                      <Badge 
                        variant={goal.status === 'completed' ? 'default' : 
                                goal.status === 'active' ? 'secondary' : 'outline'}
                      >
                        {goal.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{goal.current_value}/{goal.target_value}</span>
                        </div>
                        <Progress value={goalProgress.progress_percentage} />
                        <div className="text-sm text-gray-500">
                          {goalProgress.progress_percentage}% complete
                        </div>
                      </div>

                      {/* Time Info */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Target Date:</span>
                        <span>{new Date(goal.target_date).toLocaleDateString()}</span>
                      </div>

                      {goal.status === 'active' && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Days Remaining:</span>
                          <span className={goalProgress.days_remaining < 7 ? 'text-red-600' : 'text-gray-900'}>
                            {goalProgress.days_remaining} days
                          </span>
                        </div>
                      )}

                      {/* Priority */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Priority:</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < goal.priority_level ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Leaderboards Tab */}
        <TabsContent value="leaderboards" className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Leaderboards</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Family Leaderboards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Family Rankings</span>
                </CardTitle>
                <CardDescription>See how you rank within your family</CardDescription>
              </CardHeader>
              <CardContent>
                {familyLeaderboards.length > 0 ? (
                  <div className="space-y-4">
                    {familyLeaderboards.slice(0, 3).map((leaderboard) => (
                      <div key={leaderboard.id} className="space-y-2">
                        <h4 className="font-medium capitalize">
                          {leaderboard.leaderboard_type.replace('_', ' ')}
                        </h4>
                        <div className="space-y-1">
                          {(leaderboard.rankings as any[]).slice(0, 5).map((ranking, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                  index === 1 ? 'bg-gray-100 text-gray-800' :
                                  index === 2 ? 'bg-orange-100 text-orange-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {ranking.rank}
                                </div>
                                <span>{ranking.display_name}</span>
                              </div>
                              <span className="font-medium">{ranking.score}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No family leaderboards available</p>
                )}
              </CardContent>
            </Card>

            {/* Global Leaderboards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="h-5 w-5" />
                  <span>Global Rankings</span>
                </CardTitle>
                <CardDescription>Top performers across all families</CardDescription>
              </CardHeader>
              <CardContent>
                {globalLeaderboards.length > 0 ? (
                  <div className="space-y-4">
                    {globalLeaderboards.slice(0, 3).map((leaderboard) => (
                      <div key={leaderboard.id} className="space-y-2">
                        <h4 className="font-medium capitalize">
                          {leaderboard.leaderboard_type.replace('_', ' ')}
                        </h4>
                        <div className="space-y-1">
                          {(leaderboard.rankings as any[]).slice(0, 5).map((ranking, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                  index === 1 ? 'bg-gray-100 text-gray-800' :
                                  index === 2 ? 'bg-orange-100 text-orange-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {ranking.rank}
                                </div>
                                <span>{ranking.display_name}</span>
                              </div>
                              <span className="font-medium">{ranking.score}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No global leaderboards available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Streaks Tab */}
        <TabsContent value="streaks" className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Streaks & Milestones</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enhancedStreaks.map((streak) => (
              <Card key={streak.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Flame className="h-5 w-5 text-orange-600" />
                    <span className="capitalize">{streak.streak_type.replace('_', ' ')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Current Streak */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {streak.current_streak}
                      </div>
                      <div className="text-sm text-gray-500">Current Streak</div>
                    </div>

                    {/* Best Streak */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Best Streak:</span>
                      <span className="font-medium">{streak.best_streak}</span>
                    </div>

                    {/* Progress to Next Milestone */}
                    {streak.next_milestone && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Next Milestone:</span>
                          <span>{streak.next_milestone.name}</span>
                        </div>
                        <Progress value={streak.progress_to_next || 0} />
                        <div className="text-xs text-gray-500">
                          {streak.next_milestone.milestone_days - streak.current_streak} more to go
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <AchievementNotifications />
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6">
          <RewardRedemptionSystem />
        </TabsContent>
      </Tabs>
    </div>
  );
}
