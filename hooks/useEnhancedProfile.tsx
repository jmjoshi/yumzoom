'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import {
  PreferenceTracking,
  DiningPattern,
  UserWishlist,
  WishlistItem,
  Achievement,
  UserAchievement,
  UserStreak,
  PersonalizationSettings,
  DiningInsight,
  FamilyDiningStats,
  CreatePreferenceTracking,
  CreateWishlist,
  CreateWishlistItem,
  UpdatePersonalizationSettings,
  RecommendationFeedback,
  PreferenceAnalytics
} from '@/types/enhanced-profile';
import toast from 'react-hot-toast';

export function useEnhancedProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<PreferenceTracking[]>([]);
  const [diningPatterns, setDiningPatterns] = useState<DiningPattern[]>([]);
  const [wishlists, setWishlists] = useState<UserWishlist[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [streaks, setStreaks] = useState<UserStreak[]>([]);
  const [personalizationSettings, setPersonalizationSettings] = useState<PersonalizationSettings | null>(null);
  const [insights, setInsights] = useState<DiningInsight[]>([]);
  const [familyStats, setFamilyStats] = useState<FamilyDiningStats | null>(null);

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('preference_tracking')
        .select('*')
        .eq('user_id', user.id)
        .order('last_updated', { ascending: false });

      if (error) throw error;
      setPreferences(data || []);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  }, [user]);

  // Fetch dining patterns
  const fetchDiningPatterns = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('dining_patterns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiningPatterns(data || []);
    } catch (error) {
      console.error('Error fetching dining patterns:', error);
    }
  }, [user]);

  // Fetch wishlists
  const fetchWishlists = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_wishlists')
        .select(`
          *
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWishlists(data || []);
    } catch (error) {
      console.error('Error fetching wishlists:', error);
    }
  }, [user]);

  // Fetch achievements
  const fetchAchievements = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements (*)
        `)
        .eq('user_id', user.id)
        .order('earned_date', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  }, [user]);

  // Fetch streaks
  const fetchStreaks = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .order('streak_type');

      if (error) throw error;
      setStreaks(data || []);
    } catch (error) {
      console.error('Error fetching streaks:', error);
    }
  }, [user]);

  // Fetch personalization settings
  const fetchPersonalizationSettings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('personalization_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setPersonalizationSettings(data);
    } catch (error) {
      console.error('Error fetching personalization settings:', error);
    }
  }, [user]);

  // Fetch dining insights
  const fetchInsights = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('dining_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  }, [user]);

  // Create or update preference
  const updatePreference = async (preferenceData: CreatePreferenceTracking) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('preference_tracking')
        .upsert({
          user_id: user.id,
          ...preferenceData,
          last_updated: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await fetchPreferences();
      toast.success('Preference updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error('Failed to update preference');
      throw error;
    }
  };

  // Create wishlist
  const createWishlist = async (wishlistData: CreateWishlist) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('user_wishlists')
        .insert({
          user_id: user.id,
          ...wishlistData
        })
        .select()
        .single();

      if (error) throw error;

      await fetchWishlists();
      toast.success('Wishlist created successfully');
      return data;
    } catch (error) {
      console.error('Error creating wishlist:', error);
      toast.error('Failed to create wishlist');
      throw error;
    }
  };

  // Add item to wishlist
  const addToWishlist = async (wishlistId: string, itemData: CreateWishlistItem) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .insert({
          wishlist_id: wishlistId,
          added_by_user_id: user.id,
          ...itemData
        })
        .select()
        .single();

      if (error) throw error;

      await fetchWishlists();
      toast.success('Restaurant added to wishlist');
      return data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
      throw error;
    }
  };

  // Update personalization settings
  const updatePersonalizationSettings = async (settings: UpdatePersonalizationSettings) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('personalization_settings')
        .upsert({
          user_id: user.id,
          ...settings
        })
        .select()
        .single();

      if (error) throw error;

      setPersonalizationSettings(data);
      toast.success('Settings updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
      throw error;
    }
  };

  // Mark insight as read
  const markInsightAsRead = async (insightId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('dining_insights')
        .update({ is_read: true })
        .eq('id', insightId)
        .eq('user_id', user.id);

      if (error) throw error;

      setInsights(prev => 
        prev.map(insight => 
          insight.id === insightId 
            ? { ...insight, is_read: true }
            : insight
        )
      );
    } catch (error) {
      console.error('Error marking insight as read:', error);
    }
  };

  // Submit recommendation feedback
  const submitRecommendationFeedback = async (feedback: Omit<RecommendationFeedback, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('recommendation_feedback')
        .insert({
          user_id: user.id,
          ...feedback
        });

      if (error) throw error;

      toast.success('Feedback submitted successfully');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
      throw error;
    }
  };

  // Generate dining insights
  const generateInsights = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('generate_dining_insights', {
        target_user_id: user.id
      });

      if (error) throw error;

      await fetchInsights();
    } catch (error) {
      console.error('Error generating insights:', error);
    }
  };

  // Check and award achievements
  const checkAchievements = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('check_and_award_achievements', {
        target_user_id: user.id
      });

      if (error) throw error;

      await fetchAchievements();
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  // Update streak
  const updateStreak = async (streakType: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('update_user_streak', {
        target_user_id: user.id,
        streak_type_param: streakType
      });

      if (error) throw error;

      await fetchStreaks();
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  // Calculate preference analytics
  const calculatePreferenceAnalytics = useCallback((): PreferenceAnalytics | null => {
    if (preferences.length === 0) return null;

    const cuisinePrefs = preferences.filter(p => p.preference_type === 'cuisine');
    const recentPrefs = preferences.filter(p => 
      new Date(p.last_updated) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    const stabilityScore = cuisinePrefs.length > 0 
      ? cuisinePrefs.reduce((sum, p) => sum + p.confidence_score, 0) / cuisinePrefs.length
      : 0;

    const discoveryRate = recentPrefs.filter(p => p.source === 'learned').length / Math.max(recentPrefs.length, 1);

    return {
      preference_stability: stabilityScore,
      discovery_rate: discoveryRate,
      social_influence: 0.5, // Placeholder - would need social data
      seasonal_variation: 0.3, // Placeholder - would need temporal analysis
      recommendation_acceptance: 0.7 // Placeholder - would need feedback data
    };
  }, [preferences]);

  // Fetch family dining statistics
  const fetchFamilyStats = useCallback(async () => {
    if (!user) return;

    try {
      // This would typically be a complex query or stored procedure
      // For now, we'll create a simplified version
      const { data: ratings, error } = await supabase
        .from('ratings')
        .select(`
          *,
          menu_item:menu_items (
            restaurant:restaurants (
              cuisine_type
            )
          ),
          family_member:family_members (
            name
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Process the data to create family stats
      const cuisineCount: Record<string, number> = {};
      let totalRatings = ratings?.length || 0;

      ratings?.forEach(rating => {
        const cuisine = rating.menu_item?.restaurant?.cuisine_type;
        if (cuisine) {
          cuisineCount[cuisine] = (cuisineCount[cuisine] || 0) + 1;
        }
      });

      const favoriteCuisines = Object.entries(cuisineCount)
        .map(([cuisine, count]) => ({
          cuisine,
          percentage: (count / totalRatings) * 100
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5);

      const stats: FamilyDiningStats = {
        total_restaurants_visited: new Set(ratings?.map(r => r.menu_item?.restaurant?.id).filter(Boolean)).size,
        total_reviews_written: totalRatings,
        favorite_cuisines: favoriteCuisines,
        dining_frequency: {
          weekly_average: 2.5, // Placeholder
          monthly_trend: 'stable'
        },
        price_distribution: {
          budget: 25,
          moderate: 50,
          upscale: 20,
          fine_dining: 5
        },
        top_family_preferences: [], // Would need family member analysis
        seasonal_patterns: [] // Would need temporal analysis
      };

      setFamilyStats(stats);
    } catch (error) {
      console.error('Error fetching family stats:', error);
    }
  }, [user]);

  // Initialize data
  useEffect(() => {
    if (user) {
      Promise.all([
        fetchPreferences(),
        fetchDiningPatterns(),
        fetchWishlists(),
        fetchAchievements(),
        fetchStreaks(),
        fetchPersonalizationSettings(),
        fetchInsights(),
        fetchFamilyStats()
      ]);
    }
  }, [user, fetchPreferences, fetchDiningPatterns, fetchWishlists, fetchAchievements, fetchStreaks, fetchPersonalizationSettings, fetchInsights, fetchFamilyStats]);

  return {
    loading,
    preferences,
    diningPatterns,
    wishlists,
    achievements,
    streaks,
    personalizationSettings,
    insights,
    familyStats,
    updatePreference,
    createWishlist,
    addToWishlist,
    updatePersonalizationSettings,
    markInsightAsRead,
    submitRecommendationFeedback,
    generateInsights,
    checkAchievements,
    updateStreak,
    calculatePreferenceAnalytics: calculatePreferenceAnalytics(),
    refetch: {
      preferences: fetchPreferences,
      patterns: fetchDiningPatterns,
      wishlists: fetchWishlists,
      achievements: fetchAchievements,
      streaks: fetchStreaks,
      settings: fetchPersonalizationSettings,
      insights: fetchInsights,
      stats: fetchFamilyStats
    }
  };
}
