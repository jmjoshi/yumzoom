import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/reviews/stats/[id] - Get review statistics for a restaurant or menu item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'restaurant' or 'menu_item'
    const id = params.id;

    if (!type || !['restaurant', 'menu_item'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be "restaurant" or "menu_item"' },
        { status: 400 }
      );
    }

    let result;
    
    if (type === 'restaurant') {
      result = await supabaseAdmin.rpc('get_restaurant_review_stats', {
        restaurant_uuid: id
      });
    } else {
      result = await supabaseAdmin.rpc('get_menu_item_review_stats', {
        menu_item_uuid: id
      });
    }

    if (result.error) {
      console.error('Database error:', result.error);
      return NextResponse.json(
        { error: 'Failed to fetch review statistics' },
        { status: 500 }
      );
    }

    const stats = result.data?.[0] || {
      total_reviews: 0,
      average_rating: 0,
      reviews_with_photos: 0,
      reviews_with_text: 0,
      rating_distribution: {}
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching review stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
