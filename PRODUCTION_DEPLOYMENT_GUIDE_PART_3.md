# YumZoom Production Deployment Guide - Part 3: Database & Application Deployment
## Database Migration and Application Deployment

---

## Table of Contents

1. [Database Migration & Setup](#database-migration--setup)
2. [Data Seeding & Initial Content](#data-seeding--initial-content)
3. [Application Build & Deployment](#application-build--deployment)
4. [CI/CD Pipeline Configuration](#cicd-pipeline-configuration)
5. [Performance Optimization](#performance-optimization)
6. [Security Hardening](#security-hardening)
7. [Monitoring Setup](#monitoring-setup)
8. [Backup Configuration](#backup-configuration)

---

## Database Migration & Setup

### Step 1: Production Database Schema Migration

#### 1.1 Pre-Migration Checks
```bash
# Verify database connection
npm run db:check-connection

# Validate migration files
npm run db:validate-migrations

# Create backup of existing data (if any)
npm run db:backup:create
```

#### 1.2 Run Production Migrations
```bash
# Set production environment
export NODE_ENV=production
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.your-project-ref.supabase.co:5432/postgres"

# Run database migrations in sequence
npm run db:migrate:production

# Verify migration success
npm run db:verify:schema
```

#### 1.3 Migration Script Implementation
```typescript
// scripts/migrate-production.ts
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runProductionMigrations() {
  console.log('🚀 Starting production database migrations...');
  
  // Create migration tracking table
  await createMigrationTable();
  
  const migrationsDir = join(process.cwd(), 'database', 'migrations');
  const migrationFiles = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const migrationName = file.replace('.sql', '');
    
    // Check if migration already applied
    const { data: existing } = await supabase
      .from('migrations')
      .select('id')
      .eq('name', migrationName)
      .single();
    
    if (existing) {
      console.log(`⏭️  Skipping ${file} (already applied)`);
      continue;
    }
    
    console.log(`📄 Running migration: ${file}`);
    
    try {
      const migrationSQL = readFileSync(join(migrationsDir, file), 'utf-8');
      
      // Execute migration
      const { error } = await supabase.rpc('exec_sql', {
        sql: migrationSQL
      });
      
      if (error) throw error;
      
      // Record successful migration
      await supabase
        .from('migrations')
        .insert({
          name: migrationName,
          executed_at: new Date().toISOString()
        });
      
      console.log(`✅ Migration completed: ${file}`);
      
    } catch (error) {
      console.error(`❌ Migration failed: ${file}`, error);
      
      // Record failed migration
      await supabase
        .from('migrations')
        .insert({
          name: migrationName,
          executed_at: new Date().toISOString(),
          success: false,
          error_message: error.message
        });
      
      throw error;
    }
  }
  
  console.log('🎉 All migrations completed successfully!');
}

async function createMigrationTable() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE NOT NULL,
        success BOOLEAN DEFAULT true,
        error_message TEXT
      );
    `
  });
  
  if (error) {
    console.error('Failed to create migrations table:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runProductionMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
```

### Step 2: Database Performance Optimization

#### 2.1 Create Production Indexes
```sql
-- database/migrations/004_production_indexes.sql

-- User profile performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_email_active 
ON user_profiles(email, is_active) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_created_at 
ON user_profiles(created_at DESC);

-- Restaurant search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_cuisine_rating_active 
ON restaurants(cuisine_type, average_rating DESC, is_active) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_location_active 
ON restaurants USING GIST(ST_Point(longitude, latitude)) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_family_friendly 
ON restaurants(is_family_friendly, average_rating DESC) 
WHERE is_active = true AND is_family_friendly = true;

-- Rating performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_restaurant_created 
ON ratings(restaurant_id, created_at DESC) 
WHERE status = 'published';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_user_created 
ON ratings(user_id, created_at DESC) 
WHERE status = 'published';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_composite_search 
ON ratings(restaurant_id, menu_item_id, user_id, rating) 
WHERE status = 'published';

-- Family member indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_family_members_user_active 
ON family_members(user_id, is_active) 
WHERE is_active = true;

-- Menu item search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_restaurant_category 
ON menu_items(restaurant_id, category, is_available) 
WHERE is_available = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_search_text 
ON menu_items USING gin(to_tsvector('english', name || ' ' || description));

-- Analytics optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_date 
ON user_activity(user_id, activity_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurant_analytics_date 
ON restaurant_analytics(restaurant_id, date DESC);
```

#### 2.2 Database Functions for Performance
```sql
-- database/functions/production_functions.sql

-- Optimized nearby restaurants function
CREATE OR REPLACE FUNCTION nearby_restaurants_optimized(
  lat DECIMAL,
  lng DECIMAL,
  distance_km INTEGER DEFAULT 10,
  cuisine_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  cuisine_type TEXT,
  address TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  average_rating DECIMAL,
  total_ratings INTEGER,
  is_family_friendly BOOLEAN,
  image_url TEXT,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.cuisine_type,
    r.address,
    r.latitude,
    r.longitude,
    r.average_rating,
    r.total_ratings,
    r.is_family_friendly,
    r.image_url,
    (
      6371 * acos(
        cos(radians(lat)) * 
        cos(radians(r.latitude)) * 
        cos(radians(r.longitude) - radians(lng)) + 
        sin(radians(lat)) * 
        sin(radians(r.latitude))
      )
    )::DECIMAL as distance_km
  FROM restaurants r
  WHERE 
    r.is_active = true
    AND (cuisine_filter IS NULL OR r.cuisine_type = cuisine_filter)
    AND (
      6371 * acos(
        cos(radians(lat)) * 
        cos(radians(r.latitude)) * 
        cos(radians(r.longitude) - radians(lng)) + 
        sin(radians(lat)) * 
        sin(radians(r.latitude))
      )
    ) <= distance_km
  ORDER BY distance_km, r.average_rating DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Restaurant statistics with caching
CREATE OR REPLACE FUNCTION get_restaurant_stats_cached(restaurant_uuid UUID)
RETURNS TABLE (
  total_ratings INTEGER,
  average_rating DECIMAL,
  rating_distribution JSONB,
  recent_ratings_count INTEGER,
  family_friendly_rating DECIMAL
) AS $$
DECLARE
  cache_key TEXT;
  cached_result RECORD;
BEGIN
  cache_key := 'restaurant_stats_' || restaurant_uuid::TEXT;
  
  -- Try to get from cache first
  SELECT INTO cached_result 
    data, created_at 
  FROM cache_data 
  WHERE key = cache_key 
    AND created_at > NOW() - INTERVAL '10 minutes';
  
  IF FOUND THEN
    -- Return cached data
    RETURN QUERY 
    SELECT 
      (cached_result.data->>'total_ratings')::INTEGER,
      (cached_result.data->>'average_rating')::DECIMAL,
      (cached_result.data->'rating_distribution')::JSONB,
      (cached_result.data->>'recent_ratings_count')::INTEGER,
      (cached_result.data->>'family_friendly_rating')::DECIMAL;
  ELSE
    -- Calculate fresh statistics and cache them
    RETURN QUERY
    WITH stats AS (
      SELECT 
        COUNT(*)::INTEGER as total_ratings,
        ROUND(AVG(rating)::NUMERIC, 2) as average_rating,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END)::INTEGER as recent_ratings_count,
        ROUND(AVG(CASE WHEN for_family_member IS NOT NULL THEN rating END)::NUMERIC, 2) as family_friendly_rating
      FROM ratings 
      WHERE restaurant_id = restaurant_uuid AND status = 'published'
    ),
    distribution AS (
      SELECT jsonb_object_agg(
        rating::TEXT, 
        count
      ) as rating_distribution
      FROM (
        SELECT 
          rating,
          COUNT(*)::INTEGER as count
        FROM ratings 
        WHERE restaurant_id = restaurant_uuid AND status = 'published'
        GROUP BY rating
        ORDER BY rating
      ) dist
    )
    SELECT 
      s.total_ratings,
      s.average_rating,
      COALESCE(d.rating_distribution, '{}'::JSONB),
      s.recent_ratings_count,
      s.family_friendly_rating
    FROM stats s
    CROSS JOIN distribution d;
    
    -- Cache the results
    INSERT INTO cache_data (key, data, created_at)
    VALUES (
      cache_key,
      jsonb_build_object(
        'total_ratings', (SELECT total_ratings FROM stats),
        'average_rating', (SELECT average_rating FROM stats),
        'rating_distribution', (SELECT rating_distribution FROM distribution),
        'recent_ratings_count', (SELECT recent_ratings_count FROM stats),
        'family_friendly_rating', (SELECT family_friendly_rating FROM stats)
      ),
      NOW()
    )
    ON CONFLICT (key) DO UPDATE SET
      data = EXCLUDED.data,
      created_at = EXCLUDED.created_at;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## Data Seeding & Initial Content

### Step 1: Production Data Seeding

#### 1.1 Restaurant Data Import
```typescript
// scripts/seed-production.ts
import { createClient } from '@supabase/supabase-js';
import restaurantData from '../data/restaurants.json';
import menuData from '../data/menu-items.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedProductionData() {
  console.log('🌱 Starting production data seeding...');
  
  try {
    // Seed restaurants
    await seedRestaurants();
    
    // Seed menu items
    await seedMenuItems();
    
    // Seed sample data (if needed)
    if (process.env.SEED_SAMPLE_DATA === 'true') {
      await seedSampleUsers();
      await seedSampleRatings();
    }
    
    console.log('✅ Production data seeding completed');
    
  } catch (error) {
    console.error('❌ Data seeding failed:', error);
    throw error;
  }
}

async function seedRestaurants() {
  console.log('📍 Seeding restaurants...');
  
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < restaurantData.length; i += batchSize) {
    batches.push(restaurantData.slice(i, i + batchSize));
  }
  
  for (const [index, batch] of batches.entries()) {
    console.log(`Processing restaurant batch ${index + 1}/${batches.length}`);
    
    const { error } = await supabase
      .from('restaurants')
      .upsert(batch, { 
        onConflict: 'external_id',
        ignoreDuplicates: true 
      });
    
    if (error) {
      console.error('Batch insert error:', error);
      throw error;
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`✅ Seeded ${restaurantData.length} restaurants`);
}

async function seedMenuItems() {
  console.log('🍽️ Seeding menu items...');
  
  // Get restaurant IDs for foreign key relationships
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, external_id');
  
  const restaurantMap = new Map(
    restaurants?.map(r => [r.external_id, r.id]) || []
  );
  
  // Process menu items in batches
  const menuItemsWithIds = menuData
    .filter(item => restaurantMap.has(item.restaurant_external_id))
    .map(item => ({
      ...item,
      restaurant_id: restaurantMap.get(item.restaurant_external_id)
    }));
  
  const batchSize = 100;
  for (let i = 0; i < menuItemsWithIds.length; i += batchSize) {
    const batch = menuItemsWithIds.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('menu_items')
      .upsert(batch, { ignoreDuplicates: true });
    
    if (error) {
      console.error('Menu items batch error:', error);
      throw error;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`✅ Seeded ${menuItemsWithIds.length} menu items`);
}
```

#### 1.2 Content Management Setup
```typescript
// scripts/setup-cms-content.ts
async function setupCMSContent() {
  console.log('📝 Setting up CMS content...');
  
  // Create initial pages
  const pages = [
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      content: await readFileSync('./content/privacy-policy.md', 'utf-8'),
      published: true
    },
    {
      slug: 'terms-of-service',
      title: 'Terms of Service',
      content: await readFileSync('./content/terms-of-service.md', 'utf-8'),
      published: true
    },
    {
      slug: 'about',
      title: 'About YumZoom',
      content: await readFileSync('./content/about.md', 'utf-8'),
      published: true
    }
  ];
  
  for (const page of pages) {
    const { error } = await supabase
      .from('cms_pages')
      .upsert(page, { onConflict: 'slug' });
    
    if (error) {
      console.error('CMS page error:', error);
    }
  }
  
  // Create FAQ entries
  const faqs = [
    {
      question: 'How do I rate a restaurant for my family?',
      answer: 'To rate a restaurant for your family, first add family members...',
      category: 'rating',
      order: 1
    },
    // ... more FAQs
  ];
  
  const { error: faqError } = await supabase
    .from('faqs')
    .upsert(faqs, { ignoreDuplicates: true });
  
  if (faqError) {
    console.error('FAQ error:', faqError);
  }
  
  console.log('✅ CMS content setup completed');
}
```

---

## Application Build & Deployment

### Step 1: Production Build Configuration

#### 1.1 Optimize Next.js Configuration
```javascript
// next.config.js - Production optimizations
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  
  // Image optimization
  images: {
    domains: [
      'your-project-ref.supabase.co',
      'maps.googleapis.com',
      'images.unsplash.com'
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  
  // Experimental features for production
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
    webpackBuildWorker: true,
    gzipSize: true
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      }
    ];
  },
  
  // Rewrites for API
  async rewrites() {
    return [
      {
        source: '/api/restaurants/:path*',
        destination: '/api/restaurants/:path*'
      }
    ];
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer, webpack }) => {
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        sideEffects: false,
        usedExports: true,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            }
          }
        }
      };
    }
    
    // Bundle analyzer for production builds
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: isServer 
            ? '../analyze/server.html' 
            : './analyze/client.html'
        })
      );
    }
    
    return config;
  }
};

module.exports = nextConfig;
```

#### 1.2 Build Script Optimization
```json
{
  "scripts": {
    "build": "npm run build:check && next build",
    "build:check": "npm run type-check && npm run lint:check",
    "build:analyze": "ANALYZE=true npm run build",
    "build:production": "NODE_ENV=production npm run build",
    "type-check": "tsc --noEmit",
    "lint:check": "next lint --quiet",
    "postbuild": "npm run generate:sitemap && npm run optimize:images"
  }
}
```

### Step 2: Vercel Deployment Configuration

#### 2.1 Production Deployment
```bash
# Deploy to production
vercel --prod

# Or with custom configuration
vercel --prod --env NODE_ENV=production
```

#### 2.2 Vercel Project Configuration
```json
// vercel.json - Production settings
{
  "version": 2,
  "name": "yumzoom-production",
  "alias": ["yumzoom.app", "www.yumzoom.app"],
  "regions": ["iad1", "sfo1"],
  
  "build": {
    "env": {
      "NODE_ENV": "production",
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    },
    "app/api/webhooks/**/*.ts": {
      "maxDuration": 60,
      "memory": 512
    }
  },
  
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/analytics",
      "schedule": "0 1 * * *"
    }
  ]
}
```

---

## CI/CD Pipeline Configuration

### Step 1: GitHub Actions Production Workflow

```yaml
# .github/workflows/production-deploy.yml
name: Production Deployment

on:
  push:
    branches: [main]
    paths-ignore:
      - 'docs/**'
      - '*.md'

env:
  NODE_VERSION: '18'
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  quality-checks:
    name: Quality Assurance
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Type checking
        run: npm run type-check
        
      - name: ESLint
        run: npm run lint
        
      - name: Format check
        run: npm run format:check
        
      - name: Unit tests
        run: npm run test:unit -- --coverage
        env:
          NODE_ENV: test
          
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          
  security-scan:
    name: Security Scanning
    runs-on: ubuntu-latest
    needs: quality-checks
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
          
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        
  build-and-test:
    name: Build & Integration Tests
    runs-on: ubuntu-latest
    needs: security-scan
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: yumzoom_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          
      - name: Integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/yumzoom_test
          
      - name: E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:3000
          
      - name: Store build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: |
            .next/
            public/
            
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build-and-test
    environment:
      name: production
      url: https://yumzoom.app
      
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-files
          
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
        
      - name: Pull Vercel environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
        
      - name: Build project artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        
      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
        
  database-migration:
    name: Database Migration
    runs-on: ubuntu-latest
    needs: deploy-production
    if: contains(github.event.head_commit.message, '[migrate]')
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run database migrations
        run: npm run db:migrate:production
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          
  post-deployment:
    name: Post-Deployment Tasks
    runs-on: ubuntu-latest
    needs: deploy-production
    
    steps:
      - name: Warm up application
        run: |
          curl -f https://yumzoom.app/api/health
          curl -f https://yumzoom.app/
          curl -f https://yumzoom.app/search
          curl -f https://yumzoom.app/restaurants
          
      - name: Update Sentry release
        run: |
          curl -X POST https://sentry.io/api/0/organizations/yumzoom/releases/ \
            -H "Authorization: Bearer ${{ secrets.SENTRY_AUTH_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "version": "${{ github.sha }}",
              "projects": ["yumzoom-frontend"],
              "dateReleased": "'$(date -u +%Y-%m-%dT%H:%M:%S)'Z"
            }'
            
      - name: Run smoke tests
        run: |
          npx playwright test --config=playwright.smoke.config.ts
        env:
          BASE_URL: https://yumzoom.app
          
      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          message: |
            🚀 Production deployment successful!
            
            Commit: ${{ github.sha }}
            Branch: ${{ github.ref_name }}
            Author: ${{ github.actor }}
            URL: https://yumzoom.app
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: success()
        
      - name: Notify deployment failure
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          channel: '#deployments'
          message: |
            ❌ Production deployment failed!
            
            Commit: ${{ github.sha }}
            Branch: ${{ github.ref_name }}
            Author: ${{ github.actor }}
            
            Check the logs: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: failure()
```

---

## Performance Optimization

### Step 1: CDN and Caching Setup

#### 1.1 CloudFlare Caching Rules
```javascript
// Configure CloudFlare caching via API
const cacheRules = [
  {
    pattern: 'yumzoom.app/_next/static/*',
    cacheTtl: 31536000, // 1 year
    browserTtl: 31536000,
    cacheLevel: 'cache_everything'
  },
  {
    pattern: 'yumzoom.app/api/restaurants*',
    cacheTtl: 300, // 5 minutes
    browserTtl: 300,
    cacheLevel: 'cache_everything'
  },
  {
    pattern: 'yumzoom.app/_next/image*',
    cacheTtl: 2592000, // 30 days
    browserTtl: 2592000,
    cacheLevel: 'cache_everything'
  }
];
```

#### 1.2 Redis Cache Configuration
```typescript
// lib/cache/redis-production.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!, {
  // Production-specific settings
  retryDelayOnFailover: 100,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
  
  // Connection pool settings
  family: 4,
  keepAlive: true,
  
  // Timeouts
  connectTimeout: 10000,
  commandTimeout: 5000,
  lazyConnect: true,
  
  // Memory management
  maxMemoryPolicy: 'allkeys-lru'
});

export class ProductionCacheManager {
  private static readonly TTL = {
    SHORT: 300,      // 5 minutes
    MEDIUM: 1800,    // 30 minutes
    LONG: 3600,      // 1 hour
    VERY_LONG: 86400 // 24 hours
  };

  static async setWithTags(
    key: string,
    value: any,
    ttl: number,
    tags: string[]
  ): Promise<void> {
    const pipeline = redis.pipeline();
    
    // Set the main key
    pipeline.setex(key, ttl, JSON.stringify(value));
    
    // Associate with tags for invalidation
    for (const tag of tags) {
      pipeline.sadd(`tag:${tag}`, key);
      pipeline.expire(`tag:${tag}`, ttl + 300); // Slightly longer TTL
    }
    
    await pipeline.exec();
  }

  static async invalidateByTag(tag: string): Promise<number> {
    const tagKey = `tag:${tag}`;
    const keys = await redis.smembers(tagKey);
    
    if (keys.length === 0) return 0;
    
    const pipeline = redis.pipeline();
    
    // Delete all keys with this tag
    for (const key of keys) {
      pipeline.del(key);
    }
    
    // Clean up the tag set
    pipeline.del(tagKey);
    
    const results = await pipeline.exec();
    return results?.filter(([err, result]) => !err && result === 1).length || 0;
  }
}
```

---

## Security Hardening

### Step 1: Production Security Configuration

#### 1.1 Rate Limiting Implementation
```typescript
// lib/security/rate-limiting.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export class ProductionRateLimit {
  private static readonly WINDOWS = {
    MINUTE: 60,
    HOUR: 3600,
    DAY: 86400
  };

  private static readonly LIMITS = {
    API_PER_MINUTE: 100,
    AUTH_PER_HOUR: 10,
    RATING_PER_DAY: 50,
    SEARCH_PER_MINUTE: 20
  };

  static async checkLimit(
    identifier: string,
    action: string,
    limit: number,
    window: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${action}:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % window);
    const resetTime = windowStart + window;

    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, now - window);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.expire(key, window);

    const results = await pipeline.exec();
    const count = results?.[1]?.[1] as number || 0;

    return {
      allowed: count < limit,
      remaining: Math.max(0, limit - count - 1),
      resetTime
    };
  }

  static async checkAPILimit(ip: string) {
    return this.checkLimit(
      ip,
      'api',
      this.LIMITS.API_PER_MINUTE,
      this.WINDOWS.MINUTE
    );
  }

  static async checkAuthLimit(ip: string) {
    return this.checkLimit(
      ip,
      'auth',
      this.LIMITS.AUTH_PER_HOUR,
      this.WINDOWS.HOUR
    );
  }
}
```

#### 1.2 Input Validation and Sanitization
```typescript
// lib/security/validation.ts
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

export const schemas = {
  rating: z.object({
    restaurant_id: z.string().uuid(),
    menu_item_id: z.string().uuid().optional(),
    rating: z.number().int().min(1).max(10),
    review_text: z.string().max(1000).optional(),
    for_family_member: z.string().uuid().optional()
  }),
  
  restaurant: z.object({
    name: z.string().min(1).max(200),
    cuisine_type: z.string().min(1).max(50),
    address: z.string().min(1).max(500),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }),
  
  search: z.object({
    query: z.string().max(100).optional(),
    cuisine: z.string().max(50).optional(),
    location: z.string().max(100).optional(),
    radius: z.number().min(1).max(50).default(10),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(50).default(20)
  })
};

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: []
  });
}

export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const validated = schema.parse(data);
  
  // Sanitize string fields
  if (typeof validated === 'object' && validated !== null) {
    for (const [key, value] of Object.entries(validated)) {
      if (typeof value === 'string') {
        (validated as any)[key] = sanitizeHtml(value);
      }
    }
  }
  
  return validated;
}
```

---

## Monitoring Setup

### Step 1: Health Check Implementation

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const startTime = Date.now();
  const checks = {
    database: false,
    redis: false,
    external_apis: false
  };

  try {
    // Database health check
    const { data, error } = await supabase
      .from('health_check')
      .select('1')
      .limit(1);
    
    checks.database = !error;

    // Redis health check
    try {
      const redis = new Redis(process.env.REDIS_URL!);
      await redis.ping();
      checks.redis = true;
      redis.disconnect();
    } catch {
      checks.redis = false;
    }

    // External API health checks
    const externalChecks = await Promise.allSettled([
      fetch('https://maps.googleapis.com/maps/api/js?key=' + process.env.GOOGLE_MAPS_API_KEY),
      fetch('https://api.stripe.com/v1/charges', {
        headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }
      })
    ]);

    checks.external_apis = externalChecks.every(
      result => result.status === 'fulfilled'
    );

    const responseTime = Date.now() - startTime;
    const allHealthy = Object.values(checks).every(check => check);

    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      response_time: responseTime,
      checks,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
    }, {
      status: allHealthy ? 200 : 503
    });

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      response_time: Date.now() - startTime,
      error: 'Health check failed',
      checks
    }, {
      status: 503
    });
  }
}
```

---

## Backup Configuration

### Step 1: Automated Database Backups

```typescript
// scripts/backup-production.ts
import { createClient } from '@supabase/supabase-js';
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function createProductionBackup() {
  console.log('📦 Creating production backup...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `yumzoom-backup-${timestamp}`;
  
  try {
    // Create database dump
    const dumpProcess = spawn('pg_dump', [
      process.env.DATABASE_URL!,
      '--no-password',
      '--format=custom',
      '--compress=9',
      '--file', `/tmp/${backupName}.sql`
    ]);
    
    await new Promise((resolve, reject) => {
      dumpProcess.on('close', (code) => {
        if (code === 0) resolve(void 0);
        else reject(new Error(`pg_dump failed with code ${code}`));
      });
    });
    
    // Upload to S3
    const fileBuffer = await fs.readFile(`/tmp/${backupName}.sql`);
    
    await s3.upload({
      Bucket: 'yumzoom-backups',
      Key: `database/${backupName}.sql`,
      Body: fileBuffer,
      StorageClass: 'STANDARD_IA',
      ServerSideEncryption: 'AES256',
      Metadata: {
        timestamp: new Date().toISOString(),
        type: 'database_backup',
        environment: 'production'
      }
    }).promise();
    
    // Clean up local file
    await fs.unlink(`/tmp/${backupName}.sql`);
    
    console.log(`✅ Backup created: ${backupName}`);
    
    // Clean up old backups (keep last 30 days)
    await cleanupOldBackups();
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

async function cleanupOldBackups() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const objects = await s3.listObjectsV2({
    Bucket: 'yumzoom-backups',
    Prefix: 'database/'
  }).promise();
  
  const oldObjects = objects.Contents?.filter(obj => 
    obj.LastModified && obj.LastModified < thirtyDaysAgo
  );
  
  if (oldObjects?.length) {
    await s3.deleteObjects({
      Bucket: 'yumzoom-backups',
      Delete: {
        Objects: oldObjects.map(obj => ({ Key: obj.Key! }))
      }
    }).promise();
    
    console.log(`🗑️  Cleaned up ${oldObjects.length} old backups`);
  }
}

// Schedule via cron or GitHub Actions
if (require.main === module) {
  createProductionBackup()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
```

---

## Next Steps

Continue with the final deployment document:

**Part 4: Post-Deployment Verification & Monitoring** - Complete testing and validation

---

## Version Information

- **Deployment Guide Part 3 Version**: 1.0
- **Database Migration**: Automated with rollback capability
- **Monitoring**: Health checks, performance metrics, error tracking
- **Last Updated**: August 2025

---

*For deployment support, contact our DevOps team at devops@yumzoom.com*
