// Advanced Gamification Types
// Type definitions for dining challenges, goals, leaderboards, and enhanced achievements

export interface DiningChallenge {
  id: string;
  name: string;
  description: string;
  challenge_type: 'personal' | 'family' | 'community' | 'seasonal';
  category: 'exploration' | 'frequency' | 'social' | 'variety' | 'quality';
  difficulty_level: 'easy' | 'medium' | 'hard' | 'expert';
  duration_days: number;
  requirements: Record<string, any>;
  rewards: ChallengeReward[];
  icon: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  max_participants?: number;
  created_at: string;
  updated_at: string;
}

export interface ChallengeReward {
  type: 'points' | 'badge' | 'discount' | 'feature_unlock' | 'special_recognition';
  title: string;
  description: string;
  value: Record<string, any>;
}

export interface UserChallengeParticipation {
  id: string;
  user_id: string;
  family_id?: string;
  challenge_id: string;
  start_date: string;
  end_date?: string;
  progress: Record<string, any>;
  completion_percentage: number;
  is_completed: boolean;
  completed_at?: string;
  rewards_claimed: boolean;
  created_at: string;
  updated_at: string;
  challenge?: DiningChallenge;
}

export interface UserGoal {
  id: string;
  user_id: string;
  family_member_id?: string;
  goal_type: 'dining_frequency' | 'cuisine_exploration' | 'review_writing' | 'social_engagement' | 'budget_management' | 'health_conscious';
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  target_date: string;
  priority_level: number; // 1-5
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  reminder_frequency: 'daily' | 'weekly' | 'monthly' | 'none';
  is_public: boolean;
  rewards: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FamilyLeaderboard {
  id: string;
  family_id: string;
  leaderboard_type: 'monthly_reviews' | 'cuisine_exploration' | 'achievement_points' | 'dining_frequency' | 'social_engagement';
  period_start: string;
  period_end: string;
  rankings: LeaderboardRanking[];
  total_participants: number;
  created_at: string;
  updated_at: string;
}

export interface GlobalLeaderboard {
  id: string;
  leaderboard_type: 'top_reviewers' | 'cuisine_explorers' | 'achievement_hunters' | 'social_connectors' | 'challenge_champions';
  period_type: 'weekly' | 'monthly' | 'yearly' | 'all_time';
  period_start: string;
  period_end: string;
  rankings: LeaderboardRanking[];
  total_participants: number;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardRanking {
  user_id: string;
  display_name: string;
  score: number;
  rank: number;
  avatar_url?: string;
  family_name?: string;
}

export interface AchievementCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface AchievementMilestone {
  id: string;
  achievement_id: string;
  milestone_level: number;
  name: string;
  description: string;
  requirements: Record<string, any>;
  points_bonus: number;
  badge_icon?: string;
  created_at: string;
}

export interface UserMilestoneProgress {
  id: string;
  user_id: string;
  milestone_id: string;
  progress_value: number;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  milestone?: AchievementMilestone;
}

export interface StreakMilestone {
  id: string;
  streak_type: string;
  milestone_days: number;
  name: string;
  description: string;
  icon: string;
  rewards: Record<string, any>;
  created_at: string;
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_type: 'points' | 'badge' | 'discount' | 'feature_unlock' | 'special_recognition';
  reward_source: 'achievement' | 'challenge' | 'goal' | 'streak' | 'leaderboard';
  source_id: string;
  title: string;
  description: string;
  value_data: Record<string, any>;
  is_claimed: boolean;
  claimed_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface GamificationSettings {
  id: string;
  user_id: string;
  challenges_enabled: boolean;
  leaderboards_enabled: boolean;
  notifications_enabled: boolean;
  public_progress: boolean;
  achievement_notifications: boolean;
  challenge_reminders: boolean;
  goal_reminders: boolean;
  created_at: string;
  updated_at: string;
}

// Enhanced streak information with milestones
export interface EnhancedStreak {
  id: string;
  user_id: string;
  streak_type: string;
  current_streak: number;
  best_streak: number;
  last_activity_date?: string;
  created_at: string;
  updated_at: string;
  milestones?: StreakMilestone[];
  next_milestone?: StreakMilestone;
  progress_to_next?: number;
}

// Challenge participation with full details
export interface ChallengeWithProgress {
  challenge: DiningChallenge;
  participation?: UserChallengeParticipation;
  can_participate: boolean;
  is_eligible: boolean;
  time_remaining?: number; // in hours
}

// Goal with progress tracking
export interface GoalWithProgress {
  goal: UserGoal;
  progress_percentage: number;
  days_remaining: number;
  is_achievable: boolean;
  suggested_actions?: string[];
}

// Leaderboard position for a user
export interface UserLeaderboardPosition {
  leaderboard_type: string;
  rank: number;
  score: number;
  total_participants: number;
  percentile: number;
  trend: 'up' | 'down' | 'stable';
  points_to_next_rank?: number;
}

// Gamification dashboard summary
export interface GamificationSummary {
  total_points: number;
  active_challenges: number;
  completed_challenges: number;
  active_goals: number;
  completed_goals: number;
  current_rank: number;
  achievement_count: number;
  streak_count: number;
  unclaimed_rewards: number;
  level: number;
  level_progress: number;
  next_level_points: number;
}

// Challenge completion statistics
export interface ChallengeStats {
  total_challenges: number;
  completed_challenges: number;
  success_rate: number;
  favorite_category: string;
  total_points_earned: number;
  current_active: number;
  average_completion_time: number; // in days
}

// Goal achievement statistics
export interface GoalStats {
  total_goals: number;
  completed_goals: number;
  success_rate: number;
  average_completion_time: number; // in days
  most_common_type: string;
  total_target_value: number;
  total_achieved_value: number;
}

// Family competition data
export interface FamilyCompetition {
  family_id: string;
  family_name: string;
  total_members: number;
  active_members: number;
  family_rank: number;
  total_family_points: number;
  current_competition?: {
    name: string;
    end_date: string;
    my_rank: number;
    my_score: number;
    leader_score: number;
  };
}

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type ChallengeCategory = 'exploration' | 'frequency' | 'social' | 'variety' | 'quality';
export type GoalType = 'dining_frequency' | 'cuisine_exploration' | 'review_writing' | 'social_engagement' | 'budget_management' | 'health_conscious';
export type LeaderboardType = 'monthly_reviews' | 'cuisine_exploration' | 'achievement_points' | 'dining_frequency' | 'social_engagement';
export type RewardType = 'points' | 'badge' | 'discount' | 'feature_unlock' | 'special_recognition';
