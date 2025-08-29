import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/feature-flags/check?feature=feature_name - Check if a feature is enabled
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featureName = searchParams.get('feature');
    const userId = searchParams.get('userId');

    if (!featureName) {
      return NextResponse.json(
        { error: 'Feature name is required' },
        { status: 400 }
      );
    }

    // Use the database function to check if feature is enabled
    const { data: isEnabled, error } = await supabase.rpc('is_feature_enabled', {
      p_feature_name: featureName,
      p_user_id: userId || null
    });

    if (error) {
      console.error('Error checking feature flag:', error);
      return NextResponse.json(
        { error: 'Failed to check feature flag' },
        { status: 500 }
      );
    }

    // Track feature usage if enabled
    if (isEnabled && userId) {
      await supabase.rpc('track_feature_usage', {
        p_feature_name: featureName,
        p_user_id: userId,
        p_action: 'checked',
        p_metadata: { source: 'api_check' }
      });
    }

    return NextResponse.json({ enabled: isEnabled });
  } catch (error) {
    console.error('Error in feature flag check API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/feature-flags/check - Check multiple features at once
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { features, userId } = body;

    if (!Array.isArray(features)) {
      return NextResponse.json(
        { error: 'Features must be an array' },
        { status: 400 }
      );
    }

    const results: { [key: string]: boolean } = {};

    // Check each feature
    for (const featureName of features) {
      const { data: isEnabled, error } = await supabase.rpc('is_feature_enabled', {
        p_feature_name: featureName,
        p_user_id: userId || null
      });

      if (error) {
        console.error(`Error checking feature ${featureName}:`, error);
        results[featureName] = false;
      } else {
        results[featureName] = isEnabled;

        // Track usage if enabled
        if (isEnabled && userId) {
          await supabase.rpc('track_feature_usage', {
            p_feature_name: featureName,
            p_user_id: userId,
            p_action: 'checked',
            p_metadata: { source: 'bulk_check' }
          });
        }
      }
    }

    return NextResponse.json({ features: results });
  } catch (error) {
    console.error('Error in bulk feature flag check API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
