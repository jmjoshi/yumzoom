import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { RestaurantComplianceService } from '@/lib/restaurant-compliance';
import { BusinessOwnerVerification } from '../../../../types/compliance';
import { z } from 'zod';

const verificationRequestSchema = z.object({
  restaurant_id: z.string().uuid(),
  business_name: z.string().min(1).max(200),
  business_email: z.string().email(),
  business_phone: z.string().min(10).max(20),
  business_address: z.string().min(10).max(500),
  verification_documents: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = verificationRequestSchema.parse(body);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user already has a verification request for this restaurant
    const { data: existing } = await supabase
      .from('business_owner_verifications')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('restaurant_id', validatedData.restaurant_id)
      .single();

    if (existing) {
      if (existing.status === 'pending') {
        return NextResponse.json(
          { error: 'You already have a pending verification request for this restaurant' },
          { status: 400 }
        );
      } else if (existing.status === 'verified') {
        return NextResponse.json(
          { error: 'You are already verified as the owner of this restaurant' },
          { status: 400 }
        );
      }
    }

    const complianceService = new RestaurantComplianceService(supabase);

    const verificationRequest: Omit<BusinessOwnerVerification, 'id' | 'status' | 'submitted_at' | 'created_at' | 'updated_at'> = {
      ...validatedData,
      user_id: user.id,
      verified_at: null,
      verified_by: null,
      rejection_reason: null,
      verification_notes: null,
    };

    const result = await complianceService.submitBusinessVerification(verificationRequest);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error submitting verification request:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit verification request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const restaurant_id = searchParams.get('restaurant_id');

    let query = supabase
      .from('business_owner_verifications')
      .select(`
        *,
        restaurants:restaurant_id (name, id, address),
        user:user_id (email),
        verifier:verified_by (email)
      `)
      .order('submitted_at', { ascending: false });

    // Check if user is admin/verification team
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.user_role && ['admin', 'verification_team'].includes(profile.user_role);

    if (!isAdmin) {
      // Regular users can only see their own requests
      query = query.eq('user_id', user.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (restaurant_id) {
      query = query.eq('restaurant_id', restaurant_id);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching verification requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification requests' },
      { status: 500 }
    );
  }
}
