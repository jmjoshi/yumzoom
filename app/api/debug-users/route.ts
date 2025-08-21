import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // List recent users (requires service role key)
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users.users.slice(-5).map(user => ({
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        confirmed_at: user.confirmed_at,
        created_at: user.created_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Service role key required for this endpoint' },
      { status: 500 }
    );
  }
}
