import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

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

    // Get restaurant with characteristics
    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .select(`
        *,
        restaurant_characteristics (*)
      `)
      .eq('id', restaurantId)
      .single();

    if (restaurantError) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Get user ratings for this restaurant
    const { data: userRatings, error: ratingsError } = await supabaseAdmin
      .from('user_restaurant_ratings')
      .select(`
        *,
        user_profiles!inner (
          first_name,
          last_name,
          avatar_url
        ),
        restaurant_rating_photos (*),
        restaurant_rating_votes (
          id,
          user_id,
          is_helpful
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (ratingsError) {
      console.error('Error fetching user ratings:', ratingsError);
    }

    // Calculate helpfulness for each rating
    const ratingsWithHelpfulness = userRatings?.map((rating: UserRating) => {
      const votes = rating.restaurant_rating_votes || [];
      const helpful_count = votes.filter((vote: RatingVote) => vote.is_helpful).length;
      const not_helpful_count = votes.filter((vote: RatingVote) => !vote.is_helpful).length;
      
      return {
        ...rating,
        helpful_count,
        not_helpful_count,
        net_helpfulness: helpful_count - not_helpful_count
      };
    }) || [];

    // Calculate rating distribution for characteristics
    const ratingDistribution = userRatings?.reduce((acc: Record<string, Record<string, number>>, rating: UserRating) => {
      const characteristics = [
        'ambience', 'decor', 'service', 'cleanliness', 
        'noise_level', 'value_for_money', 'food_quality', 'overall'
      ];
      
      characteristics.forEach(char => {
        const ratingValue = (rating as any)[`${char}_rating`];
        if (ratingValue) {
          if (!acc[char]) acc[char] = {};
          acc[char][ratingValue] = (acc[char][ratingValue] || 0) + 1;
        }
      });
      
      return acc;
    }, {} as Record<string, Record<string, number>>) || {};

    const response = {
      restaurant,
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
    
    // Check if user is authenticated
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For now, we'll use a simple auth check
    // In production, you'd validate the JWT token
    const userId = authHeader.replace('Bearer ', '');

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
      user_id: userId,
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
        { error: 'Failed to save rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({ rating });
  } catch (error) {
    console.error('Error creating restaurant rating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
