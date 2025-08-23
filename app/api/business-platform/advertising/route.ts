import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  BusinessPlatformResponse, 
  AdCampaign,
  CreateAdCampaignRequest,
  PaginationParams 
} from '@/types/business-platform';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/business-platform/advertising - Get ad campaigns for restaurant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: { code: 'MISSING_RESTAURANT_ID', message: 'Restaurant ID is required' }
      } as BusinessPlatformResponse<never>, { status: 400 });
    }

    // Check if restaurant has advertising feature access
    const { data: hasAccess } = await supabase
      .rpc('check_subscription_feature_access', {
        p_restaurant_id: restaurantId,
        p_feature_name: 'ad_campaigns'
      });

    if (!hasAccess) {
      return NextResponse.json({
        success: false,
        error: { code: 'FEATURE_NOT_AVAILABLE', message: 'Advertising feature not available in current subscription plan' }
      } as BusinessPlatformResponse<never>, { status: 403 });
    }

    // Build query
    let query = supabase
      .from('ad_campaigns')
      .select('*', { count: 'exact' })
      .eq('restaurant_id', restaurantId);

    if (status) {
      query = query.eq('status', status);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: campaigns, error, count } = await query;

    if (error) {
      console.error('Error fetching ad campaigns:', error);
      return NextResponse.json({
        success: false,
        error: { code: 'FETCH_CAMPAIGNS_ERROR', message: 'Failed to fetch ad campaigns' }
      } as BusinessPlatformResponse<never>, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: campaigns,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    } as BusinessPlatformResponse<AdCampaign[]>);

  } catch (error) {
    console.error('Error in advertising GET:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    } as BusinessPlatformResponse<never>, { status: 500 });
  }
}

// POST /api/business-platform/advertising - Create new ad campaign
export async function POST(request: NextRequest) {
  try {
    const body: CreateAdCampaignRequest = await request.json();
    const {
      restaurant_id,
      name,
      description,
      campaign_type,
      budget_type,
      budget_amount,
      start_date,
      end_date,
      targeting_criteria,
      creative_assets,
      performance_goals
    } = body;

    // Validate required fields
    if (!restaurant_id || !name || !campaign_type || !budget_type || !budget_amount || !start_date) {
      return NextResponse.json({
        success: false,
        error: { code: 'MISSING_REQUIRED_FIELDS', message: 'Missing required fields for ad campaign' }
      } as BusinessPlatformResponse<never>, { status: 400 });
    }

    // Check if restaurant has advertising feature access
    const { data: hasAccess } = await supabase
      .rpc('check_subscription_feature_access', {
        p_restaurant_id: restaurant_id,
        p_feature_name: 'ad_campaigns'
      });

    if (!hasAccess) {
      return NextResponse.json({
        success: false,
        error: { code: 'FEATURE_NOT_AVAILABLE', message: 'Advertising feature not available in current subscription plan' }
      } as BusinessPlatformResponse<never>, { status: 403 });
    }

    // Check budget limits based on subscription
    const { data: withinBudgetLimit } = await supabase
      .rpc('check_subscription_usage_limit', {
        p_restaurant_id: restaurant_id,
        p_feature_name: 'monthly_ad_budget',
        p_period: 'monthly'
      });

    if (!withinBudgetLimit) {
      return NextResponse.json({
        success: false,
        error: { code: 'BUDGET_LIMIT_EXCEEDED', message: 'Monthly advertising budget limit exceeded' }
      } as BusinessPlatformResponse<never>, { status: 403 });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = end_date ? new Date(end_date) : null;
    
    if (startDate < new Date()) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_START_DATE', message: 'Start date cannot be in the past' }
      } as BusinessPlatformResponse<never>, { status: 400 });
    }

    if (endDate && endDate <= startDate) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_END_DATE', message: 'End date must be after start date' }
      } as BusinessPlatformResponse<never>, { status: 400 });
    }

    // Create the campaign
    const campaignData = {
      restaurant_id,
      name,
      description,
      campaign_type,
      status: 'draft' as const,
      budget_type,
      budget_amount,
      spent_amount: 0,
      start_date: startDate.toISOString(),
      end_date: endDate?.toISOString(),
      targeting_criteria: targeting_criteria || {},
      creative_assets: creative_assets || {},
      performance_goals: performance_goals || {}
    };

    const { data: newCampaign, error: campaignError } = await supabase
      .from('ad_campaigns')
      .insert(campaignData)
      .select('*')
      .single();

    if (campaignError) {
      console.error('Error creating ad campaign:', campaignError);
      return NextResponse.json({
        success: false,
        error: { code: 'CREATE_CAMPAIGN_ERROR', message: 'Failed to create ad campaign' }
      } as BusinessPlatformResponse<never>, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: newCampaign
    } as BusinessPlatformResponse<AdCampaign>, { status: 201 });

  } catch (error) {
    console.error('Error in advertising POST:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    } as BusinessPlatformResponse<never>, { status: 500 });
  }
}
