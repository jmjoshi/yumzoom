import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateApiRequest, logApiUsage } from '../middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// GET /api/v1/restaurants - Public API to get restaurants
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let applicationId: string | null = null;

  try {
    // Authenticate API request
    const authResult = await authenticateApiRequest(request);
    if (authResult.error) {
      return NextResponse.json({
        success: false,
        error: authResult.error
      } as ApiResponse<never>, { status: authResult.status });
    }

    applicationId = authResult.application!.id;

    // Check if application has required scope
    if (!authResult.application!.scopes.includes('read:restaurants')) {
      await logApiUsage(applicationId!, request, 403, Date.now() - startTime, 'Insufficient scope');
      return NextResponse.json({
        success: false,
        error: { code: 'INSUFFICIENT_SCOPE', message: 'Application does not have read:restaurants scope' }
      } as ApiResponse<never>, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100); // Max 100 per request
    const search = searchParams.get('search');
    const cuisine = searchParams.get('cuisine');
    const sortBy = searchParams.get('sort_by') || 'name';
    const sortOrder = searchParams.get('sort_order') || 'asc';

    // Build query
    let query = supabase
      .from('restaurants')
      .select('id, name, description, address, phone, website, cuisine_type, image_url, created_at', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%`);
    }

    if (cuisine) {
      query = query.eq('cuisine_type', cuisine);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: restaurants, error, count } = await query;

    if (error) {
      console.error('Error fetching restaurants:', error);
      await logApiUsage(applicationId!, request, 500, Date.now() - startTime, error.message);
      return NextResponse.json({
        success: false,
        error: { code: 'FETCH_RESTAURANTS_ERROR', message: 'Failed to fetch restaurants' }
      } as ApiResponse<never>, { status: 500 });
    }

    await logApiUsage(applicationId!, request, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: restaurants,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    } as ApiResponse<any[]>);

  } catch (error) {
    console.error('Error in restaurants API GET:', error);
    if (applicationId) {
      await logApiUsage(applicationId!, request, 500, Date.now() - startTime, 'Internal server error');
    }
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    } as ApiResponse<never>, { status: 500 });
  }
}
