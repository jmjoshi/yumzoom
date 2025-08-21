import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// PUT /api/ratings/[id] - Update a rating
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const ratingId = params.id;
    const body = await request.json();
    const { rating, notes, review_text } = body;

    // Validate rating
    if (rating !== undefined && (rating < 1 || rating > 10)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 10' },
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

    // Check if rating exists and belongs to the user
    const { data: existingRating, error: fetchError } = await supabaseAdmin
      .from('ratings')
      .select('user_id, review_text')
      .eq('id', ratingId)
      .single();

    if (fetchError || !existingRating) {
      return NextResponse.json(
        { error: 'Rating not found' },
        { status: 404 }
      );
    }

    if (existingRating.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this rating' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (rating !== undefined) updateData.rating = rating;
    if (notes !== undefined) updateData.notes = notes;
    if (review_text !== undefined) {
      updateData.review_text = review_text;
      // Mark as edited if review text is being changed
      if (existingRating.review_text && existingRating.review_text !== review_text) {
        updateData.is_edited = true;
        updateData.edited_at = new Date().toISOString();
      }
    }

    // Update the rating
    const { data, error } = await supabaseAdmin
      .from('ratings')
      .update(updateData)
      .eq('id', ratingId)
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
        )
      `)
      .single();

    if (error) {
      console.error('Error updating rating:', error);
      return NextResponse.json(
        { error: 'Failed to update rating' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error updating rating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/ratings/[id] - Delete a rating
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const ratingId = params.id;

    // Check if rating exists and belongs to the user
    const { data: existingRating, error: fetchError } = await supabaseAdmin
      .from('ratings')
      .select('user_id')
      .eq('id', ratingId)
      .single();

    if (fetchError || !existingRating) {
      return NextResponse.json(
        { error: 'Rating not found' },
        { status: 404 }
      );
    }

    if (existingRating.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this rating' },
        { status: 403 }
      );
    }

    // Delete the rating (cascade will handle photos and votes)
    const { error } = await supabaseAdmin
      .from('ratings')
      .delete()
      .eq('id', ratingId);

    if (error) {
      console.error('Error deleting rating:', error);
      return NextResponse.json(
        { error: 'Failed to delete rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting rating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/ratings/[id] - Get a specific rating
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ratingId = params.id;

    const { data, error } = await supabaseAdmin
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
        )
      `)
      .eq('id', ratingId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Rating not found' },
        { status: 404 }
      );
    }

    // Get vote counts
    const { data: votes } = await supabaseAdmin
      .from('review_votes')
      .select('is_helpful')
      .eq('rating_id', ratingId);

    const helpfulCount = votes?.filter(v => v.is_helpful).length || 0;
    const notHelpfulCount = votes?.filter(v => !v.is_helpful).length || 0;

    const ratingWithVotes = {
      ...data,
      helpful_count: helpfulCount,
      not_helpful_count: notHelpfulCount,
      net_helpfulness: helpfulCount - notHelpfulCount
    };

    return NextResponse.json(ratingWithVotes);

  } catch (error) {
    console.error('Error fetching rating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
