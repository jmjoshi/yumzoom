import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const restaurantId = searchParams.get('restaurantId');
    const timePeriod = searchParams.get('timePeriod') || 'month';

    // Get the current user from request headers (you'll need to implement auth verification)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For now, we'll use a placeholder user ID - you should implement proper auth verification
    const userId = 'placeholder-user-id'; // This should be extracted from your auth system

    // Call the stored procedure to get restaurant performance data
    const { data, error } = await supabase
      .rpc('get_restaurant_performance_dashboard', {
        owner_user_id: userId,
        target_restaurant_id: restaurantId,
        time_period: timePeriod
      });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user from request headers (you'll need to implement auth verification)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For now, we'll use a placeholder user ID - you should implement proper auth verification
    const userId = 'placeholder-user-id'; // This should be extracted from your auth system

    const body = await request.json();
    const { action, restaurantId, timePeriod } = body;

    if (action === 'refresh') {
      // Trigger analytics refresh by updating the analytics tables
      const { error: refreshError } = await supabase
        .rpc('update_restaurant_analytics_daily');

      if (refreshError) {
        console.error('Analytics refresh error:', refreshError);
        return NextResponse.json(
          { success: false, error: refreshError.message },
          { status: 500 }
        );
      }

      // Get updated data
      const { data, error } = await supabase
        .rpc('get_restaurant_performance_dashboard', {
          owner_user_id: userId,
          target_restaurant_id: restaurantId,
          time_period: timePeriod || 'month'
        });

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: data || [],
        message: 'Analytics refreshed successfully'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
