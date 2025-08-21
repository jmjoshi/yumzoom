import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// POST /api/ratings - Create a new rating with enhanced review features
export async function POST(request: NextRequest) {
  try {
    // Get user from auth header or session
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      menu_item_id, 
      rating, 
      family_member_id, 
      notes, 
      review_text, 
      photos 
    } = body;

    // Validate required fields
    if (!menu_item_id || !rating || rating < 1 || rating > 10) {
      return NextResponse.json(
        { error: 'menu_item_id and rating (1-10) are required' },
        { status: 400 }
      );
    }

    // Validate review text length
    if (review_text && review_text.length > 500) {
      return NextResponse.json(
        { error: 'Review text cannot exceed 500 characters' },
        { status: 400 }
      );
    }

    // Create the rating
    const { data: ratingData, error: ratingError } = await supabaseAdmin
      .from('ratings')
      .insert({
        user_id: user.id,
        menu_item_id,
        rating,
        family_member_id: family_member_id || null,
        notes: notes || null,
        review_text: review_text || null
      })
      .select()
      .single();

    if (ratingError) {
      console.error('Error creating rating:', ratingError);
      return NextResponse.json(
        { error: 'Failed to create rating' },
        { status: 500 }
      );
    }

    // Handle photo uploads if provided
    let photoData = [];
    if (photos && photos.length > 0) {
      // Note: In a real implementation, you would upload photos to cloud storage first
      // This is a placeholder for the photo upload process
      for (let i = 0; i < Math.min(photos.length, 3); i++) {
        const photo = photos[i];
        // Placeholder: In reality, upload to cloud storage and get URL
        const photoUrl = `https://placeholder.com/photos/${ratingData.id}_${i}`;
        
        const { data: photoRecord, error: photoError } = await supabaseAdmin
          .from('review_photos')
          .insert({
            rating_id: ratingData.id,
            photo_url: photoUrl,
            photo_filename: photo.name || `photo_${i + 1}`,
            photo_size: photo.size || null,
            upload_order: i + 1
          })
          .select()
          .single();

        if (!photoError) {
          photoData.push(photoRecord);
        }
      }
    }

    // Return the created rating with photos
    return NextResponse.json({
      ...ratingData,
      photos: photoData
    });

  } catch (error) {
    console.error('Error creating rating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/ratings - Get ratings with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const menuItemId = searchParams.get('menu_item_id');
    const restaurantId = searchParams.get('restaurant_id');
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build the select query
    const selectFields = `
      *,
      family_members (
        id,
        name,
        relationship
      ),
      review_photos (
        id,
        photo_url,
        photo_filename,
        photo_size,
        upload_order
      )
    `;

    let query = supabaseAdmin
      .from('ratings')
      .select(selectFields)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (menuItemId) {
      query = query.eq('menu_item_id', menuItemId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    let data, error;

    if (restaurantId) {
      // For restaurant filter, we need to join with menu_items
      const { data: restaurantData, error: restaurantError } = await supabaseAdmin
        .from('ratings')
        .select(`
          *,
          family_members (
            id,
            name,
            relationship
          ),
          review_photos (
            id,
            photo_url,
            photo_filename,
            photo_size,
            upload_order
          ),
          menu_items!inner (
            id,
            restaurant_id,
            name
          )
        `)
        .eq('menu_items.restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      data = restaurantData;
      error = restaurantError;
    } else {
      const result = await query;
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error fetching ratings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ratings' },
        { status: 500 }
      );
    }

    // Fetch vote counts separately for each rating
    const ratingsWithVotes = await Promise.all(
      (data || []).map(async (rating: any) => {
        const { data: votes } = await supabaseAdmin
          .from('review_votes')
          .select('is_helpful')
          .eq('rating_id', rating.id);

        const helpfulCount = votes?.filter(v => v.is_helpful).length || 0;
        const notHelpfulCount = votes?.filter(v => !v.is_helpful).length || 0;

        return {
          ...rating,
          helpful_count: helpfulCount,
          not_helpful_count: notHelpfulCount,
          net_helpfulness: helpfulCount - notHelpfulCount
        };
      })
    );

    return NextResponse.json(ratingsWithVotes);

  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
