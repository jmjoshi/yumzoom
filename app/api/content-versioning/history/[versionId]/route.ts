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
 * GET /api/content-versioning/history/[versionId]
 * Get detailed changes for a specific version
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { versionId: string } }
) {
  try {
    const versionId = params.versionId;

    if (!versionId) {
      return NextResponse.json(
        { error: 'Version ID is required' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get version details
    const { data: version, error: versionError } = await supabase
      .from('content_versions')
      .select(`
        *,
        user_profiles!content_versions_changed_by_fkey (
          first_name,
          last_name
        )
      `)
      .eq('id', versionId)
      .single();

    if (versionError || !version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // Get detailed changes for this version
    const { data: changes, error: changesError } = await supabase
      .from('content_changes')
      .select('*')
      .eq('version_id', versionId)
      .order('created_at', { ascending: true });

    if (changesError) {
      console.error('Error fetching changes:', changesError);
      return NextResponse.json(
        { error: 'Failed to fetch version changes' },
        { status: 500 }
      );
    }

    // Get version metadata
    const { data: metadata, error: metadataError } = await supabase
      .from('content_version_metadata')
      .select('*')
      .eq('version_id', versionId);

    if (metadataError) {
      console.error('Error fetching metadata:', metadataError);
    }

    return NextResponse.json({
      version: {
        ...version,
        changed_by_name: version.user_profiles
          ? `${version.user_profiles.first_name} ${version.user_profiles.last_name}`
          : 'System'
      },
      changes: changes || [],
      metadata: metadata || []
    });
  } catch (error) {
    console.error('Error in version details API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
