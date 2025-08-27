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

    // Check if user is admin/legal team
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (!profile?.user_role || !['admin', 'legal_team'].includes(profile.user_role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const complianceService = new RestaurantComplianceService(supabase);

    let result;
    
    if (body.action === 'approve') {
      result = await complianceService.approveTakedownRequest(id, user.id, body.resolution_notes);
    } else if (body.action === 'reject') {
      result = await complianceService.rejectTakedownRequest(id, user.id, body.rejection_reason);
    } else {
      // General update
      const { data, error } = await supabase
        .from('restaurant_takedown_requests')
        .update({
          status: body.status,
          admin_notes: body.admin_notes,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating takedown request:', error);
    return NextResponse.json(
      { error: 'Failed to update takedown request' },
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

    // Check if user is admin/legal team or the requester
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.user_role && ['admin', 'legal_team'].includes(profile.user_role);

    let query = supabase
      .from('restaurant_takedown_requests')
      .select(`
        *,
        restaurants:restaurant_id (name, id, address),
        requester:requester_id (email),
        reviewer:reviewed_by (email)
      `)
      .eq('id', id);

    if (!isAdmin) {
      // Add filter for requester if not admin
      query = query.eq('requester_id', user.id);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Takedown request not found or access denied' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching takedown request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch takedown request' },
      { status: 500 }
    );
  }
}
