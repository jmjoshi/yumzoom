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

    const consents = await complianceService.getConsentStatus(user.id);
    return NextResponse.json(Object.entries(consents).map(([type, granted]) => ({
      consentType: type,
      granted,
      grantedAt: new Date(),
      version: '1.0'
    })));
  } catch (error) {
    console.error('Consent records error:', error);
    return NextResponse.json({ error: 'Failed to get consent records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { consents } = await request.json();
    const ipAddress = request.ip || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    await complianceService.recordConsent(user.id, consents, ipAddress, userAgent);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Consent recording error:', error);
    return NextResponse.json({ error: 'Failed to record consent' }, { status: 500 });
  }
}
