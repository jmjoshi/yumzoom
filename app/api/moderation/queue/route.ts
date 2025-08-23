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
 * GET /api/moderation/queue
 * Get moderation queue items for admin review
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assigned_to');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Check if user is authenticated
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check when role system is implemented

    const queueItems = await moderationService.getModerationQueue(
      limit,
      priority ? parseInt(priority) : undefined,
      assignedTo || undefined
    );

    return NextResponse.json({ queue_items: queueItems });
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation queue' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/moderation/queue
 * Process moderation decision for queue item
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { queue_id, decision, notes, action_taken } = body;

    if (!queue_id || !decision) {
      return NextResponse.json(
        { error: 'Missing required fields: queue_id, decision' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check when role system is implemented

    const result = await moderationService.processModerationDecision(
      queue_id,
      decision,
      user.id,
      notes,
      action_taken
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Moderation decision processed successfully'
    });
  } catch (error) {
    console.error('Error processing moderation decision:', error);
    return NextResponse.json(
      { error: 'Failed to process moderation decision' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/moderation/queue
 * Add content to moderation queue
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content_type, content_id, reason, priority } = body;

    if (!content_type || !content_id || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: content_type, content_id, reason' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check when role system is implemented

    await moderationService.addToModerationQueue(
      content_type,
      content_id,
      reason,
      priority || 3
    );

    return NextResponse.json({
      message: 'Content added to moderation queue successfully'
    });
  } catch (error) {
    console.error('Error adding to moderation queue:', error);
    return NextResponse.json(
      { error: 'Failed to add to moderation queue' },
      { status: 500 }
    );
  }
}
