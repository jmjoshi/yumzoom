# YumZoom API Documentation
## Complete API Reference & Endpoints

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Core API Endpoints](#core-api-endpoints)
4. [Public API (v1)](#public-api-v1)
5. [Analytics API](#analytics-api)
6. [Business Platform API](#business-platform-api)
7. [Restaurant Owner API](#restaurant-owner-api)
8. [Social Features API](#social-features-api)
9. [Security API](#security-api)
10. [Integration APIs](#integration-apis)
11. [Error Handling](#error-handling)
12. [Rate Limiting](#rate-limiting)

---

## API Overview

### Base URLs
```
Development: http://localhost:3000/api
Production:  https://your-domain.com/api
```

### Response Format
All API responses follow a consistent format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

### HTTP Status Codes
```
200 - OK: Successful request
201 - Created: Resource created successfully
400 - Bad Request: Invalid request data
401 - Unauthorized: Authentication required
403 - Forbidden: Insufficient permissions
404 - Not Found: Resource not found
409 - Conflict: Resource conflict
429 - Too Many Requests: Rate limit exceeded
500 - Internal Server Error: Server error
```

---

## Authentication

### Authentication Methods

#### 1. **Session-based Authentication (Web)**
```javascript
// Client-side authentication
import { supabase } from '@/lib/supabase';

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Get current session
const { data: { session } } = await supabase.auth.getSession();
```

#### 2. **Bearer Token Authentication (API)**
```bash
# API requests with Bearer token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-domain.com/api/v1/restaurants
```

#### 3. **API Key Authentication (Business Platform)**
```bash
# Business platform API with API key
curl -H "X-API-Key: YOUR_API_KEY" \
  -H "X-API-Secret: YOUR_API_SECRET" \
  https://your-domain.com/api/business-platform/analytics
```

### Protected Endpoints
Most endpoints require authentication. Public endpoints are explicitly marked.

---

## Core API Endpoints

### Restaurants

#### Get All Restaurants
```http
GET /api/restaurants
```

**Query Parameters:**
```typescript
{
  search?: string;          // Search by name or cuisine
  cuisine?: string;         // Filter by cuisine type
  latitude?: number;        // User location (latitude)
  longitude?: number;       // User location (longitude)
  radius?: number;          // Search radius in miles
  price_min?: number;       // Minimum price range
  price_max?: number;       // Maximum price range
  rating_min?: number;      // Minimum rating
  page?: number;            // Page number (default: 1)
  limit?: number;           // Results per page (default: 20)
}
```

**Response:**
```typescript
interface RestaurantsResponse {
  success: true;
  data: {
    restaurants: Restaurant[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}
```

#### Get Restaurant by ID
```http
GET /api/restaurants/[id]
```

**Response:**
```typescript
interface RestaurantResponse {
  success: true;
  data: {
    restaurant: Restaurant;
    menu_items: MenuItem[];
    average_rating: number;
    total_reviews: number;
  };
}
```

#### Create Restaurant (Admin Only)
```http
POST /api/restaurants
```

**Request Body:**
```typescript
{
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  cuisine_type?: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  price_range?: number;
  hours?: string;
}
```

### Menu Items

#### Get Menu Items for Restaurant
```http
GET /api/restaurants/[id]/menu-items
```

**Query Parameters:**
```typescript
{
  category?: string;        // Filter by menu category
  price_min?: number;       // Minimum price
  price_max?: number;       // Maximum price
  rating_min?: number;      // Minimum rating
}
```

#### Create Menu Item (Admin Only)
```http
POST /api/restaurants/[id]/menu-items
```

**Request Body:**
```typescript
{
  name: string;
  description?: string;
  price?: number;
  category?: string;
  image_url?: string;
}
```

### Ratings

#### Get User Ratings
```http
GET /api/ratings
```

**Query Parameters:**
```typescript
{
  restaurant_id?: string;   // Filter by restaurant
  family_member_id?: string; // Filter by family member
  page?: number;
  limit?: number;
}
```

#### Create Rating
```http
POST /api/ratings
```

**Request Body:**
```typescript
{
  menu_item_id: string;
  rating: number;           // 1-10 scale
  family_member_id?: string;
  notes?: string;
  review_text?: string;
  photos?: File[];          // Optional photo uploads
}
```

#### Update Rating
```http
PUT /api/ratings/[id]
```

**Request Body:**
```typescript
{
  rating: number;
  notes?: string;
  review_text?: string;
}
```

#### Delete Rating
```http
DELETE /api/ratings/[id]
```

### Family Members

#### Get Family Members
```http
GET /api/family-members
```

#### Create Family Member
```http
POST /api/family-members
```

**Request Body:**
```typescript
{
  name: string;
  relationship: string;
  age_range: 'child' | 'teen' | 'adult';
  date_of_birth?: string;
  dietary_restrictions?: string[];
  allergies?: string[];
  notes?: string;
}
```

#### Update Family Member
```http
PUT /api/family-members/[id]
```

#### Delete Family Member
```http
DELETE /api/family-members/[id]
```

---

## Public API (v1)

### Public Restaurants API
```http
GET /api/v1/restaurants
```

**Authentication:** API Key required

**Headers:**
```
X-API-Key: YOUR_API_KEY
X-API-Secret: YOUR_API_SECRET
```

**Rate Limits:**
- **Basic**: 1,000 requests/hour
- **Professional**: 5,000 requests/hour
- **Enterprise**: 10,000 requests/hour

**Response:**
```typescript
interface PublicApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
    rateLimit: {
      remaining: number;
      reset: number;
    };
  };
}
```

### Public Ratings API
```http
GET /api/v1/restaurants/[id]/ratings
```

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'highest' | 'lowest';
}
```

---

## Analytics API

### Family Analytics
```http
GET /api/analytics
```

**Query Parameters:**
```typescript
{
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  familyMemberId?: string;
}
```

**Response:**
```typescript
interface AnalyticsResponse {
  success: true;
  data: {
    overview: {
      totalRestaurants: number;
      totalRatings: number;
      averageRating: number;
      estimatedSpending: number;
      familyEngagement: number;
    };
    popularRestaurants: Array<{
      restaurant: Restaurant;
      visitCount: number;
      averageRating: number;
      lastVisit: string;
    }>;
    cuisinePreferences: Array<{
      cuisine: string;
      count: number;
      percentage: number;
      averageRating: number;
    }>;
    memberActivity: Array<{
      member: FamilyMember;
      ratingCount: number;
      averageRating: number;
      favoriteRestaurant: Restaurant;
      activityLevel: 'high' | 'medium' | 'low';
    }>;
  };
}
```

### Export Analytics Data
```http
POST /api/analytics/export
```

**Request Body:**
```typescript
{
  format: 'csv' | 'pdf' | 'json';
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  includePhotos?: boolean;
}
```

---

## Business Platform API

### Subscription Management

#### Get Subscription Plans
```http
GET /api/business-platform/subscriptions
```

**Response:**
```typescript
interface SubscriptionPlansResponse {
  success: true;
  data: {
    plans: SubscriptionPlan[];
    currentSubscription?: RestaurantSubscription;
  };
}
```

#### Create Subscription
```http
POST /api/business-platform/subscriptions
```

**Request Body:**
```typescript
{
  restaurant_id: string;
  subscription_plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  payment_method_id: string;
  auto_renew: boolean;
}
```

### Developer API Management

#### Register API Application
```http
POST /api/business-platform/developer-api
```

**Request Body:**
```typescript
{
  name: string;
  description: string;
  developer_email: string;
  developer_organization?: string;
  app_type: 'web' | 'mobile' | 'backend' | 'webhook';
  webhook_url?: string;
  allowed_origins?: string[];
  scopes: string[];
}
```

**Response:**
```typescript
interface ApiApplicationResponse {
  success: true;
  data: {
    application: ApiApplication;
    apiKey: string;
    apiSecret: string;
  };
}
```

---

## Restaurant Owner API

### Owner Verification

#### Submit Verification
```http
POST /api/restaurant-owners/verify
```

**Request Body:**
```typescript
{
  restaurant_name: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  owner_name: string;
  position: string;
  business_license?: File;
  tax_id?: string;
  additional_documents?: File[];
}
```

#### Get Verification Status
```http
GET /api/restaurant-owners/verification-status
```

### Review Responses

#### Create Response to Review
```http
POST /api/restaurant-owners/responses
```

**Request Body:**
```typescript
{
  rating_id: string;
  response_text: string;
}
```

#### Update Response
```http
PUT /api/restaurant-owners/responses
```

**Request Body:**
```typescript
{
  response_id: string;
  response_text: string;
}
```

#### Delete Response
```http
DELETE /api/restaurant-owners/responses
```

**Query Parameters:**
```typescript
{
  response_id: string;
}
```

### Owner Dashboard
```http
GET /api/restaurant-owners/dashboard
```

**Response:**
```typescript
interface OwnerDashboardResponse {
  success: true;
  data: {
    restaurants: Restaurant[];
    analytics: {
      totalReviews: number;
      averageRating: number;
      responseRate: number;
      recentActivity: Activity[];
    };
    recentReviews: Rating[];
    notifications: Notification[];
  };
}
```

---

## Social Features API

### Social Connections

#### Follow Family
```http
POST /api/social/follow
```

**Request Body:**
```typescript
{
  target_user_id: string;
}
```

#### Get Activity Feed
```http
GET /api/social/feed
```

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  activity_type?: string;
}
```

### Family Voting

#### Create Voting Session
```http
POST /api/social/voting-sessions
```

**Request Body:**
```typescript
{
  title: string;
  description?: string;
  session_type: 'restaurant' | 'menu' | 'occasion';
  options: Array<{
    restaurant_id?: string;
    title: string;
    description?: string;
  }>;
  participants: string[];
  deadline: string;
  voting_rules: {
    multiple_choices: boolean;
    anonymous: boolean;
  };
}
```

#### Vote in Session
```http
POST /api/social/voting-sessions/[id]/vote
```

**Request Body:**
```typescript
{
  option_ids: string[];
}
```

---

## Security API

### Two-Factor Authentication

#### Setup 2FA
```http
POST /api/security/two-factor/setup
```

**Response:**
```typescript
interface TwoFactorSetupResponse {
  success: true;
  data: {
    qrCode: string;
    secret: string;
    backupCodes: string[];
  };
}
```

#### Enable 2FA
```http
POST /api/security/two-factor/enable
```

**Request Body:**
```typescript
{
  token: string;
}
```

#### Verify 2FA Token
```http
POST /api/security/two-factor/verify
```

**Request Body:**
```typescript
{
  token: string;
}
```

### Privacy Controls

#### Get Privacy Settings
```http
GET /api/privacy/settings
```

#### Update Privacy Settings
```http
PUT /api/privacy/settings
```

**Request Body:**
```typescript
{
  profile_visibility: 'public' | 'friends' | 'private';
  activity_sharing: boolean;
  photo_sharing: boolean;
  location_sharing: boolean;
  analytics_sharing: boolean;
}
```

#### Export User Data
```http
POST /api/privacy/export
```

**Request Body:**
```typescript
{
  requestType: 'general' | 'ratings' | 'photos' | 'analytics';
}
```

---

## Integration APIs

### Reservation Integration

#### Create Reservation
```http
POST /api/integrations/reservations
```

**Request Body:**
```typescript
{
  restaurant_id: string;
  party_size: number;
  date: string;
  time: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  special_requests?: string;
  preferred_provider?: string;
}
```

### Calendar Integration

#### Sync with Calendar
```http
POST /api/integrations/calendar/sync
```

**Request Body:**
```typescript
{
  provider: 'google' | 'outlook' | 'apple';
  calendar_id: string;
  sync_dining_events: boolean;
  sync_reservations: boolean;
}
```

### Third-Party Platform Integration

#### Connect Social Media
```http
POST /api/integrations/social/connect
```

**Request Body:**
```typescript
{
  platform: 'instagram' | 'facebook' | 'twitter';
  access_token: string;
  auto_share_reviews: boolean;
  auto_share_photos: boolean;
}
```

---

## Error Handling

### Standard Error Responses

#### Validation Error (400)
```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid request data',
    details: {
      field: 'email',
      message: 'Invalid email format'
    }
  }
}
```

#### Authentication Error (401)
```typescript
{
  success: false,
  error: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required'
  }
}
```

#### Authorization Error (403)
```typescript
{
  success: false,
  error: {
    code: 'FORBIDDEN',
    message: 'Insufficient permissions'
  }
}
```

#### Resource Not Found (404)
```typescript
{
  success: false,
  error: {
    code: 'NOT_FOUND',
    message: 'Restaurant not found'
  }
}
```

#### Rate Limit Error (429)
```typescript
{
  success: false,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests',
    details: {
      resetTime: '2025-08-23T15:30:00Z',
      retryAfter: 3600
    }
  }
}
```

---

## Rate Limiting

### Rate Limit Headers
All API responses include rate limiting headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1692804600
X-RateLimit-Window: 3600
```

### Rate Limits by Endpoint Type

#### Public API (v1)
- **Basic Plan**: 1,000 requests/hour
- **Professional Plan**: 5,000 requests/hour
- **Enterprise Plan**: 10,000 requests/hour

#### Authenticated API
- **User Endpoints**: 5,000 requests/hour
- **Admin Endpoints**: 10,000 requests/hour
- **Restaurant Owner**: 2,000 requests/hour

#### File Upload Endpoints
- **Photo Uploads**: 100 uploads/hour
- **Document Uploads**: 50 uploads/hour

### Rate Limit Bypass
Contact support for rate limit increases for legitimate high-volume use cases.

---

## API Versioning

### Version Strategy
- **Current Version**: v1
- **Version Header**: `X-API-Version: v1`
- **URL Versioning**: `/api/v1/endpoint`

### Backward Compatibility
- Minimum 6-month deprecation notice
- Version-specific documentation
- Migration guides for breaking changes

---

## Related Documentation

- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md)
- [Database Schema](./TECHNICAL_DATABASE_DOCUMENTATION.md)
- [Authentication & Security](./TECHNICAL_SECURITY_DOCUMENTATION.md)
- [Frontend Components](./TECHNICAL_FRONTEND_DOCUMENTATION.md)

---

## Version Information

- **API Version**: 1.0
- **Documentation Version**: 1.0
- **Last Updated**: August 2025

---

*For additional API support, contact our developer support team at api-support@yumzoom.com*
