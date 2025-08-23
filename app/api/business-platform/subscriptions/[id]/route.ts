import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  BusinessPlatformResponse, 
  RestaurantSubscription,
  UpdateSubscriptionRequest 
} from '@/types/business-platform';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/business-platform/subscriptions/[id] - Get specific subscription
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscriptionId = params.id;

    const { data: subscription, error } = await supabase
      .from('restaurant_subscriptions')
      .select(`
        *,
        subscription_plan:subscription_plans(*)
      `)
      .eq('id', subscriptionId)
      .single();

    if (error || !subscription) {
      return NextResponse.json({
        success: false,
        error: { code: 'SUBSCRIPTION_NOT_FOUND', message: 'Subscription not found' }
      } as BusinessPlatformResponse<never>, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: subscription
    } as BusinessPlatformResponse<RestaurantSubscription>);

  } catch (error) {
    console.error('Error in subscription GET:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    } as BusinessPlatformResponse<never>, { status: 500 });
  }
}

// PUT /api/business-platform/subscriptions/[id] - Update subscription
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscriptionId = params.id;
    const body: UpdateSubscriptionRequest = await request.json();
    const { auto_renew, payment_method_id } = body;

    // Get existing subscription
    const { data: existingSubscription, error: fetchError } = await supabase
      .from('restaurant_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !existingSubscription) {
      return NextResponse.json({
        success: false,
        error: { code: 'SUBSCRIPTION_NOT_FOUND', message: 'Subscription not found' }
      } as BusinessPlatformResponse<never>, { status: 404 });
    }

    // Prepare update data
    const updateData: Partial<RestaurantSubscription> = {};
    
    if (auto_renew !== undefined) {
      updateData.auto_renew = auto_renew;
    }
    
    if (payment_method_id !== undefined) {
      updateData.payment_method_id = payment_method_id;
    }

    // Update the subscription
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('restaurant_subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .select(`
        *,
        subscription_plan:subscription_plans(*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json({
        success: false,
        error: { code: 'UPDATE_SUBSCRIPTION_ERROR', message: 'Failed to update subscription' }
      } as BusinessPlatformResponse<never>, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updatedSubscription
    } as BusinessPlatformResponse<RestaurantSubscription>);

  } catch (error) {
    console.error('Error in subscription PUT:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    } as BusinessPlatformResponse<never>, { status: 500 });
  }
}

// DELETE /api/business-platform/subscriptions/[id] - Cancel subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subscriptionId = params.id;

    // Get existing subscription
    const { data: existingSubscription, error: fetchError } = await supabase
      .from('restaurant_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !existingSubscription) {
      return NextResponse.json({
        success: false,
        error: { code: 'SUBSCRIPTION_NOT_FOUND', message: 'Subscription not found' }
      } as BusinessPlatformResponse<never>, { status: 404 });
    }

    if (existingSubscription.status === 'cancelled') {
      return NextResponse.json({
        success: false,
        error: { code: 'ALREADY_CANCELLED', message: 'Subscription is already cancelled' }
      } as BusinessPlatformResponse<never>, { status: 400 });
    }

    // Cancel the subscription
    const { data: cancelledSubscription, error: cancelError } = await supabase
      .from('restaurant_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        auto_renew: false
      })
      .eq('id', subscriptionId)
      .select(`
        *,
        subscription_plan:subscription_plans(*)
      `)
      .single();

    if (cancelError) {
      console.error('Error cancelling subscription:', cancelError);
      return NextResponse.json({
        success: false,
        error: { code: 'CANCEL_SUBSCRIPTION_ERROR', message: 'Failed to cancel subscription' }
      } as BusinessPlatformResponse<never>, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: cancelledSubscription
    } as BusinessPlatformResponse<RestaurantSubscription>);

  } catch (error) {
    console.error('Error in subscription DELETE:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    } as BusinessPlatformResponse<never>, { status: 500 });
  }
}
