import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// POST /api/reviews/vote - Vote on review helpfulness
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
    const { rating_id, is_helpful } = body;

    if (!rating_id || typeof is_helpful !== 'boolean') {
      return NextResponse.json(
        { error: 'rating_id and is_helpful are required' },
        { status: 400 }
      );
    }

    // Check if user is trying to vote on their own review
    const { data: rating } = await supabaseAdmin
      .from('ratings')
      .select('user_id')
      .eq('id', rating_id)
      .single();

    if (rating?.user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot vote on your own review' },
        { status: 400 }
      );
    }

    // Upsert the vote (insert or update if exists)
    const { data, error } = await supabaseAdmin
      .from('review_votes')
      .upsert({
        rating_id,
        user_id: user.id,
        is_helpful
      }, {
        onConflict: 'rating_id,user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to record vote' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/vote - Remove a vote
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const rating_id = searchParams.get('rating_id');

    if (!rating_id) {
      return NextResponse.json(
        { error: 'rating_id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('review_votes')
      .delete()
      .eq('rating_id', rating_id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to remove vote' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
