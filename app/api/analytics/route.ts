import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TimeRange } from '@/types/analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get('timeRange') as TimeRange) || 'month';
    
    // Get user from Supabase auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate date range
    const now = new Date();
    const endDate = now.toISOString();
    let startDate: string;

    switch (timeRange) {
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

    // Fetch analytics data using views for better performance
    const [
      familyInsightsResult,
      popularRestaurantsResult,
      cuisinePreferencesResult,
      memberActivityResult
    ] = await Promise.all([
      // Family insights
      supabase
        .from('v_family_dining_insights')
        .select('*')
        .eq('user_id', user.id)
        .gte('rating_date', startDate.split('T')[0])
        .lte('rating_date', endDate.split('T')[0]),

      // Popular restaurants
      supabase
        .from('v_popular_restaurants')
        .select('*')
        .eq('user_id', user.id)
        .gte('last_visit', startDate)
        .order('visit_frequency', { ascending: false })
        .limit(10),

      // Cuisine preferences
      supabase
        .from('v_cuisine_preferences')
        .select('*')
        .eq('user_id', user.id)
        .gte('last_rating_date', startDate)
        .order('rating_count', { ascending: false }),

      // Member activity
      supabase
        .from('v_member_activity')
        .select('*')
        .eq('user_id', user.id)
        .gte('most_recent_activity', startDate)
        .order('rating_count', { ascending: false })
    ]);

    // Check for errors
    if (familyInsightsResult.error) throw familyInsightsResult.error;
    if (popularRestaurantsResult.error) throw popularRestaurantsResult.error;
    if (cuisinePreferencesResult.error) throw cuisinePreferencesResult.error;
    if (memberActivityResult.error) throw memberActivityResult.error;

    // Process family insights
    const familyInsightsData = familyInsightsResult.data || [];
    const totalFamilyMembers = await supabase
      .from('family_members')
      .select('id')
      .eq('user_id', user.id);

    const familyInsights = familyInsightsData.length > 0 ? {
      total_restaurants: familyInsightsData.reduce((sum, day) => sum + day.unique_restaurants, 0),
      total_ratings: familyInsightsData.reduce((sum, day) => sum + day.total_ratings, 0),
      average_family_rating: familyInsightsData.length > 0 
        ? familyInsightsData.reduce((sum, day) => sum + day.average_rating, 0) / familyInsightsData.length 
        : 0,
      estimated_spending: familyInsightsData.reduce((sum, day) => sum + day.estimated_spending, 0),
      total_family_members: totalFamilyMembers.data?.length || 0,
      active_members: Math.max(...familyInsightsData.map(day => day.active_family_members), 0),
      period_start: startDate,
      period_end: endDate,
    } : null;

    // Process popular restaurants
    const popularRestaurants = (popularRestaurantsResult.data || []).map(restaurant => ({
      restaurant_id: restaurant.restaurant_id,
      restaurant_name: restaurant.restaurant_name,
      restaurant_address: restaurant.restaurant_address,
      cuisine_type: restaurant.cuisine_type,
      visit_frequency: restaurant.visit_frequency,
      average_rating: restaurant.average_rating,
      last_visit: restaurant.last_visit,
      total_ratings: restaurant.visit_frequency,
    }));

    // Process cuisine preferences
    const totalCuisineRatings = cuisinePreferencesResult.data?.reduce((sum, cuisine) => sum + cuisine.rating_count, 0) || 0;
    const cuisinePreferences = (cuisinePreferencesResult.data || []).map(cuisine => ({
      cuisine_type: cuisine.cuisine_type,
      rating_count: cuisine.rating_count,
      average_rating: cuisine.average_rating,
      percentage: totalCuisineRatings > 0 ? (cuisine.rating_count / totalCuisineRatings) * 100 : 0,
      trend: 'stable' as const,
    }));

    // Process member activity
    const memberActivity = (memberActivityResult.data || []).map(member => ({
      member_id: member.member_id,
      member_name: member.member_name,
      relationship: member.relationship,
      rating_count: member.rating_count,
      average_rating: member.average_rating,
      most_recent_activity: member.most_recent_activity,
      favorite_restaurant: member.favorite_restaurant,
      favorite_cuisine: member.favorite_cuisine,
      engagement_trend: 'stable' as const,
    }));

    return NextResponse.json({
      familyInsights,
      popularRestaurants,
      cuisinePreferences,
      memberActivity,
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
