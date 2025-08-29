import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to get user from Authorization header
async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return user;
}

// Schema for joining a challenge
const joinChallengeSchema = z.object({
  challengeId: z.string().uuid(),
});

// Schema for creating a goal
const createGoalSchema = z.object({
  goal_type: z.enum(['dining_frequency', 'cuisine_exploration', 'review_writing', 'social_engagement', 'budget_management', 'health_conscious']),
  title: z.string().min(1).max(100),
  description: z.string().max(500),
  target_value: z.number().min(1),
  target_date: z.string(),
  priority_level: z.number().min(1).max(5),
  reminder_frequency: z.enum(['daily', 'weekly', 'monthly', 'none']),
  is_public: z.boolean().default(false),
});

// Schema for updating goal progress
const updateGoalProgressSchema = z.object({
  goalId: z.string().uuid(),
  newValue: z.number().min(0),
});

// Schema for claiming a reward
const claimRewardSchema = z.object({
  rewardId: z.string().uuid(),
});

// Schema for updating gamification settings
const updateSettingsSchema = z.object({
  challenges_enabled: z.boolean().optional(),
  leaderboards_enabled: z.boolean().optional(),
  notifications_enabled: z.boolean().optional(),
  public_progress: z.boolean().optional(),
  achievement_notifications: z.boolean().optional(),
  challenge_reminders: z.boolean().optional(),
  goal_reminders: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'summary': {
        // Get gamification summary
        const { data: rewards } = await supabase
          .from('user_rewards')
          .select('*')
          .eq('user_id', user.id);

        const { data: challenges } = await supabase
          .from('user_challenge_participation')
          .select('*')
          .eq('user_id', user.id);

        const { data: goals } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', user.id);

        const { data: streaks } = await supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', user.id);

        const totalPoints = (rewards || []).filter((r: any) => r.is_claimed && r.reward_type === 'points')
          .reduce((sum: number, r: any) => sum + (r.value_data?.points || 0), 0);

        const summary = {
          total_points: totalPoints,
          active_challenges: (challenges || []).filter((c: any) => !c.is_completed).length,
          completed_challenges: (challenges || []).filter((c: any) => c.is_completed).length,
          active_goals: (goals || []).filter((g: any) => g.status === 'active').length,
          completed_goals: (goals || []).filter((g: any) => g.status === 'completed').length,
          streak_count: (streaks || []).filter((s: any) => s.current_streak > 0).length,
          unclaimed_rewards: (rewards || []).filter((r: any) => !r.is_claimed).length,
          level: Math.floor(totalPoints / 1000) + 1,
          level_progress: (totalPoints % 1000) / 1000 * 100,
          next_level_points: 1000 - (totalPoints % 1000),
        };

        return NextResponse.json({ summary });
      }

      case 'challenges': {
        // Get available challenges with user's participation status
        const { data: challenges } = await supabase
          .from('dining_challenges')
          .select('*')
          .eq('is_active', true)
          .order('difficulty_level', { ascending: true });

        const { data: participations } = await supabase
          .from('user_challenge_participation')
          .select('*')
          .eq('user_id', user.id);

        const challengesWithProgress = (challenges || []).map((challenge: any) => {
          const participation = (participations || []).find((p: any) => p.challenge_id === challenge.id);
          return {
            challenge,
            participation,
            can_participate: !participation || (!participation.is_completed && participation.completion_percentage < 100),
          };
        });

        return NextResponse.json({ challenges: challengesWithProgress });
      }

      case 'goals': {
        // Get user's goals with progress
        const { data: goals } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        const goalsWithProgress = (goals || []).map((goal: any) => {
          const progressPercentage = Math.round((goal.current_value / goal.target_value) * 100);
          const daysRemaining = Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

          return {
            goal,
            progress_percentage: Math.min(100, progressPercentage),
            days_remaining: Math.max(0, daysRemaining),
            is_achievable: daysRemaining > 0 && goal.status === 'active',
          };
        });

        return NextResponse.json({ goals: goalsWithProgress });
      }

      case 'leaderboards': {
        // Get family and global leaderboards
        const { data: familyData } = await supabase
          .from('family_members')
          .select('family_id')
          .eq('user_id', user.id)
          .single();

        let familyLeaderboards = [];
        if (familyData) {
          const { data } = await supabase
            .from('family_leaderboards')
            .select('*')
            .eq('family_id', familyData.family_id)
            .order('period_start', { ascending: false })
            .limit(10);
          familyLeaderboards = data || [];
        }

        const { data: globalLeaderboards } = await supabase
          .from('global_leaderboards')
          .select('*')
          .order('period_start', { ascending: false })
          .limit(20);

        return NextResponse.json({
          familyLeaderboards,
          globalLeaderboards: globalLeaderboards || []
        });
      }

      case 'rewards': {
        // Get user's rewards
        const { data: rewards } = await supabase
          .from('user_rewards')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        return NextResponse.json({ rewards: rewards || [] });
      }

      case 'settings': {
        // Get user's gamification settings
        const { data: settings } = await supabase
          .from('gamification_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        return NextResponse.json({ settings });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Gamification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'join_challenge': {
        const { challengeId } = joinChallengeSchema.parse(body);

        const { data, error } = await supabase
          .from('user_challenge_participation')
          .insert([{
            user_id: user.id,
            challenge_id: challengeId,
            start_date: new Date().toISOString(),
          }])
          .select()
          .single();

        if (error) throw error;

        return NextResponse.json({ participation: data });
      }

      case 'create_goal': {
        const goalData = createGoalSchema.parse(body);

        const { data, error } = await supabase
          .from('user_goals')
          .insert([{
            ...goalData,
            user_id: user.id,
            current_value: 0,
            status: 'active',
          }])
          .select()
          .single();

        if (error) throw error;

        return NextResponse.json({ goal: data });
      }

      case 'update_goal_progress': {
        const { goalId, newValue } = updateGoalProgressSchema.parse(body);

        // Get the goal first
        const { data: goal } = await supabase
          .from('user_goals')
          .select('*')
          .eq('id', goalId)
          .eq('user_id', user.id)
          .single();

        if (!goal) {
          return NextResponse.json(
            { error: 'Goal not found' },
            { status: 404 }
          );
        }

        const isCompleted = newValue >= goal.target_value;

        const { data, error } = await supabase
          .from('user_goals')
          .update({
            current_value: newValue,
            status: isCompleted ? 'completed' : 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', goalId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        return NextResponse.json({ goal: data });
      }

      case 'claim_reward': {
        const { rewardId } = claimRewardSchema.parse(body);

        const { data, error } = await supabase
          .from('user_rewards')
          .update({
            is_claimed: true,
            claimed_at: new Date().toISOString(),
          })
          .eq('id', rewardId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        return NextResponse.json({ reward: data });
      }

      case 'update_settings': {
        const settingsData = updateSettingsSchema.parse(body);

        const { data, error } = await supabase
          .from('gamification_settings')
          .upsert([{
            user_id: user.id,
            ...settingsData,
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (error) throw error;

        return NextResponse.json({ settings: data });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Gamification API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
