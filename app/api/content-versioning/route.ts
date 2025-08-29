import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to get user from Authorization header
async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return user;
}

/**
 * GET /api/content-versioning/history
 * Get version history for a specific content item
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('contentType');
    const contentId = searchParams.get('contentId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: 'Missing required parameters: contentType, contentId' },
        { status: 400 }
      );
    }

    // Check if user is authenticated (admin check would be added here)
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get version history using the database function
    const { data: history, error } = await supabase
      .rpc('get_content_version_history', {
        p_content_type: contentType,
        p_content_id: contentId,
        p_limit: limit
      });

    if (error) {
      console.error('Error fetching version history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch version history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error in version history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/content-versioning/rollback
 * Rollback content to a specific version
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { versionId, reason } = body;

    if (!versionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: versionId' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Perform rollback using the database function
    const { data: success, error } = await supabase
      .rpc('rollback_content_to_version', {
        p_version_id: versionId,
        p_rollback_reason: reason || 'Manual rollback via API',
        p_rollback_by: user.id
      });

    if (error) {
      console.error('Error performing rollback:', error);
      return NextResponse.json(
        { error: 'Failed to rollback content' },
        { status: 500 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Rollback failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Content successfully rolled back',
      success: true
    });
  } catch (error) {
    console.error('Error in rollback API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
