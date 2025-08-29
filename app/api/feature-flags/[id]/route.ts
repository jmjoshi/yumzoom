import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/feature-flags/[id] - Get a specific feature flag
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: featureFlag, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching feature flag:', error);
      return NextResponse.json(
        { error: 'Feature flag not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ featureFlag });
  } catch (error) {
    console.error('Error in feature flag GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/feature-flags/[id] - Update a feature flag
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      display_name,
      description,
      category,
      is_enabled,
      rollout_percentage,
      reason
    } = body;

    // Get the current user
    const authHeader = request.headers.get('authorization');
    let userId = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Use the database function to update the feature flag
    const { data, error } = await supabase.rpc('update_feature_flag', {
      p_feature_id: params.id,
      p_name: name,
      p_display_name: display_name,
      p_description: description,
      p_category: category,
      p_is_enabled: is_enabled,
      p_rollout_percentage: rollout_percentage,
      p_updated_by: userId,
      p_reason: reason
    });

    if (error) {
      console.error('Error updating feature flag:', error);
      return NextResponse.json(
        { error: 'Failed to update feature flag' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in feature flag PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/feature-flags/[id] - Delete a feature flag
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('feature_flags')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting feature flag:', error);
      return NextResponse.json(
        { error: 'Failed to delete feature flag' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in feature flag DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
