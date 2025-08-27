import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { RestaurantComplianceService } from '@/lib/restaurant-compliance';
import { RestaurantTakedownRequest } from '../../../../types/compliance';
import { z } from 'zod';

const takedownRequestSchema = z.object({
  restaurant_id: z.string().uuid(),
  requester_type: z.enum(['owner', 'legal_representative', 'customer', 'other']),
  reason: z.enum(['ownership_dispute', 'incorrect_information', 'privacy_violation', 'copyright_violation', 'other']),
  description: z.string().min(10).max(2000),
  contact_email: z.string().email(),
  verification_documents: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = takedownRequestSchema.parse(body);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    const complianceService = new RestaurantComplianceService(supabase);

    const takedownRequest: Omit<RestaurantTakedownRequest, 'id' | 'status' | 'submitted_at' | 'created_at' | 'updated_at'> = {
      ...validatedData,
      requester_id: user?.id || null,
      verification_documents: validatedData.verification_documents || [],
      reviewed_at: null,
      reviewed_by: null,
      admin_notes: null,
      resolution_date: null,
    };

    const result = await complianceService.submitTakedownRequest(takedownRequest);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error submitting takedown request:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit takedown request' },
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
      .from('restaurant_takedown_requests')
      .select(`
        *,
        restaurants:restaurant_id (name, id),
        requester:requester_id (email),
        reviewer:reviewed_by (email)
      `)
      .order('submitted_at', { ascending: false });

    // Check if user is admin/legal team
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.user_role && ['admin', 'legal_team'].includes(profile.user_role);

    if (!isAdmin) {
      // Regular users can only see their own requests
      query = query.eq('requester_id', user.id);
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
    console.error('Error fetching takedown requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch takedown requests' },
      { status: 500 }
    );
  }
}
