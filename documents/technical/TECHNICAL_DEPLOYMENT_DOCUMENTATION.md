# YumZoom Deployment & DevOps Documentation
## Comprehensive Deployment Strategy & Operations

---

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Environment Configuration](#environment-configuration)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Container Deployment](#container-deployment)
5. [Database Deployment](#database-deployment)
6. [Monitoring & Logging](#monitoring--logging)
7. [Backup & Recovery](#backup--recovery)
8. [Security & Compliance](#security--compliance)

---

## Deployment Overview

### Deployment Architecture

```
YumZoom Deployment Infrastructure:
├── 🌐 Production Environment
│   ├── Vercel (Frontend + API Routes)
│   ├── Supabase (Database + Auth + Storage)
│   ├── CloudFlare (CDN + Security)
│   └── Upstash (Redis Cache)
├── 🧪 Staging Environment
│   ├── Vercel Preview Deployments
│   ├── Supabase Staging Project
│   ├── Test Database Instance
│   └── Staging Redis Instance
├── 👨‍💻 Development Environment
│   ├── Local Next.js Development
│   ├── Local Supabase Instance
│   ├── Docker Compose Setup
│   └── Local Redis (optional)
└── 🔧 Infrastructure Tools
    ├── GitHub Actions (CI/CD)
    ├── Terraform (Infrastructure as Code)
    ├── Sentry (Error Monitoring)
    └── Datadog (Performance Monitoring)
```

### Deployment Strategy

```typescript
// deploy.config.ts
export const deploymentConfig = {
  environments: {
    development: {
      domain: 'localhost:3000',
      database: 'local',
      cache: 'local',
      analytics: false,
      debug: true
    },
    staging: {
      domain: 'staging.yumzoom.app',
      database: 'supabase-staging',
      cache: 'upstash-staging',
      analytics: true,
      debug: true
    },
    production: {
      domain: 'yumzoom.app',
      database: 'supabase-prod',
      cache: 'upstash-prod',
      analytics: true,
      debug: false
    }
  },
  
  features: {
    blueGreen: true,
    rollback: true,
    healthChecks: true,
    monitoring: true,
    backup: true
  },
  
  scaling: {
    autoScale: true,
    minInstances: 2,
    maxInstances: 10,
    targetCPU: 70,
    targetMemory: 80
  }
};
```

---

## Environment Configuration

### Environment Variables

```bash
# .env.production
NODE_ENV=production

# Application
NEXT_PUBLIC_APP_URL=https://yumzoom.app
NEXT_PUBLIC_APP_NAME="YumZoom"
NEXT_PUBLIC_APP_VERSION=1.0.0

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Database
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# Redis Cache
REDIS_URL=rediss://default:[password]@redis.upstash.io:6379
REDIS_TOKEN=your-redis-token

# Authentication
NEXTAUTH_URL=https://yumzoom.app
NEXTAUTH_SECRET=your-nextauth-secret

# External Services
GOOGLE_MAPS_API_KEY=your-google-maps-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-key
STRIPE_SECRET_KEY=sk_live_your-stripe-secret
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Email Service
RESEND_API_KEY=your-resend-key
SENDGRID_API_KEY=your-sendgrid-key

# Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
MIXPANEL_TOKEN=your-mixpanel-token

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
DATADOG_API_KEY=your-datadog-key

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_OFFLINE=true

# Security
ENCRYPTION_KEY=your-encryption-key
CSRF_SECRET=your-csrf-secret
RATE_LIMIT_SECRET=your-rate-limit-secret
```

```bash
# .env.staging
NODE_ENV=staging

# Application
NEXT_PUBLIC_APP_URL=https://staging.yumzoom.app
NEXT_PUBLIC_APP_NAME="YumZoom (Staging)"
NEXT_PUBLIC_APP_VERSION=1.0.0-staging

# Supabase Configuration (Staging)
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key

# External Services (Test Keys)
STRIPE_PUBLISHABLE_KEY=pk_test_your-test-stripe-key
STRIPE_SECRET_KEY=sk_test_your-test-stripe-secret

# Analytics (Test)
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX-TEST
MIXPANEL_TOKEN=your-test-mixpanel-token

# Debug Mode
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_SHOW_DEBUG_INFO=true
```

### Vercel Configuration

```json
// vercel.json
{
  "version": 2,
  "name": "yumzoom",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "functions": {
    "app/api/**": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(self)"
        }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/_next/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/admin",
      "destination": "/admin/dashboard",
      "permanent": false
    }
  ],
  "rewrites": [
    {
      "source": "/api/webhooks/:path*",
      "destination": "/api/webhooks/:path*"
    }
  ]
}
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'

jobs:
  test:
    name: Test & Quality Checks
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
        
      - name: Lint code
        run: npm run lint
        
      - name: Format check
        run: npm run format:check
        
      - name: Unit tests
        run: npm run test:unit
        env:
          NODE_ENV: test
          
      - name: Integration tests
        run: npm run test:integration
        env:
          NODE_ENV: test
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          
      - name: E2E tests
        run: npm run test:e2e
        env:
          NODE_ENV: test
          
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: .next/

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
          
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        
      - name: OWASP ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'https://staging.yumzoom.app'

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.event_name == 'pull_request'
    
    environment:
      name: staging
      url: https://staging.yumzoom.app
      
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Deploy to Vercel (Preview)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./
          
      - name: Run database migrations
        run: |
          npm run db:migrate
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
          
      - name: Seed test data
        run: |
          npm run db:seed:test
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
          
      - name: Health check
        run: |
          curl -f https://staging.yumzoom.app/api/health || exit 1

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.ref == 'refs/heads/main'
    
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
          path: .next/
          
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./
          
      - name: Run production migrations
        run: |
          npm run db:migrate:prod
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
          
      - name: Warm up application
        run: |
          curl -f https://yumzoom.app/api/health
          curl -f https://yumzoom.app/
          curl -f https://yumzoom.app/search
          
      - name: Update Sentry release
        run: |
          npx @sentry/cli releases new ${{ github.sha }}
          npx @sentry/cli releases set-commits ${{ github.sha }} --auto
          npx @sentry/cli releases deploys ${{ github.sha }} new -e production
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: yumzoom
          SENTRY_PROJECT: yumzoom-frontend
          
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()

  performance-test:
    name: Performance Testing
    runs-on: ubuntu-latest
    needs: deploy-production
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
          
      - name: Load testing
        run: |
          npm run test:load
        env:
          TARGET_URL: https://yumzoom.app
```

### Database Migration Pipeline

```yaml
# .github/workflows/migrate.yml
name: Database Migration

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production
      migration_type:
        description: 'Migration type'
        required: true
        type: choice
        options:
          - up
          - down
          - reset

jobs:
  migrate:
    name: Run Database Migration
    runs-on: ubuntu-latest
    
    environment: ${{ github.event.inputs.environment }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Create backup
        if: github.event.inputs.environment == 'production'
        run: |
          npm run db:backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          BACKUP_STORAGE: ${{ secrets.BACKUP_STORAGE }}
          
      - name: Run migration
        run: |
          npm run db:migrate:${{ github.event.inputs.migration_type }}
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          
      - name: Verify migration
        run: |
          npm run db:verify
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          
      - name: Notify completion
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#database'
          text: |
            Database migration completed
            Environment: ${{ github.event.inputs.environment }}
            Type: ${{ github.event.inputs.migration_type }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

---

## Container Deployment

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

### Docker Compose for Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: builder
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/yumzoom
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - db
      - redis
    command: npm run dev

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=yumzoom
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: yumzoom-app
  labels:
    app: yumzoom
spec:
  replicas: 3
  selector:
    matchLabels:
      app: yumzoom
  template:
    metadata:
      labels:
        app: yumzoom
    spec:
      containers:
      - name: yumzoom
        image: yumzoom/app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: yumzoom-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: yumzoom-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: yumzoom-service
spec:
  selector:
    app: yumzoom
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: yumzoom-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - yumzoom.app
    secretName: yumzoom-tls
  rules:
  - host: yumzoom.app
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: yumzoom-service
            port:
              number: 80
```

---

## Database Deployment

### Supabase Configuration

```sql
-- supabase/migrations/001_initial_schema.sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Set up Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'family_manager', 'member');
CREATE TYPE restaurant_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE rating_status AS ENUM ('published', 'draft', 'flagged', 'deleted');

-- Create tables with proper constraints and indexes
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'member',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Add RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Migration Scripts

```typescript
// scripts/migrate.ts
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  const migrationFiles = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    console.log(`📄 Running migration: ${file}`);
    
    const migrationSQL = readFileSync(
      join(migrationsDir, file),
      'utf-8'
    );
    
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: migrationSQL
      });
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ Migration completed: ${file}`);
    } catch (error) {
      console.error(`❌ Migration failed: ${file}`, error);
      process.exit(1);
    }
  }
  
  console.log('🎉 All migrations completed successfully!');
}

async function rollbackMigration(migrationName: string) {
  console.log(`🔄 Rolling back migration: ${migrationName}`);
  
  const rollbackFile = join(
    process.cwd(), 
    'supabase', 
    'rollbacks', 
    `${migrationName}.sql`
  );
  
  try {
    const rollbackSQL = readFileSync(rollbackFile, 'utf-8');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: rollbackSQL
    });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Rollback completed: ${migrationName}`);
  } catch (error) {
    console.error(`❌ Rollback failed: ${migrationName}`, error);
    process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];
const migrationName = process.argv[3];

switch (command) {
  case 'up':
    runMigrations();
    break;
  case 'down':
    if (!migrationName) {
      console.error('Migration name required for rollback');
      process.exit(1);
    }
    rollbackMigration(migrationName);
    break;
  default:
    console.log('Usage: npm run migrate [up|down] [migration-name]');
    process.exit(1);
}
```

---

## Monitoring & Logging

### Application Monitoring

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  
  beforeSend(event, hint) {
    // Filter out known issues
    if (event.exception) {
      const error = hint.originalException;
      
      // Don't report network errors
      if (error?.name === 'NetworkError') {
        return null;
      }
      
      // Don't report cancelled requests
      if (error?.message?.includes('AbortError')) {
        return null;
      }
    }
    
    return event;
  },
  
  beforeSendTransaction(event) {
    // Don't track health check transactions
    if (event.transaction === 'GET /api/health') {
      return null;
    }
    
    return event;
  }
});

export { Sentry };
```

### Performance Monitoring

```typescript
// lib/monitoring/datadog.ts
import { datadogRum } from '@datadog/browser-rum';

if (process.env.NODE_ENV === 'production') {
  datadogRum.init({
    applicationId: process.env.NEXT_PUBLIC_DATADOG_APP_ID!,
    clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN!,
    site: 'datadoghq.com',
    service: 'yumzoom-frontend',
    env: process.env.NODE_ENV,
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    sessionSampleRate: 100,
    premiumSampleRate: 100,
    trackUserInteractions: true,
    defaultPrivacyLevel: 'mask-user-input'
  });
}

export class PerformanceMonitor {
  static trackPageLoad(pageName: string) {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      datadogRum.addTiming('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
      datadogRum.addAttribute('page_name', pageName);
    }
  }
  
  static trackApiCall(endpoint: string, duration: number, status: number) {
    datadogRum.addTiming('api_response_time', duration);
    datadogRum.addAttribute('api_endpoint', endpoint);
    datadogRum.addAttribute('api_status', status);
  }
  
  static trackUserAction(action: string, properties?: Record<string, any>) {
    datadogRum.addAction(action, properties);
  }
}
```

### Logging Configuration

```typescript
// lib/logging/logger.ts
import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'yumzoom-api',
    version: process.env.NEXT_PUBLIC_APP_VERSION
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Add structured logging for production
if (isProduction) {
  // Add cloud logging transport
  logger.add(
    new winston.transports.Http({
      host: 'logs.datadoghq.com',
      path: `/v1/input/${process.env.DATADOG_API_KEY}`,
      ssl: true
    })
  );
}

export class Logger {
  static info(message: string, meta?: any) {
    logger.info(message, meta);
  }
  
  static error(message: string, error?: Error, meta?: any) {
    logger.error(message, { error: error?.message, stack: error?.stack, ...meta });
  }
  
  static warn(message: string, meta?: any) {
    logger.warn(message, meta);
  }
  
  static debug(message: string, meta?: any) {
    logger.debug(message, meta);
  }
  
  static apiRequest(req: any, res: any, duration: number) {
    logger.info('API Request', {
      method: req.method,
      url: req.url,
      status: res.status,
      duration,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
  }
}
```

---

## Related Documentation

- [Technical API Documentation](./TECHNICAL_API_DOCUMENTATION.md)
- [Technical Database Documentation](./TECHNICAL_DATABASE_DOCUMENTATION.md)
- [Technical Security Documentation](./TECHNICAL_SECURITY_DOCUMENTATION.md)
- [Technical Performance Documentation](./TECHNICAL_PERFORMANCE_DOCUMENTATION.md)

---

## Version Information

- **Deployment Documentation Version**: 1.0
- **Platform**: Vercel + Supabase + Upstash
- **CI/CD**: GitHub Actions
- **Last Updated**: August 2025

---

*For deployment questions or infrastructure support, contact our DevOps team at devops@yumzoom.com*
