import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      restaurantId,
      reportType = 'accessibility_issue',
      category,
      title,
      description,
      severity = 'medium',
      locationDetails,
      suggestedSolution,
      photos = [],
      contactInfo
    } = body;

    if (!restaurantId || !category || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: restaurantId, category, title, description' },
        { status: 400 }
      );
    }

    // Get current user (if authenticated)
    const authHeader = request.headers.get('authorization');
    let reporterId = null;
    if (authHeader) {
      // In a real implementation, decode JWT token to get user ID
    }

    const reportData = {
      restaurant_id: restaurantId,
      reporter_id: reporterId,
      report_type: reportType,
      category,
      title,
      description,
      severity,
      location_details: locationDetails,
      suggested_solution: suggestedSolution,
      photos: JSON.stringify(photos),
      contact_info: contactInfo ? JSON.stringify(contactInfo) : null,
      status: 'open',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('accessibility_reports')
      .insert(reportData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Accessibility report submitted successfully',
    });

  } catch (error) {
    console.error('Error creating accessibility report:', error);
    return NextResponse.json(
      { error: 'Failed to submit accessibility report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status') || 'open';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('accessibility_reports')
      .select(`
        *,
        restaurant:restaurants(name, address)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });

  } catch (error) {
    console.error('Error fetching accessibility reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessibility reports' },
      { status: 500 }
    );
  }
}
