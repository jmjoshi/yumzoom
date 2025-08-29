/**
 * HTTPS Configuration Utilities
 * Ensures secure HTTP protocol usage throughout the application
 */

export interface HttpsConfig {
  enforceHttps: boolean;
  redirectHttpToHttps: boolean;
  hstsEnabled: boolean;
  hstsMaxAge: number;
  includeSubdomains: boolean;
  preload: boolean;
}

/**
 * Get HTTPS configuration based on environment
 */
export function getHttpsConfig(): HttpsConfig {
  const isProd = process.env.NODE_ENV === 'production';
  
  return {
    enforceHttps: isProd,
    redirectHttpToHttps: isProd,
    hstsEnabled: isProd,
    hstsMaxAge: 31536000, // 1 year
    includeSubdomains: true,
    preload: true
  };
}

/**
 * Ensure URL uses HTTPS protocol in production
 */
export function ensureHttps(url: string): string {
  if (!url) return url;
  
  const config = getHttpsConfig();
  
  // In production, enforce HTTPS
  if (config.enforceHttps && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  
  return url;
}

/**
 * Get secure base URL for the application
 */
export function getSecureBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://yumzoom.com' 
      : 'http://localhost:3000');
  
  return ensureHttps(baseUrl);
}

/**
 * Generate security headers for HTTPS enforcement
 */
export function getSecurityHeaders(): Record<string, string> {
  const config = getHttpsConfig();
  const headers: Record<string, string> = {};
  
  // Basic security headers
  headers['X-Frame-Options'] = 'DENY';
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
  headers['X-XSS-Protection'] = '1; mode=block';
  headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()';
  
  // HTTPS-specific headers
  if (config.hstsEnabled) {
    let hstsValue = `max-age=${config.hstsMaxAge}`;
    if (config.includeSubdomains) hstsValue += '; includeSubDomains';
    if (config.preload) hstsValue += '; preload';
    
    headers['Strict-Transport-Security'] = hstsValue;
  }
  
  // Content Security Policy with HTTPS enforcement
  if (config.enforceHttps) {
    headers['Content-Security-Policy'] = [
      "default-src 'self' https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: https:",
      "font-src 'self' https:",
      "connect-src 'self' https:",
      "media-src 'self' https:",
      "object-src 'none'",
      "child-src 'self' https:",
      "worker-src 'self'",
      "manifest-src 'self'",
      "base-uri 'self'",
      "form-action 'self' https:",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ');
  }
  
  return headers;
}

/**
 * Check if current request is secure (HTTPS)
 */
export function isSecureConnection(req?: Request): boolean {
  if (typeof window !== 'undefined') {
    return window.location.protocol === 'https:';
  }
  
  if (req) {
    const proto = req.headers.get('x-forwarded-proto') || 
                 req.headers.get('x-forwarded-protocol') || 
                 req.url?.startsWith('https:') ? 'https' : 'http';
    return proto === 'https';
  }
  
  return process.env.NODE_ENV === 'production';
}

/**
 * Validate URL security
 */
export function validateUrlSecurity(url: string): {
  isSecure: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  if (!url) {
    issues.push('URL is empty or undefined');
    return { isSecure: false, issues, recommendations };
  }
  
  // Check protocol
  if (url.startsWith('http://')) {
    if (process.env.NODE_ENV === 'production') {
      issues.push('Using HTTP protocol in production environment');
      recommendations.push('Use HTTPS protocol for production');
    }
  } else if (!url.startsWith('https://') && !url.startsWith('/')) {
    issues.push('URL does not use a secure protocol');
    recommendations.push('Use HTTPS or relative URLs');
  }
  
  // Check for localhost in production
  if (process.env.NODE_ENV === 'production' && url.includes('localhost')) {
    issues.push('Using localhost URL in production');
    recommendations.push('Use production domain name');
  }
  
  return {
    isSecure: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Generate secure external URL for emails and notifications
 */
export function generateSecureUrl(path: string): string {
  const baseUrl = getSecureBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * HTTPS enforcement middleware helper
 */
export function createHttpsRedirect(req: Request): Response | null {
  const config = getHttpsConfig();
  
  if (!config.redirectHttpToHttps) {
    return null;
  }
  
  const url = new URL(req.url);
  
  if (url.protocol === 'http:' && !url.hostname.includes('localhost')) {
    const httpsUrl = `https://${url.host}${url.pathname}${url.search}`;
    return Response.redirect(httpsUrl, 301);
  }
  
  return null;
}
