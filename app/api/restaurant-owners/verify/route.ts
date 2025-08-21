import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

// POST /api/restaurant-owners/verify - Submit restaurant owner verification request
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
    const { restaurant_id, business_name, business_email, business_phone } = body;

    // Validate required fields
    if (!restaurant_id || !business_name || !business_email) {
      return NextResponse.json(
        { error: 'Restaurant ID, business name, and business email are required' },
        { status: 400 }
      );
    }

    // Check if user already has a verification request for this restaurant
    const { data: existingRequest } = await supabaseAdmin
      .from('restaurant_owners')
      .select('id, verification_status')
      .eq('user_id', user.id)
      .eq('restaurant_id', restaurant_id)
      .single();

    if (existingRequest) {
      if (existingRequest.verification_status === 'verified') {
        return NextResponse.json(
          { error: 'You are already verified for this restaurant' },
          { status: 400 }
        );
      } else if (existingRequest.verification_status === 'pending') {
        return NextResponse.json(
          { error: 'You already have a pending verification request for this restaurant' },
          { status: 400 }
        );
      }
    }

    // Create or update verification request
    const verificationData = {
      user_id: user.id,
      restaurant_id,
      business_name,
      business_email,
      business_phone: business_phone || null,
      verification_status: 'pending'
    };

    const { data, error } = existingRequest
      ? await supabaseAdmin
          .from('restaurant_owners')
          .update(verificationData)
          .eq('id', existingRequest.id)
          .select()
          .single()
      : await supabaseAdmin
          .from('restaurant_owners')
          .insert(verificationData)
          .select()
          .single();

    if (error) {
      console.error('Error creating verification request:', error);
      return NextResponse.json(
        { error: 'Failed to submit verification request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Verification request submitted successfully',
      request: data
    });

  } catch (error) {
    console.error('Error in verification request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/restaurant-owners/verify - Get user's restaurant owner status
export async function GET(request: NextRequest) {
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

    // Get user's restaurant owner status
    const { data, error } = await supabaseAdmin.rpc('get_user_restaurant_owner_status', {
      user_uuid: user.id
    });

    if (error) {
      console.error('Error fetching owner status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch owner status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      restaurants: data || []
    });

  } catch (error) {
    console.error('Error in get owner status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
