import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET /api/notifications/responses - Get user's response notifications
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

    // Get notifications with full details
    const { data: notifications, error } = await supabaseAdmin
      .from('response_notifications')
      .select(`
        *,
        ratings!inner (
          id,
          rating,
          review_text,
          menu_items!inner (
            name,
            restaurants!inner (
              name
            )
          )
        ),
        review_responses!inner (
          response_text,
          restaurant_owners!inner (
            business_name
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    // Count unread notifications
    const unread_count = notifications?.filter(n => !n.is_read).length || 0;

    return NextResponse.json({
      notifications: notifications || [],
      unread_count
    });

  } catch (error) {
    console.error('Error in get notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/responses - Mark notifications as read
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
    const { notification_ids } = body;

    if (!notification_ids || !Array.isArray(notification_ids)) {
      return NextResponse.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    // Mark notifications as read
    const { data, error } = await supabaseAdmin
      .from('response_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .in('id', notification_ids)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('Error marking notifications as read:', error);
      return NextResponse.json(
        { error: 'Failed to mark notifications as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Notifications marked as read',
      updated_count: data?.length || 0
    });

  } catch (error) {
    console.error('Error in mark notifications read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
