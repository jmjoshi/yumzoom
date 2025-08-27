import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { RestaurantComplianceService } from '@/lib/restaurant-compliance';
import { LegalNotice } from '../../../../types/compliance';
import { z } from 'zod';

const legalNoticeSchema = z.object({
  type: z.enum(['takedown_notice', 'copyright_claim', 'trademark_dispute', 'privacy_complaint', 'data_correction']),
  restaurant_id: z.string().uuid().optional(),
  claimant_name: z.string().min(1).max(200),
  claimant_email: z.string().email(),
  claimant_type: z.enum(['individual', 'business', 'legal_representative']),
  description: z.string().min(10).max(2000),
  affected_content: z.array(z.string()).min(1),
  legal_basis: z.string().min(10).max(1000),
  requested_action: z.enum(['remove', 'modify', 'attribute', 'clarify']),
  supporting_documents: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = legalNoticeSchema.parse(body);

    // Calculate review deadline based on priority
    const priorityDeadlines = {
      urgent: 24, // 24 hours
      high: 72,   // 3 days
      medium: 168, // 7 days
      low: 336,   // 14 days
    };

    const priority = validatedData.priority || 'medium';
    const reviewDeadline = new Date();
    reviewDeadline.setHours(reviewDeadline.getHours() + priorityDeadlines[priority]);

    const complianceService = new RestaurantComplianceService(supabase);

    const legalNotice: Omit<LegalNotice, 'id' | 'status' | 'submitted_at' | 'created_at' | 'updated_at'> = {
      ...validatedData,
      restaurant_id: validatedData.restaurant_id || null,
      supporting_documents: validatedData.supporting_documents || [],
      priority,
      review_deadline: reviewDeadline.toISOString(),
      resolved_at: null,
      resolution: null,
    };

    const result = await complianceService.submitLegalNotice(legalNotice);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error submitting legal notice:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit legal notice' },
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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const restaurant_id = searchParams.get('restaurant_id');

    let query = supabase
      .from('legal_notices')
      .select(`
        *,
        restaurants:restaurant_id (name, id, address)
      `)
      .order('submitted_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (priority) {
      query = query.eq('priority', priority);
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
    console.error('Error fetching legal notices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch legal notices' },
      { status: 500 }
    );
  }
}
