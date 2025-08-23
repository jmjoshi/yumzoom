import { NextRequest, NextResponse } from 'next/server';
import { twoFactorAuthService } from '@/lib/two-factor-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backupCodes = await twoFactorAuthService.regenerateBackupCodes(user.id);
    return NextResponse.json({ backupCodes });
  } catch (error) {
    console.error('Backup codes regeneration error:', error);
    return NextResponse.json({ error: 'Failed to regenerate backup codes' }, { status: 500 });
  }
}
