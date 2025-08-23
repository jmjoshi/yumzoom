import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  BusinessPlatformResponse, 
  SubscriptionPlan, 
  RestaurantSubscription,
  CreateSubscriptionRequest,
  PaginationParams 
} from '@/types/business-platform';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/business-platform/subscriptions - Get subscription plans and restaurant subscriptions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id');
    const plansOnly = searchParams.get('plans_only') === 'true';
    
    if (plansOnly) {
      // Get available subscription plans
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching subscription plans:', error);
        return NextResponse.json({
          success: false,
          error: { code: 'FETCH_PLANS_ERROR', message: 'Failed to fetch subscription plans' }
        } as BusinessPlatformResponse<never>, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: plans
      } as BusinessPlatformResponse<SubscriptionPlan[]>);
    }

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: { code: 'MISSING_RESTAURANT_ID', message: 'Restaurant ID is required' }
      } as BusinessPlatformResponse<never>, { status: 400 });
    }

    // Get restaurant subscriptions with plan details
    const { data: subscriptions, error } = await supabase
      .from('restaurant_subscriptions')
      .select(`
        *,
        subscription_plan:subscription_plans(*)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching restaurant subscriptions:', error);
      return NextResponse.json({
        success: false,
        error: { code: 'FETCH_SUBSCRIPTIONS_ERROR', message: 'Failed to fetch restaurant subscriptions' }
      } as BusinessPlatformResponse<never>, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: subscriptions
    } as BusinessPlatformResponse<RestaurantSubscription[]>);

  } catch (error) {
    console.error('Error in subscriptions GET:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    } as BusinessPlatformResponse<never>, { status: 500 });
  }
}

// POST /api/business-platform/subscriptions - Create new subscription
export async function POST(request: NextRequest) {
  try {
    const body: CreateSubscriptionRequest = await request.json();
    const { restaurant_id, subscription_plan_id, billing_cycle, payment_method_id, auto_renew = true } = body;

    // Validate required fields
    if (!restaurant_id || !subscription_plan_id || !billing_cycle) {
      return NextResponse.json({
        success: false,
        error: { code: 'MISSING_REQUIRED_FIELDS', message: 'Restaurant ID, subscription plan ID, and billing cycle are required' }
      } as BusinessPlatformResponse<never>, { status: 400 });
    }

    // Get the subscription plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', subscription_plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_PLAN', message: 'Invalid subscription plan' }
      } as BusinessPlatformResponse<never>, { status: 400 });
    }

    // Check if restaurant already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('restaurant_subscriptions')
      .select('id, status')
      .eq('restaurant_id', restaurant_id)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      return NextResponse.json({
        success: false,
        error: { code: 'ACTIVE_SUBSCRIPTION_EXISTS', message: 'Restaurant already has an active subscription' }
      } as BusinessPlatformResponse<never>, { status: 400 });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const expiresAt = new Date();
    
    if (billing_cycle === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (billing_cycle === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    // Create the subscription
    const subscriptionData = {
      restaurant_id,
      subscription_plan_id,
      status: 'active' as const,
      started_at: startDate.toISOString(),
      expires_at: expiresAt.toISOString(),
      auto_renew,
      payment_method_id,
      billing_cycle
    };

    const { data: newSubscription, error: subscriptionError } = await supabase
      .from('restaurant_subscriptions')
      .insert(subscriptionData)
      .select(`
        *,
        subscription_plan:subscription_plans(*)
      `)
      .single();

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      return NextResponse.json({
        success: false,
        error: { code: 'CREATE_SUBSCRIPTION_ERROR', message: 'Failed to create subscription' }
      } as BusinessPlatformResponse<never>, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: newSubscription
    } as BusinessPlatformResponse<RestaurantSubscription>, { status: 201 });

  } catch (error) {
    console.error('Error in subscriptions POST:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    } as BusinessPlatformResponse<never>, { status: 500 });
  }
}
