import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/feature-flags - Get all feature flags
export async function GET(request: NextRequest) {
  try {
    const { data: featureFlags, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('category', { ascending: true })
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Error fetching feature flags:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feature flags' },
        { status: 500 }
      );
    }

    return NextResponse.json({ featureFlags });
  } catch (error) {
    console.error('Error in feature flags API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/feature-flags - Create a new feature flag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      display_name,
      description,
      category = 'general',
      is_enabled = false,
      rollout_percentage = 100
    } = body;

    if (!name || !display_name) {
      return NextResponse.json(
        { error: 'Name and display name are required' },
        { status: 400 }
      );
    }

    // Get the current user (assuming we have auth context)
    const authHeader = request.headers.get('authorization');
    let userId = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Use the database function to create the feature flag
    const { data, error } = await supabase.rpc('create_feature_flag', {
      p_name: name,
      p_display_name: display_name,
      p_description: description,
      p_category: category,
      p_is_enabled: is_enabled,
      p_rollout_percentage: rollout_percentage,
      p_created_by: userId
    });

    if (error) {
      console.error('Error creating feature flag:', error);
      return NextResponse.json(
        { error: 'Failed to create feature flag' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, featureFlagId: data });
  } catch (error) {
    console.error('Error in feature flags POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
