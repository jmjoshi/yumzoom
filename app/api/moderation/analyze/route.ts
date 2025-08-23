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
 * POST /api/moderation/analyze
 * Analyze content with AI moderation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, content_type, content_id } = body;

    if (!content || !content_type || !content_id) {
      return NextResponse.json(
        { error: 'Missing required fields: content, content_type, content_id' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Analyze the content
    const analysisResults = await moderationService.analyzeTextContent(
      content,
      content_type,
      content_id
    );

    // Auto-moderate based on analysis
    const action = await moderationService.autoModerateContent(
      content_type,
      content_id,
      analysisResults
    );

    // Calculate quality score
    const qualityScore = await moderationService.calculateQualityScore(
      content_type,
      content_id,
      content
    );

    return NextResponse.json({
      analysis_results: analysisResults,
      action_taken: action,
      quality_score: qualityScore
    });
  } catch (error) {
    console.error('Error analyzing content:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/moderation/analyze/results
 * Get AI analysis results for content
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('content_type');
    const contentId = searchParams.get('content_id');
    const analysisType = searchParams.get('analysis_type');

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: 'Missing required parameters: content_type, content_id' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check when role system is implemented

    // Get AI analysis results from database
    let query = supabase
      .from('ai_moderation_results')
      .select('*')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .order('created_at', { ascending: false });

    if (analysisType) {
      query = query.eq('analysis_type', analysisType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch analysis results' },
        { status: 500 }
      );
    }

    return NextResponse.json({ results: data || [] });
  } catch (error) {
    console.error('Error fetching analysis results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis results' },
      { status: 500 }
    );
  }
}
