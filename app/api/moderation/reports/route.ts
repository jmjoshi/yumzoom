import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { moderationService } from '@/lib/contentModeration';

export const runtime = 'edge';

// Initialize Supabase client
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
 * GET /api/moderation/reports
 * Get content reports for admin review
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const contentType = searchParams.get('content_type');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Check if user is authenticated
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check when role system is implemented
    // For now, allow all authenticated users to access (temporary for demo)

    const reports = await moderationService.getContentReports(
      status || undefined,
      contentType || undefined,
      limit
    );

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/moderation/reports
 * Create a new content report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content_type, content_id, category, reason } = body;

    // Validate required fields
    if (!content_type || !content_id || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: content_type, content_id, category' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create the report
    const result = await moderationService.reportContent(
      user.id,
      content_type,
      content_id,
      category,
      reason
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Report submitted successfully',
      report_id: result.reportId
    });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/moderation/reports
 * Update report status (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { report_id, status, admin_notes } = body;

    if (!report_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: report_id, status' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check when role system is implemented

    // Update the report
    const { error } = await supabase
      .from('content_reports')
      .update({
        status,
        admin_notes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', report_id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Report updated successfully'
    });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}
