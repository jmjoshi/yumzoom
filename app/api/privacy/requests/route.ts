import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get export requests
    const { data: exportRequests } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false });

    // Get deletion requests
    const { data: deletionRequests } = await supabase
      .from('data_deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false });

    const allRequests = [
      ...(exportRequests || []).map(req => ({
        id: req.id,
        type: 'export' as const,
        status: req.status,
        requestedAt: new Date(req.requested_at),
        completedAt: req.completed_at ? new Date(req.completed_at) : undefined,
        downloadUrl: req.download_url,
        expiresAt: req.expires_at ? new Date(req.expires_at) : undefined,
      })),
      ...(deletionRequests || []).map(req => ({
        id: req.id,
        type: 'deletion' as const,
        status: req.status,
        requestedAt: new Date(req.requested_at),
        completedAt: req.completed_at ? new Date(req.completed_at) : undefined,
      }))
    ].sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
    
    return NextResponse.json(allRequests);
  } catch (error) {
    console.error('Privacy requests error:', error);
    return NextResponse.json({ error: 'Failed to get privacy requests' }, { status: 500 });
  }
}
