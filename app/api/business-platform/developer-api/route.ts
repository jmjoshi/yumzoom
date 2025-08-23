import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  BusinessPlatformResponse, 
  ApiApplication,
  CreateApiApplicationRequest 
} from '@/types/business-platform';
import { randomBytes } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate API key and secret
function generateApiCredentials() {
  const apiKey = 'yz_' + randomBytes(16).toString('hex');
  const apiSecret = randomBytes(32).toString('hex');
  return { apiKey, apiSecret };
}

// GET /api/business-platform/developer-api - Get API applications (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const developerEmail = searchParams.get('developer_email');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // TODO: Add admin authentication check here
    // For now, we'll assume the request is authorized

    // Build query
    let query = supabase
      .from('api_applications')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (developerEmail) {
      query = query.eq('developer_email', developerEmail);
    }

    // Apply sorting
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('Error fetching API applications:', error);
      return NextResponse.json({
        success: false,
        error: { code: 'FETCH_APPLICATIONS_ERROR', message: 'Failed to fetch API applications' }
      } as BusinessPlatformResponse<never>, { status: 500 });
    }

    // Remove sensitive information from response
    const sanitizedApplications = applications?.map(app => ({
      ...app,
      api_secret: '***hidden***'
    }));

    return NextResponse.json({
      success: true,
      data: sanitizedApplications,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    } as BusinessPlatformResponse<ApiApplication[]>);

  } catch (error) {
    console.error('Error in developer-api GET:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    } as BusinessPlatformResponse<never>, { status: 500 });
  }
}

// POST /api/business-platform/developer-api - Register new API application
export async function POST(request: NextRequest) {
  try {
    const body: CreateApiApplicationRequest = await request.json();
    const {
      name,
      description,
      developer_email,
      developer_organization,
      app_type,
      webhook_url,
      allowed_origins,
      scopes
    } = body;

    // Validate required fields
    if (!name || !developer_email || !app_type || !scopes || scopes.length === 0) {
      return NextResponse.json({
        success: false,
        error: { code: 'MISSING_REQUIRED_FIELDS', message: 'Name, developer email, app type, and scopes are required' }
      } as BusinessPlatformResponse<never>, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(developer_email)) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'Invalid email format' }
      } as BusinessPlatformResponse<never>, { status: 400 });
    }

    // Validate webhook URL if provided
    if (webhook_url) {
      try {
        new URL(webhook_url);
      } catch {
        return NextResponse.json({
          success: false,
          error: { code: 'INVALID_WEBHOOK_URL', message: 'Invalid webhook URL format' }
        } as BusinessPlatformResponse<never>, { status: 400 });
      }
    }

    // Generate API credentials
    const { apiKey, apiSecret } = generateApiCredentials();

    // Set default rate limits based on app type
    let rateLimitPerHour = 1000;
    let rateLimitPerDay = 10000;

    if (app_type === 'backend') {
      rateLimitPerHour = 5000;
      rateLimitPerDay = 50000;
    } else if (app_type === 'webhook') {
      rateLimitPerHour = 500;
      rateLimitPerDay = 5000;
    }

    // Create the application
    const applicationData = {
      name,
      description,
      developer_email,
      developer_organization,
      app_type,
      status: 'pending' as const,
      api_key: apiKey,
      api_secret: apiSecret,
      webhook_url,
      allowed_origins: allowed_origins || [],
      rate_limit_per_hour: rateLimitPerHour,
      rate_limit_per_day: rateLimitPerDay,
      scopes
    };

    const { data: newApplication, error: applicationError } = await supabase
      .from('api_applications')
      .insert(applicationData)
      .select('*')
      .single();

    if (applicationError) {
      console.error('Error creating API application:', applicationError);
      return NextResponse.json({
        success: false,
        error: { code: 'CREATE_APPLICATION_ERROR', message: 'Failed to create API application' }
      } as BusinessPlatformResponse<never>, { status: 500 });
    }

    // Return application data with API credentials (only on creation)
    return NextResponse.json({
      success: true,
      data: newApplication
    } as BusinessPlatformResponse<ApiApplication>, { status: 201 });

  } catch (error) {
    console.error('Error in developer-api POST:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    } as BusinessPlatformResponse<never>, { status: 500 });
  }
}
