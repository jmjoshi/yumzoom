import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { RestaurantComplianceService } from '@/lib/restaurant-compliance';

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin/verification team
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (!profile?.user_role || !['admin', 'verification_team'].includes(profile.user_role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const complianceService = new RestaurantComplianceService(supabase);

    let result;
    
    if (body.action === 'approve') {
      result = await complianceService.approveBusinessVerification(id, user.id, body.verification_notes);
    } else if (body.action === 'reject') {
      result = await complianceService.rejectBusinessVerification(id, user.id, body.rejection_reason);
    } else if (body.action === 'request_info') {
      // Request additional information
      const { data, error } = await supabase
        .from('business_owner_verifications')
        .update({
          status: 'requires_additional_info',
          verification_notes: body.additional_info_request,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // General update
      const { data, error } = await supabase
        .from('business_owner_verifications')
        .update({
          status: body.status,
          verification_notes: body.verification_notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating verification request:', error);
    return NextResponse.json(
      { error: 'Failed to update verification request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin/verification team or the requester
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.user_role && ['admin', 'verification_team'].includes(profile.user_role);

    let query = supabase
      .from('business_owner_verifications')
      .select(`
        *,
        restaurants:restaurant_id (name, id, address, phone, email),
        user:user_id (email, user_profiles(first_name, last_name)),
        verifier:verified_by (email)
      `)
      .eq('id', id);

    if (!isAdmin) {
      // Add filter for user if not admin
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Verification request not found or access denied' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching verification request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification request' },
      { status: 500 }
    );
  }
}
