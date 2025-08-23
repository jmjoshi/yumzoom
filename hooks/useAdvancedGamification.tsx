import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
  DiningChallenge,
  UserChallengeParticipation,
  UserGoal,
  FamilyLeaderboard,
  GlobalLeaderboard,
  UserReward,
  GamificationSettings,
  GamificationSummary,
  ChallengeWithProgress,
  GoalWithProgress,
  UserLeaderboardPosition,
  ChallengeStats,
  GoalStats,
  EnhancedStreak,
  StreakMilestone
} from '@/types/advanced-gamification';

export function useAdvancedGamification() {
  const { user } = useAuth();

  // State management
  const [challenges, setChallenges] = useState<DiningChallenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallengeParticipation[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [familyLeaderboards, setFamilyLeaderboards] = useState<FamilyLeaderboard[]>([]);
  const [globalLeaderboards, setGlobalLeaderboards] = useState<GlobalLeaderboard[]>([]);
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [settings, setSettings] = useState<GamificationSettings | null>(null);
  const [summary, setSummary] = useState<GamificationSummary | null>(null);
  const [enhancedStreaks, setEnhancedStreaks] = useState<EnhancedStreak[]>([]);
  const [streakMilestones, setStreakMilestones] = useState<StreakMilestone[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available challenges
  const fetchChallenges = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('dining_challenges')
        .select('*')
        .eq('is_active', true)
        .order('difficulty_level', { ascending: true });

      if (error) throw error;
      setChallenges(data || []);
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setError('Failed to load challenges');
    }
  }, []);

  // Fetch user's challenge participation
  const fetchUserChallenges = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_challenge_participation')
        .select(`
          *,
          challenge:dining_challenges(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserChallenges(data || []);
    } catch (err) {
      console.error('Error fetching user challenges:', err);
      setError('Failed to load your challenges');
    }
  }, [user]);

  // Fetch user goals
  const fetchGoals = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('Failed to load goals');
    }
  }, [user]);

  // Fetch family leaderboards
  const fetchFamilyLeaderboards = useCallback(async () => {
    if (!user) return;

    try {
      // First get user's family
      const { data: familyData } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id)
        .single();

      if (!familyData) return;

      const { data, error } = await supabase
        .from('family_leaderboards')
        .select('*')
        .eq('family_id', familyData.family_id)
        .order('period_start', { ascending: false })
        .limit(10);

      if (error) throw error;
      setFamilyLeaderboards(data || []);
    } catch (err) {
      console.error('Error fetching family leaderboards:', err);
    }
  }, [user]);

  // Fetch global leaderboards
  const fetchGlobalLeaderboards = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('global_leaderboards')
        .select('*')
        .order('period_start', { ascending: false })
        .limit(20);

      if (error) throw error;
      setGlobalLeaderboards(data || []);
    } catch (err) {
      console.error('Error fetching global leaderboards:', err);
    }
  }, []);

  // Fetch user rewards
  const fetchRewards = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRewards(data || []);
    } catch (err) {
      console.error('Error fetching rewards:', err);
    }
  }, [user]);

  // Fetch gamification settings
  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('gamification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setSettings(data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, [user]);

  // Fetch enhanced streaks with milestones
  const fetchEnhancedStreaks = useCallback(async () => {
    if (!user) return;

    try {
      const { data: streakData, error: streakError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id);

      if (streakError) throw streakError;

      const { data: milestoneData, error: milestoneError } = await supabase
        .from('streak_milestones')
        .select('*')
        .order('milestone_days', { ascending: true });

      if (milestoneError) throw milestoneError;

      // Combine streaks with their milestones
      const enhanced = (streakData || []).map(streak => {
        const relevantMilestones = (milestoneData || []).filter(
          m => m.streak_type === streak.streak_type
        );
        
        const nextMilestone = relevantMilestones.find(
          m => m.milestone_days > streak.current_streak
        );

        return {
          ...streak,
          milestones: relevantMilestones,
          next_milestone: nextMilestone,
          progress_to_next: nextMilestone 
            ? Math.round((streak.current_streak / nextMilestone.milestone_days) * 100)
            : 100
        };
      });

      setEnhancedStreaks(enhanced);
      setStreakMilestones(milestoneData || []);
    } catch (err) {
      console.error('Error fetching enhanced streaks:', err);
    }
  }, [user]);

  // Join a challenge
  const joinChallenge = useCallback(async (challengeId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_challenge_participation')
        .insert([{
          user_id: user.id,
          challenge_id: challengeId,
          start_date: new Date().toISOString()
        }]);

      if (error) throw error;
      
      await fetchUserChallenges();
      return true;
    } catch (err) {
      console.error('Error joining challenge:', err);
      setError('Failed to join challenge');
      return false;
    }
  }, [user, fetchUserChallenges]);

  // Create a new goal
  const createGoal = useCallback(async (goalData: Partial<UserGoal>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_goals')
        .insert([{
          ...goalData,
          user_id: user.id,
          current_value: 0,
          status: 'active'
        }]);

      if (error) throw error;
      
      await fetchGoals();
      return true;
    } catch (err) {
      console.error('Error creating goal:', err);
      setError('Failed to create goal');
      return false;
    }
  }, [user, fetchGoals]);

  // Update goal progress
  const updateGoalProgress = useCallback(async (goalId: string, newValue: number) => {
    if (!user) return false;

    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return false;

      const isCompleted = newValue >= goal.target_value;

      const { error } = await supabase
        .from('user_goals')
        .update({
          current_value: newValue,
          status: isCompleted ? 'completed' : 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchGoals();
      return true;
    } catch (err) {
      console.error('Error updating goal progress:', err);
      return false;
    }
  }, [user, goals, fetchGoals]);

  // Claim a reward
  const claimReward = useCallback(async (rewardId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_rewards')
        .update({
          is_claimed: true,
          claimed_at: new Date().toISOString()
        })
        .eq('id', rewardId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchRewards();
      return true;
    } catch (err) {
      console.error('Error claiming reward:', err);
      return false;
    }
  }, [user, fetchRewards]);

  // Update gamification settings
  const updateSettings = useCallback(async (newSettings: Partial<GamificationSettings>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('gamification_settings')
        .upsert([{
          user_id: user.id,
          ...newSettings,
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      await fetchSettings();
      return true;
    } catch (err) {
      console.error('Error updating settings:', err);
      return false;
    }
  }, [user, fetchSettings]);

  // Get challenges with progress
  const getChallengesWithProgress = useCallback((): ChallengeWithProgress[] => {
    return challenges.map(challenge => {
      const participation = userChallenges.find(uc => uc.challenge_id === challenge.id);
      const canParticipate = !participation || (!participation.is_completed && participation.completion_percentage < 100);
      
      let timeRemaining;
      if (participation && !participation.is_completed) {
        const endDate = new Date(participation.start_date);
        endDate.setDate(endDate.getDate() + challenge.duration_days);
        timeRemaining = Math.max(0, Math.floor((endDate.getTime() - Date.now()) / (1000 * 60 * 60)));
      }

      return {
        challenge,
        participation,
        can_participate: canParticipate,
        is_eligible: true, // Could add more complex eligibility logic
        time_remaining: timeRemaining
      };
    });
  }, [challenges, userChallenges]);

  // Get goals with progress
  const getGoalsWithProgress = useCallback((): GoalWithProgress[] => {
    return goals.map(goal => {
      const progressPercentage = Math.round((goal.current_value / goal.target_value) * 100);
      const daysRemaining = Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const isAchievable = daysRemaining > 0 && goal.status === 'active';

      return {
        goal,
        progress_percentage: Math.min(100, progressPercentage),
        days_remaining: Math.max(0, daysRemaining),
        is_achievable: isAchievable,
        suggested_actions: [] // Could add AI-powered suggestions
      };
    });
  }, [goals]);

  // Calculate gamification summary
  const calculateSummary = useCallback((): GamificationSummary => {
    const totalPoints = rewards
      .filter(r => r.is_claimed && r.reward_type === 'points')
      .reduce((sum, r) => sum + (r.value_data.points || 0), 0);

    const activeChallenges = userChallenges.filter(uc => !uc.is_completed).length;
    const completedChallenges = userChallenges.filter(uc => uc.is_completed).length;
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const unclaimedRewards = rewards.filter(r => !r.is_claimed).length;

    // Calculate level based on points
    const level = Math.floor(totalPoints / 1000) + 1;
    const levelProgress = (totalPoints % 1000) / 1000 * 100;
    const nextLevelPoints = 1000 - (totalPoints % 1000);

    return {
      total_points: totalPoints,
      active_challenges: activeChallenges,
      completed_challenges: completedChallenges,
      active_goals: activeGoals,
      completed_goals: completedGoals,
      current_rank: 0, // Would need to calculate from leaderboards
      achievement_count: 0, // Would need to fetch achievements
      streak_count: enhancedStreaks.filter(s => s.current_streak > 0).length,
      unclaimed_rewards: unclaimedRewards,
      level: level,
      level_progress: levelProgress,
      next_level_points: nextLevelPoints
    };
  }, [rewards, userChallenges, goals, enhancedStreaks]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchChallenges(),
        fetchUserChallenges(),
        fetchGoals(),
        fetchFamilyLeaderboards(),
        fetchGlobalLeaderboards(),
        fetchRewards(),
        fetchSettings(),
        fetchEnhancedStreaks()
      ]);
    } catch (err) {
      console.error('Error refreshing gamification data:', err);
      setError('Failed to load gamification data');
    } finally {
      setLoading(false);
    }
  }, [
    fetchChallenges,
    fetchUserChallenges,
    fetchGoals,
    fetchFamilyLeaderboards,
    fetchGlobalLeaderboards,
    fetchRewards,
    fetchSettings,
    fetchEnhancedStreaks
  ]);

  // Update summary when dependent data changes
  useEffect(() => {
    if (!loading) {
      setSummary(calculateSummary());
    }
  }, [calculateSummary, loading]);

  // Initial data load
  useEffect(() => {
    if (user) {
      refreshAll();
    }
  }, [user, refreshAll]);

  return {
    // Data
    challenges,
    userChallenges,
    goals,
    familyLeaderboards,
    globalLeaderboards,
    rewards,
    settings,
    summary,
    enhancedStreaks,
    streakMilestones,
    
    // Computed data
    challengesWithProgress: getChallengesWithProgress(),
    goalsWithProgress: getGoalsWithProgress(),
    
    // Actions
    joinChallenge,
    createGoal,
    updateGoalProgress,
    claimReward,
    updateSettings,
    refreshAll,
    
    // State
    loading,
    error,
    
    // Utils
    calculateSummary
  };
}
