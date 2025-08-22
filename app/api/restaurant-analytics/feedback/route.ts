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

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    // For now, we'll use a placeholder user ID - you should implement proper auth verification
    const userId = 'placeholder-user-id'; // This should be extracted from your auth system

    // Call the stored procedure to get customer feedback insights
    const { data, error } = await supabase
      .rpc('get_customer_feedback_insights', {
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

    // The function returns a single row with the insights data
    const insights = data && data.length > 0 ? data[0] : null;

    return NextResponse.json({
      success: true,
      data: insights
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
