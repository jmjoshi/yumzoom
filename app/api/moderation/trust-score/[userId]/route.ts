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
 * GET /api/moderation/trust-score/[userId]
 * Get user trust score
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Check if user is authenticated
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can only view their own trust score unless they're admin
    if (user.id !== userId) {
      // TODO: Add admin role check when role system is implemented
      // For now, allow access for demo purposes
    }

    const trustScore = await moderationService.getUserTrustScore(userId);

    if (!trustScore) {
      return NextResponse.json(
        { error: 'Trust score not found' },
        { status: 404 }
      );
    }

    // Return limited info for non-owners
    if (user.id !== userId) {
      return NextResponse.json({
        user_id: trustScore.user_id,
        trust_score: trustScore.trust_score,
        reputation_points: trustScore.reputation_points,
        account_status: trustScore.account_status
      });
    }

    // Return full info for owner
    return NextResponse.json({ trust_score: trustScore });
  } catch (error) {
    console.error('Error fetching trust score:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trust score' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/moderation/trust-score/[userId]
 * Update user trust score (recalculate)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Check if user is authenticated
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can update their own trust score, or admins can update any
    if (user.id !== userId) {
      // TODO: Add admin role check when role system is implemented
      // For now, allow access for demo purposes
    }

    await moderationService.updateUserTrustScore(userId);

    const updatedTrustScore = await moderationService.getUserTrustScore(userId);

    return NextResponse.json({
      message: 'Trust score updated successfully',
      trust_score: updatedTrustScore
    });
  } catch (error) {
    console.error('Error updating trust score:', error);
    return NextResponse.json(
      { error: 'Failed to update trust score' },
      { status: 500 }
    );
  }
}
