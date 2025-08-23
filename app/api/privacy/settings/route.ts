import { NextRequest, NextResponse } from 'next/server';
import { complianceService } from '@/lib/compliance';
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

    const settings = await complianceService.getPrivacySettings(user.id);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Privacy settings error:', error);
    return NextResponse.json({ error: 'Failed to get privacy settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await request.json();
    await complianceService.updatePrivacySettings(user.id, settings);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Privacy settings update error:', error);
    return NextResponse.json({ error: 'Failed to update privacy settings' }, { status: 500 });
  }
}
