# Deployment Guide

This guide covers deploying the YumZoom application to various platforms.

## Prerequisites

Before deploying, ensure you have:
- A working local development environment
- Supabase project set up and configured
- All environment variables configured
- Code pushed to a Git repository (GitHub recommended)

## Vercel Deployment (Recommended)

Vercel is the recommended platform for deploying Next.js applications.

### Step 1: Prepare Your Repository

1. Push your code to GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/in with your GitHub account
3. Click "New Project"
4. Import your YumZoom repository
5. Configure project settings:
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables

In the Vercel dashboard, add these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Visit your live application at the provided URL

### Step 5: Configure Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Configure DNS settings as instructed
5. Update `NEXT_PUBLIC_APP_URL` environment variable

## Netlify Deployment

### Step 1: Connect Repository

1. Go to [netlify.com](https://netlify.com)
2. Sign up/in and click "New site from Git"
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

### Step 2: Configure Environment Variables

In Netlify dashboard, go to Site Settings > Environment Variables and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://your-netlify-domain.netlify.app
```

### Step 3: Deploy

1. Click "Deploy site"
2. Wait for build completion
3. Test your application

## Railway Deployment

### Step 1: Create Project

1. Go to [railway.app](https://railway.app)
2. Sign up/in and click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your repository

### Step 2: Configure Environment

Add environment variables in Railway dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://your-railway-domain.railway.app
NODE_ENV=production
```

### Step 3: Deploy

Railway will automatically build and deploy your application.

## DigitalOcean App Platform

### Step 1: Create App

1. Go to DigitalOcean control panel
2. Click "Create" > "Apps"
3. Connect your GitHub repository
4. Configure app settings:
   - **Source Directory**: `/` (root)
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`

### Step 2: Environment Variables

Add environment variables in the app settings.

### Step 3: Deploy

Click "Create Resources" to deploy.

## Docker Deployment

### Step 1: Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

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

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Step 2: Build and Run

```bash
# Build image
docker build -t yumzoom-app .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_service_key \
  yumzoom-app
```

## Post-Deployment Configuration

### Update Supabase Settings

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **URL Configuration**
3. Add your production domain to:
   - Site URL
   - Redirect URLs
4. Update any other relevant settings

### Test Your Deployment

1. Visit your deployed application
2. Test user registration and login
3. Try rating menu items
4. Verify all features work correctly
5. Check browser console for any errors

### Monitor Your Application

1. Set up error monitoring (e.g., Sentry)
2. Configure analytics (e.g., Google Analytics)
3. Monitor performance metrics
4. Set up uptime monitoring

## Troubleshooting Common Issues

### Build Failures

- Check Node.js version compatibility
- Verify all dependencies are installed
- Review build logs for specific errors
- Ensure environment variables are set

### Runtime Errors

- Check server logs
- Verify Supabase connection
- Ensure all API endpoints are accessible
- Check CORS settings if needed

### Performance Issues

- Optimize images and assets
- Enable compression
- Configure caching headers
- Monitor database query performance

## Security Checklist

- [ ] Environment variables are secure
- [ ] Supabase RLS policies are enabled
- [ ] HTTPS is configured
- [ ] CORS settings are restrictive
- [ ] Regular security updates are applied
- [ ] Monitoring and alerting are set up

## Maintenance

### Regular Updates

1. Keep dependencies updated
2. Monitor for security vulnerabilities
3. Update Supabase client library
4. Review and optimize database queries

### Backup Strategy

1. Regular database backups via Supabase
2. Code repository backups
3. Configuration and environment variable backups
4. Disaster recovery plan

### Scaling Considerations

- Monitor application performance
- Plan for database scaling
- Consider CDN for static assets
- Implement caching strategies as needed