import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityMonitor } from './lib/monitoring';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // requests per window
const API_RATE_LIMIT = 50; // API-specific limit

// Store request counts (in production, use Redis or similar)
const requestStore = new Map<string, { count: number; timestamp: number }>();

// Allowed IPs (in production, load from environment or database)
const ALLOWED_IPS = new Set([
  '127.0.0.1',
  'localhost',
  // Add your allowed IPs here
]);

function isAllowedIP(ip: string): boolean {
  // In development, allow all
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  return ALLOWED_IPS.has(ip);
}

function getRateLimit(req: NextRequest): boolean {
  const ip = req.ip || 'unknown';
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  const limit = isApiRoute ? API_RATE_LIMIT : MAX_REQUESTS;
  
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Clean up old entries
  for (const [storedIp, data] of requestStore.entries()) {
    if (data.timestamp < windowStart) {
      requestStore.delete(storedIp);
    }
  }
  
  // Get or create request data for this IP
  const requestData = requestStore.get(ip) || { count: 0, timestamp: now };
  
  // Reset if outside window
  if (requestData.timestamp < windowStart) {
    requestData.count = 0;
    requestData.timestamp = now;
  }
  
  // Increment count
  requestData.count++;
  requestStore.set(ip, requestData);
  
  // Check if limit exceeded
  if (requestData.count > limit) {
    securityMonitor.logSecurityEvent(
      'api',
      'rate_limit_exceeded',
      'failure',
      { ip, count: requestData.count, limit }
    );
    return false;
  }
  
  return true;
}

export async function middleware(req: NextRequest) {
  const ip = req.ip || 'unknown';
  
  // IP allowlisting
  if (!isAllowedIP(ip) && process.env.NODE_ENV === 'production') {
    securityMonitor.logSecurityEvent(
      'api',
      'ip_blocked',
      'failure',
      { ip }
    );
    return new NextResponse(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Rate limiting
  if (!getRateLimit(req)) {
    return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Only set HSTS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }
  
  return response;
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Apply to auth routes
    '/(signin|signup|dashboard)/:path*',
  ],
};
