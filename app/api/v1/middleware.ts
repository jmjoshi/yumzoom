import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// API Authentication and Rate Limiting Middleware
export async function authenticateApiRequest(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key');
  
  if (!apiKey) {
    return { error: { code: 'MISSING_API_KEY', message: 'API key is required' }, status: 401 };
  }

  // Get application details
  const { data: application, error } = await supabase
    .from('api_applications')
    .select('*')
    .eq('api_key', apiKey)
    .eq('status', 'approved')
    .single();

  if (error || !application) {
    return { error: { code: 'INVALID_API_KEY', message: 'Invalid or inactive API key' }, status: 401 };
  }

  // Check rate limits
  const now = new Date();
  const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Check hourly rate limit
  const { data: hourlyUsage } = await supabase
    .from('api_rate_limits')
    .select('request_count')
    .eq('api_application_id', application.id)
    .eq('period_type', 'hour')
    .eq('period_start', hourStart.toISOString())
    .single();

  if (hourlyUsage && hourlyUsage.request_count >= application.rate_limit_per_hour) {
    return { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Hourly rate limit exceeded' }, status: 429 };
  }

  // Check daily rate limit
  const { data: dailyUsage } = await supabase
    .from('api_rate_limits')
    .select('request_count')
    .eq('api_application_id', application.id)
    .eq('period_type', 'day')
    .eq('period_start', dayStart.toISOString())
    .single();

  if (dailyUsage && dailyUsage.request_count >= application.rate_limit_per_day) {
    return { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Daily rate limit exceeded' }, status: 429 };
  }

  // Update rate limit counters
  await Promise.all([
    // Update hourly counter
    supabase
      .from('api_rate_limits')
      .upsert({
        api_application_id: application.id,
        period_type: 'hour',
        period_start: hourStart.toISOString(),
        request_count: (hourlyUsage?.request_count || 0) + 1
      }),
    // Update daily counter
    supabase
      .from('api_rate_limits')
      .upsert({
        api_application_id: application.id,
        period_type: 'day',
        period_start: dayStart.toISOString(),
        request_count: (dailyUsage?.request_count || 0) + 1
      })
  ]);

  return { application };
}

// Log API usage
export async function logApiUsage(
  applicationId: string,
  request: NextRequest,
  statusCode: number,
  responseTimeMs?: number,
  errorMessage?: string
) {
  const url = new URL(request.url);
  const endpoint = url.pathname;
  const method = request.method;
  
  await supabase
    .from('api_usage_logs')
    .insert({
      api_application_id: applicationId,
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      user_agent: request.headers.get('User-Agent'),
      ip_address: request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP'),
      error_message: errorMessage
    });
}
