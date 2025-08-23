import { NextRequest, NextResponse } from 'next/server';
import { complianceService } from '@/lib/compliance';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestType = 'general' } = await request.json();
    const requestId = await complianceService.requestDataDeletion(user.id, requestType);
    
    return NextResponse.json({ requestId });
  } catch (error) {
    console.error('Data deletion error:', error);
    return NextResponse.json({ error: 'Failed to request data deletion' }, { status: 500 });
  }
}
