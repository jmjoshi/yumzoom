import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    if (!profile?.user_role || !['admin', 'legal_team', 'verification_team'].includes(profile.user_role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get dashboard data
    const { data: dashboardData, error } = await supabase
      .from('compliance_dashboard')
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    // Get recent activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      recentTakedowns,
      recentVerifications,
      recentLegalNotices,
      upcomingDeadlines
    ] = await Promise.all([
      supabase
        .from('restaurant_takedown_requests')
        .select('id, reason, status, submitted_at, restaurants(name)')
        .gte('submitted_at', thirtyDaysAgo.toISOString())
        .order('submitted_at', { ascending: false })
        .limit(10),
      
      supabase
        .from('business_owner_verifications')
        .select('id, business_name, status, submitted_at, restaurants(name)')
        .gte('submitted_at', thirtyDaysAgo.toISOString())
        .order('submitted_at', { ascending: false })
        .limit(10),
      
      supabase
        .from('legal_notices')
        .select('id, type, priority, status, submitted_at, claimant_name')
        .gte('submitted_at', thirtyDaysAgo.toISOString())
        .order('submitted_at', { ascending: false })
        .limit(10),
      
      supabase
        .from('legal_notices')
        .select('id, type, priority, review_deadline, claimant_name')
        .in('status', ['received', 'under_review'])
        .order('review_deadline', { ascending: true })
        .limit(10)
    ]);

    // Get trends (compare with previous 30 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [currentPeriod, previousPeriod] = await Promise.all([
      supabase
        .from('restaurant_takedown_requests')
        .select('id')
        .gte('submitted_at', thirtyDaysAgo.toISOString()),
      
      supabase
        .from('restaurant_takedown_requests')
        .select('id')
        .gte('submitted_at', sixtyDaysAgo.toISOString())
        .lt('submitted_at', thirtyDaysAgo.toISOString())
    ]);

    const currentCount = currentPeriod.data?.length || 0;
    const previousCount = previousPeriod.data?.length || 0;
    const trend = previousCount === 0 ? 0 : ((currentCount - previousCount) / previousCount) * 100;

    const responseData = {
      overview: dashboardData,
      activity: {
        recent_takedowns: recentTakedowns.data || [],
        recent_verifications: recentVerifications.data || [],
        recent_legal_notices: recentLegalNotices.data || [],
        upcoming_deadlines: upcomingDeadlines.data || [],
      },
      trends: {
        takedown_requests_trend: Math.round(trend * 100) / 100,
        period: '30 days',
      },
      errors: {
        takedowns: recentTakedowns.error,
        verifications: recentVerifications.error,
        legal_notices: recentLegalNotices.error,
        deadlines: upcomingDeadlines.error,
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching compliance dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance dashboard' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, filters } = body;

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

    if (action === 'export_data') {
      // Export compliance data for analysis
      const { start_date, end_date, type } = filters;

      let tables = ['restaurant_takedown_requests', 'business_owner_verifications', 'legal_notices'];
      if (type && type !== 'all') {
        tables = [type];
      }

      const exportData: Record<string, any> = {};

      for (const table of tables) {
        let query = supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false });

        if (start_date) {
          query = query.gte('created_at', start_date);
        }

        if (end_date) {
          query = query.lte('created_at', end_date);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error(`Error exporting ${table}:`, error);
          continue;
        }

        exportData[table] = data;
      }

      return NextResponse.json({
        export_data: exportData,
        generated_at: new Date().toISOString(),
        filters: filters,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing dashboard action:', error);
    return NextResponse.json(
      { error: 'Failed to process dashboard action' },
      { status: 500 }
    );
  }
}
