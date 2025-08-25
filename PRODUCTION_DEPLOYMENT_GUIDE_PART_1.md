# YumZoom Production Deployment Guide - Part 1: Environment Setup
## Comprehensive Production Deployment - Environment Configuration

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Domain & DNS Configuration](#domain--dns-configuration)
4. [SSL Certificate Setup](#ssl-certificate-setup)
5. [Environment Variables Configuration](#environment-variables-configuration)
6. [Security Configuration](#security-configuration)
7. [Next Steps](#next-steps)

---

## Pre-Deployment Checklist

### Development Readiness
- [ ] All features tested in development environment
- [ ] Code reviewed and approved
- [ ] Database migrations tested and validated
- [ ] All environment variables documented
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Accessibility testing completed
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness verified
- [ ] SEO optimization completed

### Infrastructure Requirements
- [ ] Domain name purchased and configured
- [ ] SSL certificate available
- [ ] Production database provisioned
- [ ] CDN configured
- [ ] Monitoring tools setup
- [ ] Backup strategy implemented
- [ ] Error tracking configured
- [ ] Performance monitoring enabled

### Third-Party Services Accounts
- [ ] Vercel account with production plan
- [ ] Supabase production project created
- [ ] Google Cloud Platform account (for Maps API)
- [ ] Stripe account configured for live payments
- [ ] SendGrid/Resend account for emails
- [ ] Upstash Redis account for caching
- [ ] CloudFlare account for CDN and security
- [ ] Sentry account for error monitoring
- [ ] Google Analytics account for tracking

---

## Infrastructure Setup

### Step 1: Vercel Production Setup

#### 1.1 Create Vercel Account and Project
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
cd /path/to/yumzoom
vercel link
```

#### 1.2 Configure Production Project Settings
1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your YumZoom project
3. Navigate to **Settings** → **General**
4. Configure the following:

```json
{
  "name": "yumzoom-production",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "devCommand": "npm run dev",
  "nodeVersion": "18.x"
}
```

#### 1.3 Set Production Domains
1. Navigate to **Settings** → **Domains**
2. Add your custom domain: `yumzoom.app`
3. Add www redirect: `www.yumzoom.app` → `yumzoom.app`
4. Configure DNS as instructed by Vercel

### Step 2: Supabase Production Setup

#### 2.1 Create Production Project
1. Go to Supabase Dashboard: https://app.supabase.com
2. Click **New Project**
3. Configure production project:

```json
{
  "name": "YumZoom Production",
  "database_password": "GENERATE_STRONG_PASSWORD",
  "region": "us-east-1",
  "pricing_plan": "Pro"
}
```

#### 2.2 Configure Database
1. Navigate to **Settings** → **Database**
2. Note down connection details:
   - Host: `db.your-project-ref.supabase.co`
   - Database: `postgres`
   - Port: `5432`
   - Username: `postgres`

#### 2.3 Set Up Connection Pooling
1. Navigate to **Settings** → **Database** → **Connection Pooling**
2. Enable connection pooling
3. Set pool size to `15` for production
4. Set pool mode to `transaction`

#### 2.4 Configure Row Level Security
```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Set up authentication policies
CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);
```

### Step 3: Redis Cache Setup (Upstash)

#### 3.1 Create Upstash Account
1. Go to https://upstash.com
2. Sign up for production account
3. Create new Redis database:

```json
{
  "name": "yumzoom-prod-cache",
  "region": "us-east-1",
  "type": "pay-as-you-go",
  "eviction": "allkeys-lru",
  "memory": "1GB"
}
```

#### 3.2 Configure Redis Connection
1. Get connection details from Upstash dashboard
2. Copy the Redis URL: `rediss://default:password@host:port`
3. Note the REST API URL and token for serverless functions

### Step 4: CDN and Security (CloudFlare)

#### 4.1 Set Up CloudFlare
1. Sign up at https://cloudflare.com
2. Add your domain `yumzoom.app`
3. Update nameservers at your domain registrar
4. Configure CloudFlare settings:

```json
{
  "ssl": "Full (strict)",
  "security_level": "medium",
  "browser_cache_ttl": "4_hours",
  "cache_level": "aggressive",
  "development_mode": "off",
  "ipv6": "on",
  "websockets": "on",
  "pseudo_ipv4": "off",
  "ip_geolocation": "on",
  "email_obfuscation": "on",
  "server_side_exclude": "on",
  "hotlink_protection": "off",
  "security_headers": "on",
  "min_tls_version": "1.2",
  "opportunistic_encryption": "on",
  "tls_1_3": "on",
  "automatic_https_rewrites": "on",
  "always_use_https": "on"
}
```

#### 4.2 Configure Page Rules
Create these page rules in CloudFlare:

1. **Static Assets Caching**
   - URL: `yumzoom.app/_next/static/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 year

2. **API Route Caching**
   - URL: `yumzoom.app/api/restaurants*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 5 minutes

3. **Image Optimization**
   - URL: `yumzoom.app/_next/image*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month

---

## Domain & DNS Configuration

### Step 1: Domain Registration
1. Purchase domain `yumzoom.app` from registrar (Namecheap, GoDaddy, etc.)
2. Ensure domain includes:
   - Privacy protection
   - Auto-renewal enabled
   - DNS management access

### Step 2: DNS Configuration
Configure the following DNS records:

#### Primary Domain Records
```dns
# A Records (if not using CloudFlare proxy)
A     @              76.76.19.19      (Vercel IP)
A     www            76.76.19.19      (Vercel IP)

# CNAME Records (if using CloudFlare)
CNAME @              cname.vercel-dns.com
CNAME www            cname.vercel-dns.com

# MX Records (for email)
MX    @      10      mail.yumzoom.app
MX    @      20      mail2.yumzoom.app

# TXT Records
TXT   @              "v=spf1 include:_spf.google.com ~all"
TXT   _dmarc         "v=DMARC1; p=quarantine; rua=mailto:dmarc@yumzoom.app"

# CNAME for verification
CNAME _vercel        vc-domain-verify.yumzoom.app
```

#### Subdomain Configuration
```dns
# API subdomain (if needed)
CNAME api            cname.vercel-dns.com

# Staging environment
CNAME staging        cname-staging.vercel-dns.com

# Admin panel
CNAME admin          cname.vercel-dns.com

# CDN subdomain
CNAME cdn            d2j4bxf5n1s7pk.cloudfront.net
```

### Step 3: Verify DNS Propagation
```bash
# Check DNS propagation
nslookup yumzoom.app
nslookup www.yumzoom.app

# Test with different DNS servers
nslookup yumzoom.app 8.8.8.8
nslookup yumzoom.app 1.1.1.1

# Use online tools
# Visit: https://www.whatsmydns.net/#A/yumzoom.app
```

---

## SSL Certificate Setup

### Step 1: CloudFlare SSL Configuration
1. In CloudFlare dashboard, go to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full (strict)**
3. Enable **Always Use HTTPS**
4. Enable **Automatic HTTPS Rewrites**

### Step 2: Configure SSL Settings
```json
{
  "encryption_mode": "full_strict",
  "always_use_https": "on",
  "automatic_https_rewrites": "on",
  "min_tls_version": "1.2",
  "tls_1_3": "on",
  "opportunistic_encryption": "on",
  "onion_routing": "on",
  "authenticated_origin_pulls": "off"
}
```

### Step 3: Enable HSTS
1. Navigate to **SSL/TLS** → **Edge Certificates**
2. Enable **HTTP Strict Transport Security (HSTS)**
3. Configure HSTS settings:

```json
{
  "status": "on",
  "max_age": "6 months",
  "include_subdomains": true,
  "preload": true,
  "no_sniff": true
}
```

### Step 4: Verify SSL Certificate
```bash
# Test SSL certificate
openssl s_client -connect yumzoom.app:443 -servername yumzoom.app

# Check SSL rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yumzoom.app
```

---

## Environment Variables Configuration

### Step 1: Production Environment Variables
Create `.env.production` file:

```bash
# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yumzoom.app
NEXT_PUBLIC_APP_NAME="YumZoom"
NEXT_PUBLIC_APP_VERSION=1.0.0

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
SUPABASE_JWT_SECRET=your-production-jwt-secret

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
DATABASE_DIRECT_URL=postgresql://postgres:[PASSWORD]@db.your-project-ref.supabase.co:5432/postgres

# Redis Cache
REDIS_URL=rediss://default:[PASSWORD]@redis-host:6379
REDIS_TOKEN=your-redis-token

# Authentication
NEXTAUTH_URL=https://yumzoom.app
NEXTAUTH_SECRET=your-production-nextauth-secret-32-chars-min

# External APIs (Production Keys)
GOOGLE_MAPS_API_KEY=AIza...your-production-key
GOOGLE_PLACES_API_KEY=AIza...your-production-places-key

# Payment Processing
STRIPE_PUBLISHABLE_KEY=pk_live_...your-live-publishable-key
STRIPE_SECRET_KEY=sk_live_...your-live-secret-key
STRIPE_WEBHOOK_SECRET=whsec_...your-webhook-secret

# Email Services
RESEND_API_KEY=re_...your-resend-api-key
SENDGRID_API_KEY=SG....your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yumzoom.app

# Analytics & Monitoring
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
MIXPANEL_TOKEN=your-mixpanel-token
SENTRY_DSN=https://...your-sentry-dsn
SENTRY_ORG=yumzoom
SENTRY_PROJECT=yumzoom-frontend
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# Performance Monitoring
DATADOG_API_KEY=your-datadog-api-key
DATADOG_CLIENT_TOKEN=your-datadog-client-token
NEXT_PUBLIC_DATADOG_APP_ID=your-datadog-app-id

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
NEXT_PUBLIC_ENABLE_GEOLOCATION=true
NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true

# Security
ENCRYPTION_KEY=your-32-character-encryption-key
CSRF_SECRET=your-csrf-secret-key
RATE_LIMIT_SECRET=your-rate-limit-secret

# CDN & Assets
NEXT_PUBLIC_CDN_URL=https://cdn.yumzoom.app
NEXT_PUBLIC_ASSET_PREFIX=https://cdn.yumzoom.app

# Social Auth (if implemented)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
```

### Step 2: Configure Vercel Environment Variables
```bash
# Set environment variables in Vercel
vercel env add NODE_ENV
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add DATABASE_URL
vercel env add REDIS_URL
vercel env add NEXTAUTH_SECRET
vercel env add STRIPE_SECRET_KEY
vercel env add GOOGLE_MAPS_API_KEY
vercel env add RESEND_API_KEY
vercel env add SENTRY_DSN

# Or upload from file
vercel env pull .env.production
```

### Step 3: Environment Variable Security
1. **Never commit production secrets to git**
2. **Use environment-specific values**
3. **Rotate secrets regularly**
4. **Implement secret scanning in CI/CD**
5. **Use least privilege access**

---

## Security Configuration

### Step 1: Content Security Policy
Configure CSP headers in `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' 
        https://maps.googleapis.com 
        https://js.stripe.com 
        https://www.googletagmanager.com;
      style-src 'self' 'unsafe-inline' 
        https://fonts.googleapis.com;
      font-src 'self' 
        https://fonts.gstatic.com;
      img-src 'self' data: blob: 
        https://*.supabase.co 
        https://maps.gstatic.com 
        https://maps.googleapis.com;
      connect-src 'self' 
        https://*.supabase.co 
        https://api.stripe.com 
        wss://*.supabase.co;
      frame-src 'self' 
        https://js.stripe.com;
    `.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)'
  }
];
```

### Step 2: Rate Limiting Configuration
```typescript
// lib/rate-limit.ts production config
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.url === '/api/health';
  }
};
```

### Step 3: CORS Configuration
```typescript
// Configure CORS for production
const corsOptions = {
  origin: [
    'https://yumzoom.app',
    'https://www.yumzoom.app',
    'https://admin.yumzoom.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

---

## Next Steps

Continue with the following deployment documents:

1. **Part 2: Third-Party Integrations** - Configure external services
2. **Part 3: Database Deployment** - Set up production database
3. **Part 4: Application Deployment** - Deploy the application
4. **Part 5: Post-Deployment Verification** - Test and validate deployment

---

## Version Information

- **Deployment Guide Version**: 1.0
- **Target Environment**: Production
- **Platform**: Vercel + Supabase + CloudFlare
- **Last Updated**: August 2025

---

*For deployment assistance, contact our DevOps team at devops@yumzoom.com*
