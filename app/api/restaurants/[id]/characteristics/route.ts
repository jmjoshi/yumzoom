import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import type { UserRestaurantRating } from '@/types/restaurant';

interface RatingVote {
  id: string;
  user_id: string;
  is_helpful: boolean;
}

interface UserRating {
  id: string;
  user_id: string;
  restaurant_id: string;
  ambience_rating: number;
  decor_rating: number;
  service_rating: number;
  cleanliness_rating: number;
  noise_level_rating: number;
  value_for_money_rating: number;
  food_quality_rating: number;
  overall_rating: number;
  review_text?: string;
  visit_date?: string;
  would_recommend?: boolean;
  created_at: string;
  updated_at: string;
  user_profiles: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  restaurant_rating_photos: any[];
  restaurant_rating_votes: RatingVote[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const restaurantId = params.id;

    // Get restaurant basic info
    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (restaurantError) {
      console.error('Restaurant not found:', restaurantError);
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Get user ratings for this restaurant
    const { data: userRatings, error: ratingsError } = await supabaseAdmin
      .from('user_restaurant_ratings')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (ratingsError) {
      console.error('Error fetching user ratings:', ratingsError);
    }

    // Calculate average characteristics from user ratings
    let characteristics = null;
    if (userRatings && userRatings.length > 0) {
      const totals = userRatings.reduce((acc: {
        ambience_rating: number;
        decor_rating: number;
        service_rating: number;
        cleanliness_rating: number;
        noise_level_rating: number;
        value_for_money_rating: number;
        food_quality_rating: number;
        overall_rating: number;
      }, rating: UserRestaurantRating) => {
        acc.ambience_rating += rating.ambience_rating || 0;
        acc.decor_rating += rating.decor_rating || 0;
        acc.service_rating += rating.service_rating || 0;
        acc.cleanliness_rating += rating.cleanliness_rating || 0;
        acc.noise_level_rating += rating.noise_level_rating || 0;
        acc.value_for_money_rating += rating.value_for_money_rating || 0;
        acc.food_quality_rating += rating.food_quality_rating || 0;
        acc.overall_rating += rating.overall_rating || 0;
        return acc;
      }, {
        ambience_rating: 0,
        decor_rating: 0,
        service_rating: 0,
        cleanliness_rating: 0,
        noise_level_rating: 0,
        value_for_money_rating: 0,
        food_quality_rating: 0,
        overall_rating: 0
      });

      const count = userRatings.length;
      characteristics = {
        restaurant_id: restaurantId,
        ambience_rating: Math.round((totals.ambience_rating / count) * 10) / 10,
        decor_rating: Math.round((totals.decor_rating / count) * 10) / 10,
        service_rating: Math.round((totals.service_rating / count) * 10) / 10,
        cleanliness_rating: Math.round((totals.cleanliness_rating / count) * 10) / 10,
        noise_level_rating: Math.round((totals.noise_level_rating / count) * 10) / 10,
        value_for_money_rating: Math.round((totals.value_for_money_rating / count) * 10) / 10,
        food_quality_rating: Math.round((totals.food_quality_rating / count) * 10) / 10,
        overall_rating: Math.round((totals.overall_rating / count) * 10) / 10,
        total_ratings_count: count
      };
    }

    // Add characteristics to restaurant object
    const restaurantWithCharacteristics = {
      ...restaurant,
      characteristics
    };

    // Calculate helpfulness for each rating (simplified without user profiles for now)
    const ratingsWithHelpfulness = userRatings?.map((rating: any) => {
      return {
        ...rating,
        helpful_count: 0, // TODO: Implement helpfulness voting
        not_helpful_count: 0,
        net_helpfulness: 0
      };
    }) || [];

    // Calculate rating distribution for characteristics
    const ratingDistribution = userRatings?.reduce((acc: Record<string, Record<string, number>>, rating: any) => {
      const characteristics = [
        'ambience', 'decor', 'service', 'cleanliness', 
        'noise_level', 'value_for_money', 'food_quality', 'overall'
      ];
      
      characteristics.forEach(char => {
        const ratingValue = rating[`${char}_rating`];
        if (ratingValue) {
          if (!acc[char]) acc[char] = {};
          acc[char][ratingValue] = (acc[char][ratingValue] || 0) + 1;
        }
      });
      
      return acc;
    }, {} as Record<string, Record<string, number>>) || {};

    const response = {
      restaurant: restaurantWithCharacteristics,
      user_ratings: ratingsWithHelpfulness,
      rating_distribution: ratingDistribution,
      total_ratings: userRatings?.length || 0
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching restaurant characteristics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const restaurantId = params.id;
    
    // Get authentication from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate rating data
    const requiredFields = [
      'ambience_rating', 'decor_rating', 'service_rating', 'cleanliness_rating',
      'noise_level_rating', 'value_for_money_rating', 'food_quality_rating', 'overall_rating'
    ];
    
    for (const field of requiredFields) {
      const value = body[field];
      if (!value || value < 1 || value > 10) {
        return NextResponse.json(
          { error: `Invalid ${field}: must be between 1 and 10` },
          { status: 400 }
        );
      }
    }

    // Insert or update user restaurant rating
    const ratingData = {
      user_id: user.id,
      restaurant_id: restaurantId,
      ambience_rating: body.ambience_rating,
      decor_rating: body.decor_rating,
      service_rating: body.service_rating,
      cleanliness_rating: body.cleanliness_rating,
      noise_level_rating: body.noise_level_rating,
      value_for_money_rating: body.value_for_money_rating,
      food_quality_rating: body.food_quality_rating,
      overall_rating: body.overall_rating,
      review_text: body.review_text || null,
      visit_date: body.visit_date || null,
      would_recommend: body.would_recommend !== undefined ? body.would_recommend : true
    };

    const { data: rating, error: ratingError } = await supabaseAdmin
      .from('user_restaurant_ratings')
      .upsert(ratingData, {
        onConflict: 'user_id,restaurant_id'
      })
      .select()
      .single();

    if (ratingError) {
      console.error('Error saving rating:', ratingError);
      return NextResponse.json(
        { error: 'Failed to save rating: ' + ratingError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ rating, message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Error creating restaurant rating:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
