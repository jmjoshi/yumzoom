import { NextRequest, NextResponse } from 'next/server';
import { twoFactorAuthService } from '@/lib/two-factor-auth';
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

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const success = await twoFactorAuthService.enableTwoFactor(user.id, token);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }
  } catch (error) {
    console.error('2FA enable error:', error);
    return NextResponse.json({ error: 'Failed to enable 2FA' }, { status: 500 });
  }
}
