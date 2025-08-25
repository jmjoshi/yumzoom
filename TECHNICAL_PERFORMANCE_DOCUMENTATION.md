# YumZoom Performance & Optimization Documentation
## Comprehensive Performance Strategy & Implementation

---

## Table of Contents

1. [Performance Overview](#performance-overview)
2. [Frontend Performance](#frontend-performance)
3. [Backend Performance](#backend-performance)
4. [Database Optimization](#database-optimization)
5. [Caching Strategies](#caching-strategies)
6. [Image Optimization](#image-optimization)
7. [Bundle Optimization](#bundle-optimization)
8. [Monitoring & Metrics](#monitoring--metrics)

---

## Performance Overview

### Performance Goals

```
YumZoom Performance Targets:
├── 🎯 Core Web Vitals
│   ├── LCP (Largest Contentful Paint): < 2.5s
│   ├── FID (First Input Delay): < 100ms
│   ├── CLS (Cumulative Layout Shift): < 0.1
│   └── FCP (First Contentful Paint): < 1.8s
├── 📱 Mobile Performance
│   ├── Time to Interactive: < 3.5s
│   ├── Speed Index: < 3.0s
│   └── Bundle Size: < 250KB gzipped
├── 🖥️ Desktop Performance
│   ├── Time to Interactive: < 2.0s
│   ├── Speed Index: < 1.5s
│   └── Bundle Size: < 350KB gzipped
└── 🌐 Network Performance
    ├── API Response Time: < 200ms
    ├── Database Queries: < 50ms
    └── CDN Cache Hit Rate: > 95%
```

### Performance Architecture

```typescript
// lib/performance/config.ts
export const performanceConfig = {
  metrics: {
    enabled: true,
    endpoint: '/api/analytics/performance',
    sampleRate: 0.1 // 10% sampling
  },
  
  optimization: {
    lazyLoading: true,
    prefetching: true,
    caching: {
      staticAssets: '1y',
      apiResponses: '5m',
      images: '30d'
    }
  },
  
  monitoring: {
    vitals: ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'],
    thresholds: {
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      FCP: 1800,
      TTFB: 600
    }
  }
};
```

---

## Frontend Performance

### Next.js Optimization

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
    webpackBuildWorker: true
  },
  
  // Image optimization
  images: {
    domains: ['supabase.storage.url', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
    dangerouslyAllowSVG: false
  },
  
  // Compression
  compress: true,
  
  // PWA caching
  swcMinify: true,
  
  // Bundle analysis
  webpack: (config, { dev, isServer }) => {
    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false
        })
      );
    }
    
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      };
    }
    
    return config;
  }
};

module.exports = nextConfig;
```

### Component Performance

```typescript
// components/performance/LazyImage.tsx
import Image from 'next/image';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'blur',
  blurDataURL
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className
        )}
        style={{ width, height }}
      >
        <span className="text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL || generateBlurDataURL(width, height)}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      />
      
      {isLoading && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse"
          style={{ width, height }}
        />
      )}
    </div>
  );
}

function generateBlurDataURL(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
}
```

### Virtual Scrolling

```typescript
// components/performance/VirtualList.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      style={{ height: containerHeight }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualItems.map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            {renderItem(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### React Performance Hooks

```typescript
// hooks/performance/usePerformance.ts
import { useEffect, useCallback } from 'react';
import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';

interface PerformanceMetrics {
  LCP?: number;
  FID?: number;
  CLS?: number;
  FCP?: number;
  TTFB?: number;
}

export function usePerformance() {
  const reportMetric = useCallback((metric: any) => {
    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true
      });
    }

    // Send to custom analytics
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        id: metric.id,
        timestamp: Date.now(),
        url: window.location.href
      })
    }).catch(() => {
      // Fail silently for analytics
    });
  }, []);

  useEffect(() => {
    // Measure Core Web Vitals
    getCLS(reportMetric);
    getFCP(reportMetric);
    getFID(reportMetric);
    getLCP(reportMetric);
    getTTFB(reportMetric);
  }, [reportMetric]);

  const measureCustomMetric = useCallback((name: string, value: number) => {
    reportMetric({
      name,
      value,
      id: `custom-${Date.now()}`
    });
  }, [reportMetric]);

  return { measureCustomMetric };
}
```

---

## Backend Performance

### API Route Optimization

```typescript
// app/api/restaurants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { redis } from '@/lib/redis';
import { rateLimit } from '@/lib/rate-limit';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  cuisine: z.string().optional(),
  location: z.string().optional(),
  sort: z.enum(['rating', 'distance', 'name']).default('rating')
});

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit.check(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const query = querySchema.parse({
      page: url.searchParams.get('page'),
      limit: url.searchParams.get('limit'),
      cuisine: url.searchParams.get('cuisine'),
      location: url.searchParams.get('location'),
      sort: url.searchParams.get('sort')
    });

    // Generate cache key
    const cacheKey = `restaurants:${JSON.stringify(query)}`;
    
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      const responseTime = Date.now() - startTime;
      
      return NextResponse.json({
        ...JSON.parse(cached),
        meta: {
          ...JSON.parse(cached).meta,
          cached: true,
          responseTime
        }
      });
    }

    const supabase = createServerComponentClient({ cookies });
    
    // Build query with optimizations
    let dbQuery = supabase
      .from('restaurants')
      .select(`
        id,
        name,
        cuisine_type,
        address,
        latitude,
        longitude,
        average_rating,
        total_ratings,
        price_range,
        is_family_friendly,
        image_url,
        created_at
      `)
      .eq('is_active', true);

    // Apply filters
    if (query.cuisine) {
      dbQuery = dbQuery.eq('cuisine_type', query.cuisine);
    }

    // Apply sorting
    switch (query.sort) {
      case 'rating':
        dbQuery = dbQuery.order('average_rating', { ascending: false });
        break;
      case 'name':
        dbQuery = dbQuery.order('name', { ascending: true });
        break;
      case 'distance':
        // Requires location parameter
        if (query.location) {
          const [lat, lng] = query.location.split(',').map(Number);
          dbQuery = dbQuery.rpc('nearby_restaurants', {
            lat,
            lng,
            distance_km: 50
          });
        }
        break;
    }

    // Apply pagination
    const offset = (query.page - 1) * query.limit;
    dbQuery = dbQuery.range(offset, offset + query.limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      throw error;
    }

    const response = {
      data: data || [],
      meta: {
        page: query.page,
        limit: query.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / query.limit),
        hasNext: query.page * query.limit < (count || 0),
        hasPrev: query.page > 1,
        cached: false,
        responseTime: Date.now() - startTime
      }
    };

    // Cache the response for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(response));

    return NextResponse.json(response);

  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        meta: {
          responseTime: Date.now() - startTime
        }
      },
      { status: 500 }
    );
  }
}
```

### Response Compression

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { compress } from 'compression';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add compression headers
  if (request.headers.get('accept-encoding')?.includes('gzip')) {
    response.headers.set('Content-Encoding', 'gzip');
  }

  // Add performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  // Cache static assets
  if (request.nextUrl.pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## Database Optimization

### Query Optimization

```sql
-- Database indexes for performance
-- Create indexes for common queries

-- Restaurant search indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine_rating 
ON restaurants(cuisine_type, average_rating DESC) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_restaurants_location 
ON restaurants USING GIST(ST_Point(longitude, latitude)) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_restaurants_family_friendly 
ON restaurants(is_family_friendly, average_rating DESC) 
WHERE is_active = true;

-- Rating indexes
CREATE INDEX IF NOT EXISTS idx_ratings_restaurant_created 
ON ratings(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ratings_user_created 
ON ratings(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ratings_composite 
ON ratings(restaurant_id, menu_item_id, user_id);

-- User profile indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email 
ON user_profiles(email) 
WHERE is_active = true;

-- Family member indexes
CREATE INDEX IF NOT EXISTS idx_family_members_user 
ON family_members(user_id, is_active) 
WHERE is_active = true;

-- Menu item indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant 
ON menu_items(restaurant_id, category, is_available) 
WHERE is_available = true;
```

### Optimized Database Functions

```sql
-- Function for nearby restaurants with performance optimization
CREATE OR REPLACE FUNCTION nearby_restaurants(
  lat DECIMAL,
  lng DECIMAL,
  distance_km INTEGER DEFAULT 10,
  limit_count INTEGER DEFAULT 20
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
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function for restaurant statistics with caching
CREATE OR REPLACE FUNCTION get_restaurant_stats(restaurant_uuid UUID)
RETURNS TABLE (
  total_ratings INTEGER,
  average_rating DECIMAL,
  rating_distribution JSONB,
  recent_ratings_count INTEGER
) AS $$
DECLARE
  cache_key TEXT;
  cached_result RECORD;
BEGIN
  cache_key := 'restaurant_stats_' || restaurant_uuid::TEXT;
  
  -- Check if we have cached results
  SELECT INTO cached_result 
    value, created_at 
  FROM cache_table 
  WHERE key = cache_key 
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  IF FOUND THEN
    -- Return cached result
    RETURN QUERY 
    SELECT 
      (cached_result.value->>'total_ratings')::INTEGER,
      (cached_result.value->>'average_rating')::DECIMAL,
      (cached_result.value->'rating_distribution')::JSONB,
      (cached_result.value->>'recent_ratings_count')::INTEGER;
  ELSE
    -- Calculate fresh statistics
    RETURN QUERY
    WITH stats AS (
      SELECT 
        COUNT(*)::INTEGER as total_ratings,
        ROUND(AVG(rating)::NUMERIC, 2) as average_rating,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END)::INTEGER as recent_ratings_count
      FROM ratings 
      WHERE restaurant_id = restaurant_uuid
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
        WHERE restaurant_id = restaurant_uuid
        GROUP BY rating
        ORDER BY rating
      ) dist
    )
    SELECT 
      s.total_ratings,
      s.average_rating,
      COALESCE(d.rating_distribution, '{}'::JSONB),
      s.recent_ratings_count
    FROM stats s
    CROSS JOIN distribution d;
    
    -- Cache the result
    INSERT INTO cache_table (key, value, created_at)
    VALUES (
      cache_key,
      jsonb_build_object(
        'total_ratings', (SELECT total_ratings FROM stats),
        'average_rating', (SELECT average_rating FROM stats),
        'rating_distribution', (SELECT rating_distribution FROM distribution),
        'recent_ratings_count', (SELECT recent_ratings_count FROM stats)
      ),
      NOW()
    )
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      created_at = EXCLUDED.created_at;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### Connection Pooling

```typescript
// lib/database/pool.ts
import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Connection pool settings
  min: 5,
  max: 20,
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  
  // Performance settings
  statement_timeout: 10000,
  query_timeout: 10000,
  connectionTimeoutMillis: 5000,
  
  // SSL configuration
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
};

export const pool = new Pool(poolConfig);

// Monitor pool health
pool.on('connect', () => {
  console.log('Database pool connected');
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
```

---

## Caching Strategies

### Redis Implementation

```typescript
// lib/redis/client.ts
import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  
  // Performance settings
  retryDelayOnFailover: 100,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
  
  // Connection pool
  family: 4,
  keepAlive: true,
  
  // Timeouts
  connectTimeout: 10000,
  commandTimeout: 5000,
  lazyConnect: true
};

export const redis = new Redis(redisConfig);

// Cache helper functions
export class CacheManager {
  private static prefix = 'yumzoom:';

  static generateKey(...parts: string[]): string {
    return `${this.prefix}${parts.join(':')}`;
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(this.generateKey(key));
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(
    key: string, 
    value: any, 
    ttl: number = 3600
  ): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await redis.setex(this.generateKey(key), ttl, serialized);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  static async del(key: string): Promise<boolean> {
    try {
      await redis.del(this.generateKey(key));
      return true;
    } catch (error) {
      console.error('Cache del error:', error);
      return false;
    }
  }

  static async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(this.generateKey(pattern));
      if (keys.length === 0) return 0;
      
      return await redis.del(...keys);
    } catch (error) {
      console.error('Cache invalidate error:', error);
      return 0;
    }
  }

  // Cache with tags for easy invalidation
  static async setWithTags(
    key: string,
    value: any,
    ttl: number,
    tags: string[]
  ): Promise<boolean> {
    const success = await this.set(key, value, ttl);
    
    if (success) {
      // Store tag associations
      for (const tag of tags) {
        await redis.sadd(this.generateKey(`tag:${tag}`), key);
        await redis.expire(this.generateKey(`tag:${tag}`), ttl + 300);
      }
    }
    
    return success;
  }

  static async invalidateByTag(tag: string): Promise<number> {
    try {
      const tagKey = this.generateKey(`tag:${tag}`);
      const keys = await redis.smembers(tagKey);
      
      if (keys.length === 0) return 0;
      
      // Delete all keys with this tag
      const fullKeys = keys.map(key => this.generateKey(key));
      const deleted = await redis.del(...fullKeys);
      
      // Clean up tag set
      await redis.del(tagKey);
      
      return deleted;
    } catch (error) {
      console.error('Cache invalidate by tag error:', error);
      return 0;
    }
  }
}
```

### Service Worker Caching

```typescript
// public/sw.js - Service Worker Caching Strategy
const CACHE_NAME = 'yumzoom-v1';
const STATIC_CACHE = 'yumzoom-static-v1';
const DYNAMIC_CACHE = 'yumzoom-dynamic-v1';
const API_CACHE = 'yumzoom-api-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline',
  '/_next/static/css',
  '/_next/static/js'
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/restaurants',
  '/api/menu-items',
  '/api/cuisine-types'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Default to network first
  event.respondWith(
    fetch(request).catch(() => 
      caches.match(request).then(response => 
        response || caches.match('/offline')
      )
    )
  );
});

async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isCacheable = CACHEABLE_APIs.some(api => 
    url.pathname.startsWith(api)
  );

  if (!isCacheable) {
    return fetch(request);
  }

  try {
    // Network first for fresh data
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for critical APIs
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This data is not available offline'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleStaticAsset(request) {
  // Cache first for static assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Asset not available offline', { status: 503 });
  }
}

async function handleNavigation(request) {
  try {
    // Network first for navigation
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cached page or offline page
    const cachedResponse = await caches.match(request);
    return cachedResponse || caches.match('/offline');
  }
}
```

---

## Image Optimization

### Next.js Image Component

```typescript
// components/optimized/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  sizes?: string;
  style?: React.CSSProperties;
}

export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  className,
  priority = false,
  quality = 75,
  placeholder = 'blur',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  style
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Generate optimized blur placeholder
  const blurDataURL = `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
    </svg>`
  ).toString('base64')}`;

  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground border border-border rounded",
          className
        )}
        style={{ width, height, ...style }}
      >
        <svg 
          className="w-8 h-8" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        sizes={sizes}
        style={style}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      />
      
      {isLoading && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse rounded"
          style={{ width, height }}
        />
      )}
    </div>
  );
}
```

### Image Processing Service

```typescript
// lib/images/processor.ts
import sharp from 'sharp';

export class ImageProcessor {
  static async optimizeImage(
    buffer: Buffer,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
    } = {}
  ) {
    const {
      width = 800,
      height = 600,
      quality = 80,
      format = 'webp'
    } = options;

    let processor = sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      });

    switch (format) {
      case 'webp':
        processor = processor.webp({ quality });
        break;
      case 'avif':
        processor = processor.avif({ quality });
        break;
      case 'jpeg':
        processor = processor.jpeg({ quality, progressive: true });
        break;
      case 'png':
        processor = processor.png({ quality });
        break;
    }

    return processor.toBuffer();
  }

  static async generateThumbnails(
    buffer: Buffer,
    sizes: number[] = [150, 300, 600, 1200]
  ) {
    const thumbnails = await Promise.all(
      sizes.map(async (size) => {
        const optimized = await this.optimizeImage(buffer, {
          width: size,
          height: Math.round(size * 0.75), // 4:3 aspect ratio
          format: 'webp'
        });

        return {
          size,
          buffer: optimized,
          filename: `thumb_${size}.webp`
        };
      })
    );

    return thumbnails;
  }

  static async generateBlurPlaceholder(buffer: Buffer): Promise<string> {
    const placeholder = await sharp(buffer)
      .resize(20, 15)
      .blur(2)
      .jpeg({ quality: 30 })
      .toBuffer();

    return `data:image/jpeg;base64,${placeholder.toString('base64')}`;
  }
}
```

---

## Related Documentation

- [Technical Frontend Documentation](./TECHNICAL_FRONTEND_DOCUMENTATION.md)
- [Technical PWA Documentation](./TECHNICAL_PWA_DOCUMENTATION.md)
- [Technical API Documentation](./TECHNICAL_API_DOCUMENTATION.md)
- [Technical Database Documentation](./TECHNICAL_DATABASE_DOCUMENTATION.md)

---

## Version Information

- **Performance Documentation Version**: 1.0
- **Optimization Target**: 90+ Lighthouse Score
- **Cache Strategy**: Multi-layer with Redis + Service Worker
- **Last Updated**: August 2025

---

*For performance questions or optimization requests, contact our engineering team at performance@yumzoom.com*
