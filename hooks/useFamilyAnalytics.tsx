'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { 
  TimeRange, 
  FamilyInsights, 
  PopularRestaurant, 
  CuisinePreference, 
  MemberActivity 
} from '@/types/analytics';

interface UseFamilyAnalyticsReturn {
  familyInsights: FamilyInsights | null;
  popularRestaurants: PopularRestaurant[];
  cuisinePreferences: CuisinePreference[];
  memberActivity: MemberActivity[];
  loading: boolean;
  error: string | null;
  refreshAnalytics: () => void;
}

export function useFamilyAnalytics(timeRange: TimeRange): UseFamilyAnalyticsReturn {
  const { user } = useAuth();
  const [familyInsights, setFamilyInsights] = useState<FamilyInsights | null>(null);
  const [popularRestaurants, setPopularRestaurants] = useState<PopularRestaurant[]>([]);
  const [cuisinePreferences, setCuisinePreferences] = useState<CuisinePreference[]>([]);
  const [memberActivity, setMemberActivity] = useState<MemberActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = useCallback((range: TimeRange) => {
    const now = new Date();
    const endDate = now.toISOString();
    let startDate: string;

    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString();
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString();
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();
    }

    return { startDate, endDate };
  }, []);

  const fetchFamilyInsights = useCallback(async (startDate: string, endDate: string) => {
    if (!user) return null;

    try {
      // Get all ratings for the user in the time range
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select(`
          id,
          rating,
          created_at,
          menu_items!inner (
            id,
            name,
            price,
            restaurants!inner (
              id,
              name,
              cuisine_type
            )
          ),
          family_members (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (ratingsError) throw ratingsError;

      // Get family members count
      const { data: familyMembersData, error: familyError } = await supabase
        .from('family_members')
        .select('id, name')
        .eq('user_id', user.id);

      if (familyError) throw familyError;

      const ratings = ratingsData || [];
      const totalRatings = ratings.length;
      const averageRating = totalRatings > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0;

      // Get unique restaurants
      const uniqueRestaurants = new Set(
        ratings
          .map(r => r.menu_items?.[0]?.restaurants?.[0]?.id)
          .filter(Boolean)
      );
      const totalRestaurants = uniqueRestaurants.size;

      // Estimate spending based on menu item prices
      const estimatedSpending = ratings.reduce((sum, r) => {
        const price = r.menu_items?.[0]?.price || 0;
        return sum + Number(price);
      }, 0);

      // Count active members (those who have ratings)
  const activeMembers = new Set(ratings.map(r => r.family_members?.[0]?.id).filter(Boolean));

      const insights: FamilyInsights = {
        total_restaurants: totalRestaurants,
        total_ratings: totalRatings,
        average_family_rating: Number(averageRating.toFixed(1)),
        estimated_spending: Number(estimatedSpending.toFixed(2)),
        total_family_members: familyMembersData?.length || 0,
        active_members: activeMembers.size,
        period_start: startDate,
        period_end: endDate,
      };

      return insights;
    } catch (error) {
      console.error('Error fetching family insights:', error);
      throw error;
    }
  }, [user]);

  const fetchPopularRestaurants = useCallback(async (startDate: string, endDate: string) => {
    if (!user) return [];

    try {
      const { data: ratingsData, error } = await supabase
        .from('ratings')
        .select(`
          id,
          rating,
          created_at,
          menu_items!inner (
            restaurants!inner (
              id,
              name,
              address,
              cuisine_type
            )
          )
        `)
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      // Group by restaurant
      const restaurantMap = new Map<string, {
        id: string;
        name: string;
        address?: string;
        cuisine_type?: string;
        ratings: number[];
        visits: string[];
      }>();

      (ratingsData || []).forEach(rating => {
        const restaurant = rating.menu_items?.[0]?.restaurants?.[0];
        if (!restaurant) return;

        if (!restaurantMap.has(restaurant.id)) {
          restaurantMap.set(restaurant.id, {
            id: restaurant.id,
            name: restaurant.name,
            address: restaurant.address,
            cuisine_type: restaurant.cuisine_type,
            ratings: [],
            visits: [],
          });
        }

        const restaurantData = restaurantMap.get(restaurant.id)!;
        restaurantData.ratings.push(rating.rating);
        restaurantData.visits.push(rating.created_at);
      });

      // Convert to array and sort by visit frequency
      const popularRestaurants: PopularRestaurant[] = Array.from(restaurantMap.values())
        .map(restaurant => ({
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name,
          restaurant_address: restaurant.address,
          cuisine_type: restaurant.cuisine_type,
          visit_frequency: restaurant.ratings.length,
          average_rating: restaurant.ratings.reduce((sum, r) => sum + r, 0) / restaurant.ratings.length,
          last_visit: Math.max(...restaurant.visits.map(v => new Date(v).getTime())).toString(),
          total_ratings: restaurant.ratings.length,
        }))
        .sort((a, b) => b.visit_frequency - a.visit_frequency)
        .slice(0, 10);

      return popularRestaurants;
    } catch (error) {
      console.error('Error fetching popular restaurants:', error);
      throw error;
    }
  }, [user]);

  const fetchCuisinePreferences = useCallback(async (startDate: string, endDate: string) => {
    if (!user) return [];

    try {
      const { data: ratingsData, error } = await supabase
        .from('ratings')
        .select(`
          rating,
          menu_items!inner (
            restaurants!inner (
              cuisine_type
            )
          )
        `)
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      // Group by cuisine type
      const cuisineMap = new Map<string, number[]>();

      (ratingsData || []).forEach(rating => {
        const cuisineType = rating.menu_items?.[0]?.restaurants?.[0]?.cuisine_type || 'Other';
        if (!cuisineMap.has(cuisineType)) {
          cuisineMap.set(cuisineType, []);
        }
        cuisineMap.get(cuisineType)!.push(rating.rating);
      });

      const totalRatings = ratingsData?.length || 0;

      // Convert to array and calculate percentages
      const cuisinePreferences: CuisinePreference[] = Array.from(cuisineMap.entries())
        .map(([cuisine, ratings]) => ({
          cuisine_type: cuisine,
          rating_count: ratings.length,
          average_rating: ratings.reduce((sum, r) => sum + r, 0) / ratings.length,
          percentage: totalRatings > 0 ? (ratings.length / totalRatings) * 100 : 0,
          trend: 'stable' as const, // TODO: Calculate actual trend
        }))
        .sort((a, b) => b.rating_count - a.rating_count);

      return cuisinePreferences;
    } catch (error) {
      console.error('Error fetching cuisine preferences:', error);
      throw error;
    }
  }, [user]);

  const fetchMemberActivity = useCallback(async (startDate: string, endDate: string) => {
    if (!user) return [];

    try {
      // Get all family members
      const { data: familyMembersData, error: familyError } = await supabase
        .from('family_members')
        .select('id, name, relationship')
        .eq('user_id', user.id);

      if (familyError) throw familyError;

      // Get ratings for each family member
      const memberActivity: MemberActivity[] = [];

      for (const member of familyMembersData || []) {
        const { data: memberRatings, error: ratingsError } = await supabase
          .from('ratings')
          .select(`
            rating,
            created_at,
            menu_items!inner (
              restaurants!inner (
                name,
                cuisine_type
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('family_member_id', member.id)
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        if (ratingsError) throw ratingsError;

        const ratings = memberRatings || [];
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
          : 0;

        // Find most frequent restaurant and cuisine
        const restaurantCounts = new Map<string, number>();
        const cuisineCounts = new Map<string, number>();

        ratings.forEach(rating => {
          const restaurant = rating.menu_items?.[0]?.restaurants?.[0]?.name;
          const cuisine = rating.menu_items?.[0]?.restaurants?.[0]?.cuisine_type;

          if (restaurant) {
            restaurantCounts.set(restaurant, (restaurantCounts.get(restaurant) || 0) + 1);
          }
          if (cuisine) {
            cuisineCounts.set(cuisine, (cuisineCounts.get(cuisine) || 0) + 1);
          }
        });

        const favoriteRestaurant = restaurantCounts.size > 0 
          ? Array.from(restaurantCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
          : undefined;

        const favoriteCuisine = cuisineCounts.size > 0 
          ? Array.from(cuisineCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
          : undefined;

        const mostRecentActivity = ratings.length > 0 
          ? Math.max(...ratings.map(r => new Date(r.created_at).getTime())).toString()
          : new Date(0).toISOString();

        memberActivity.push({
          member_id: member.id,
          member_name: member.name,
          relationship: member.relationship,
          rating_count: ratings.length,
          average_rating: Number(averageRating.toFixed(1)),
          most_recent_activity: mostRecentActivity,
          favorite_restaurant: favoriteRestaurant,
          favorite_cuisine: favoriteCuisine,
          engagement_trend: 'stable', // TODO: Calculate actual trend
        });
      }

      return memberActivity.sort((a, b) => b.rating_count - a.rating_count);
    } catch (error) {
      console.error('Error fetching member activity:', error);
      throw error;
    }
  }, [user]);

  const fetchAnalyticsData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = getDateRange(timeRange);

      const [insights, restaurants, cuisines, members] = await Promise.all([
        fetchFamilyInsights(startDate, endDate),
        fetchPopularRestaurants(startDate, endDate),
        fetchCuisinePreferences(startDate, endDate),
        fetchMemberActivity(startDate, endDate),
      ]);

      setFamilyInsights(insights);
      setPopularRestaurants(restaurants);
      setCuisinePreferences(cuisines);
      setMemberActivity(members);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [user, timeRange, getDateRange, fetchFamilyInsights, fetchPopularRestaurants, fetchCuisinePreferences, fetchMemberActivity]);

  const refreshAnalytics = useCallback(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, fetchAnalyticsData]);

  return {
    familyInsights,
    popularRestaurants,
    cuisinePreferences,
    memberActivity,
    loading,
    error,
    refreshAnalytics,
  };
}
