import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityMonitor } from './lib/monitoring';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
import { getSecurityHeaders, createHttpsRedirect } from './lib/https-config';

// Create internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

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
  const { pathname } = req.nextUrl;
  
  // HTTPS enforcement - redirect HTTP to HTTPS in production
  const httpsRedirect = createHttpsRedirect(req);
  if (httpsRedirect) {
    return httpsRedirect;
  }
  
  // Temporarily disable internationalization
  // Skip internationalization for API routes, static files, and internal Next.js routes
  const shouldSkipIntl = 
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/sw') ||
    pathname.startsWith('/favicon') ||
    pathname === '/'; // Temporarily skip home page

  if (!shouldSkipIntl) {
    // Apply internationalization middleware first
    const intlResponse = intlMiddleware(req);
    if (intlResponse) {
      return intlResponse;
    }
  }

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
  
  // Apply comprehensive security headers including HTTPS enforcement
  const response = NextResponse.next();
  const securityHeaders = getSecurityHeaders();
  
  // Set security headers explicitly for validation
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Set HSTS header in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Apply additional security headers from the configuration
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (!response.headers.has(key)) {
      response.headers.set(key, value);
    }
  });
  
  return response;
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    // Apply internationalization to all pages except API routes and static files
    '/((?!api|_next/static|_next/image|favicon.ico|manifest|sw).*)',
    // Apply security to all API routes
    '/api/:path*',
    // Apply to auth routes
    '/(signin|signup|dashboard)/:path*',
  ],
};
