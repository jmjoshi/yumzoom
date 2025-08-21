import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

// POST /api/restaurant-owners/responses - Create a response to a review
export async function POST(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const body = await request.json();
    const { rating_id, response_text } = body;

    // Validate required fields
    if (!rating_id || !response_text) {
      return NextResponse.json(
        { error: 'Rating ID and response text are required' },
        { status: 400 }
      );
    }

    if (response_text.length > 1000) {
      return NextResponse.json(
        { error: 'Response text cannot exceed 1000 characters' },
        { status: 400 }
      );
    }

    // Check if user is a verified owner for the restaurant of this review
    const { data: ownerCheck, error: ownerError } = await supabaseAdmin
      .from('restaurant_owners')
      .select(`
        id,
        verification_status,
        restaurant_id,
        restaurants!inner (
          menu_items!inner (
            ratings!inner (
              id
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('verification_status', 'verified')
      .eq('restaurants.menu_items.ratings.id', rating_id)
      .single();

    if (ownerError || !ownerCheck) {
      return NextResponse.json(
        { error: 'You are not authorized to respond to this review' },
        { status: 403 }
      );
    }

    // Check if a response already exists
    const { data: existingResponse } = await supabaseAdmin
      .from('review_responses')
      .select('id')
      .eq('rating_id', rating_id)
      .single();

    if (existingResponse) {
      return NextResponse.json(
        { error: 'A response already exists for this review' },
        { status: 400 }
      );
    }

    // Create the response
    const { data, error } = await supabaseAdmin
      .from('review_responses')
      .insert({
        rating_id,
        restaurant_owner_id: ownerCheck.id,
        response_text
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating response:', error);
      return NextResponse.json(
        { error: 'Failed to create response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Response created successfully',
      response: data
    });

  } catch (error) {
    console.error('Error in create response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/restaurant-owners/responses - Update a response
export async function PUT(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const body = await request.json();
    const { response_id, response_text } = body;

    // Validate required fields
    if (!response_id || !response_text) {
      return NextResponse.json(
        { error: 'Response ID and response text are required' },
        { status: 400 }
      );
    }

    if (response_text.length > 1000) {
      return NextResponse.json(
        { error: 'Response text cannot exceed 1000 characters' },
        { status: 400 }
      );
    }

    // Check if user owns this response
    const { data: responseCheck, error: responseError } = await supabaseAdmin
      .from('review_responses')
      .select(`
        id,
        restaurant_owners!inner (
          user_id
        )
      `)
      .eq('id', response_id)
      .eq('restaurant_owners.user_id', user.id)
      .single();

    if (responseError || !responseCheck) {
      return NextResponse.json(
        { error: 'You are not authorized to update this response' },
        { status: 403 }
      );
    }

    // Update the response
    const { data, error } = await supabaseAdmin
      .from('review_responses')
      .update({
        response_text,
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', response_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating response:', error);
      return NextResponse.json(
        { error: 'Failed to update response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Response updated successfully',
      response: data
    });

  } catch (error) {
    console.error('Error in update response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/restaurant-owners/responses - Delete a response
export async function DELETE(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const response_id = searchParams.get('response_id');

    if (!response_id) {
      return NextResponse.json(
        { error: 'Response ID is required' },
        { status: 400 }
      );
    }

    // Check if user owns this response
    const { data: responseCheck, error: responseError } = await supabaseAdmin
      .from('review_responses')
      .select(`
        id,
        restaurant_owners!inner (
          user_id
        )
      `)
      .eq('id', response_id)
      .eq('restaurant_owners.user_id', user.id)
      .single();

    if (responseError || !responseCheck) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this response' },
        { status: 403 }
      );
    }

    // Delete the response
    const { error } = await supabaseAdmin
      .from('review_responses')
      .delete()
      .eq('id', response_id);

    if (error) {
      console.error('Error deleting response:', error);
      return NextResponse.json(
        { error: 'Failed to delete response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Response deleted successfully'
    });

  } catch (error) {
    console.error('Error in delete response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
