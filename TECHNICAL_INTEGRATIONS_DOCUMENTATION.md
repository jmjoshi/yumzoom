# YumZoom Integrations Documentation
## Third-Party Services, APIs & External System Integration

---

## Table of Contents

1. [Integration Overview](#integration-overview)
2. [Supabase Integration](#supabase-integration)
3. [Authentication Providers](#authentication-providers)
4. [Maps & Location Services](#maps--location-services)
5. [Payment Processing](#payment-processing)
6. [Email & Communication](#email--communication)
7. [Analytics & Monitoring](#analytics--monitoring)
8. [Content Delivery & Storage](#content-delivery--storage)
9. [Social Media Integration](#social-media-integration)
10. [Business Intelligence](#business-intelligence)
11. [Development & Deployment](#development--deployment)
12. [Monitoring & Error Tracking](#monitoring--error-tracking)

---

## Integration Overview

### Integration Architecture

YumZoom follows a microservices-oriented integration approach with centralized configuration management:

```
┌─────────────────────────────────────────────────────────┐
│                     YumZoom Core                        │
│                   Next.js Frontend                      │
├─────────────────────────────────────────────────────────┤
│                  Integration Layer                      │
│  • Service Adapters  • Rate Limiting  • Error Handling  │
├─────────────────────────────────────────────────────────┤
│                External Services                        │
│  • Supabase  • Maps API  • Payment  • Analytics        │
└─────────────────────────────────────────────────────────┘
```

### Integration Principles

1. **Loose Coupling**: Services are independently deployable
2. **Resilience**: Graceful degradation when services are unavailable
3. **Security**: API keys and secrets properly managed
4. **Monitoring**: All integrations are monitored and logged
5. **Scalability**: Integrations designed to handle growth

### Configuration Management

```typescript
// lib/config/integrations.ts
export const integrationConfig = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
  },
  
  maps: {
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!
  },
  
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!,
    hotjarId: process.env.NEXT_PUBLIC_HOTJAR_ID!
  },
  
  communication: {
    resendApiKey: process.env.RESEND_API_KEY!,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID!,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN!
  },
  
  monitoring: {
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN!,
    uptimeRobotApiKey: process.env.UPTIME_ROBOT_API_KEY!
  }
};
```

---

## Supabase Integration

### Database Integration

#### Client Configuration
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Client-side Supabase client
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Server-side Supabase client
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

#### Real-time Subscriptions
```typescript
// lib/supabase/realtime.ts
export class RealtimeService {
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  
  subscribeToRatings(restaurantId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`ratings-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ratings',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        callback
      )
      .subscribe();
    
    this.subscriptions.set(`ratings-${restaurantId}`, channel);
    return channel;
  }
  
  subscribeToFamilyActivity(familyId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`family-${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ratings',
          filter: `family_id=eq.${familyId}`
        },
        callback
      )
      .subscribe();
    
    this.subscriptions.set(`family-${familyId}`, channel);
    return channel;
  }
  
  unsubscribe(key: string) {
    const channel = this.subscriptions.get(key);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(key);
    }
  }
  
  unsubscribeAll() {
    this.subscriptions.forEach((channel, key) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }
}

export const realtimeService = new RealtimeService();
```

#### Storage Integration
```typescript
// lib/supabase/storage.ts
export class StorageService {
  private bucket = 'restaurant-images';
  
  async uploadImage(
    file: File,
    path: string,
    options?: {
      cacheControl?: string;
      contentType?: string;
      upsert?: boolean;
    }
  ) {
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(path, file, {
        cacheControl: options?.cacheControl || '3600',
        contentType: options?.contentType || file.type,
        upsert: options?.upsert || false
      });
    
    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    return this.getPublicUrl(data.path);
  }
  
  async getPublicUrl(path: string): Promise<string> {
    const { data } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
  
  async deleteImage(path: string) {
    const { error } = await supabase.storage
      .from(this.bucket)
      .remove([path]);
    
    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }
  
  async createSignedUrl(path: string, expiresIn: number = 3600) {
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresIn);
    
    if (error) {
      throw new Error(`Signed URL creation failed: ${error.message}`);
    }
    
    return data.signedUrl;
  }
}

export const storageService = new StorageService();
```

### Edge Functions Integration

#### Edge Function for Image Processing
```typescript
// supabase/functions/process-image/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { image_url, transformations } = await req.json();
    
    // Image processing logic
    const processedImageUrl = await processImage(image_url, transformations);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed_url: processedImageUrl 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function processImage(imageUrl: string, transformations: any) {
  // Image processing implementation
  return imageUrl; // Placeholder
}
```

---

## Authentication Providers

### Google OAuth Integration

#### Configuration
```typescript
// lib/auth/google.ts
import { GoogleAuth } from 'google-auth-library';

export class GoogleAuthService {
  private auth: GoogleAuth;
  
  constructor() {
    this.auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL!,
        private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_PROJECT_ID!
      },
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    });
  }
  
  async verifyIdToken(idToken: string) {
    const client = await this.auth.getClient();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID!
    });
    
    return ticket.getPayload();
  }
  
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    
    return { data, error };
  }
}

export const googleAuthService = new GoogleAuthService();
```

### Apple Sign-In Integration

```typescript
// lib/auth/apple.ts
export class AppleAuthService {
  async signInWithApple() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    return { data, error };
  }
  
  async verifyAppleToken(identityToken: string) {
    // Apple token verification logic
    const response = await fetch('https://appleid.apple.com/auth/keys');
    const keys = await response.json();
    
    // JWT verification with Apple's public keys
    // Implementation details...
    
    return { valid: true, payload: {} };
  }
}

export const appleAuthService = new AppleAuthService();
```

---

## Maps & Location Services

### Google Maps Integration

#### Maps API Service
```typescript
// lib/maps/google-maps.ts
export class GoogleMapsService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
  }
  
  async loadGoogleMaps(): Promise<typeof google.maps> {
    if (typeof window.google !== 'undefined') {
      return window.google.maps;
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => resolve(window.google.maps);
      script.onerror = reject;
      
      document.head.appendChild(script);
    });
  }
  
  async geocodeAddress(address: string): Promise<google.maps.GeocoderResult[]> {
    const maps = await this.loadGoogleMaps();
    const geocoder = new maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results) {
          resolve(results);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }
  
  async reverseGeocode(lat: number, lng: number): Promise<google.maps.GeocoderResult[]> {
    const maps = await this.loadGoogleMaps();
    const geocoder = new maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results) {
          resolve(results);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }
  
  async findNearbyRestaurants(location: google.maps.LatLng, radius: number = 5000) {
    const maps = await this.loadGoogleMaps();
    const service = new maps.places.PlacesService(document.createElement('div'));
    
    return new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
      service.nearbySearch({
        location,
        radius,
        type: 'restaurant'
      }, (results, status) => {
        if (status === maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else {
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  }
}

export const googleMapsService = new GoogleMapsService();
```

#### Custom Map Component
```typescript
// components/maps/RestaurantMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { googleMapsService } from '@/lib/maps/google-maps';

interface RestaurantMapProps {
  restaurants: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    rating?: number;
  }>;
  center?: { lat: number; lng: number };
  zoom?: number;
  onRestaurantClick?: (restaurantId: string) => void;
}

export function RestaurantMap({ 
  restaurants, 
  center, 
  zoom = 12,
  onRestaurantClick 
}: RestaurantMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (map) {
      updateMarkers();
    }
  }, [map, restaurants]);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      const maps = await googleMapsService.loadGoogleMaps();
      
      const mapInstance = new maps.Map(mapRef.current, {
        center: center || { lat: 40.7128, lng: -74.0060 }, // Default to NYC
        zoom,
        styles: [
          // Custom map styling
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      setMap(mapInstance);
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  };

  const updateMarkers = async () => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    const maps = await googleMapsService.loadGoogleMaps();
    const newMarkers: google.maps.Marker[] = [];

    restaurants.forEach(restaurant => {
      const marker = new maps.Marker({
        position: { lat: restaurant.latitude, lng: restaurant.longitude },
        map,
        title: restaurant.name,
        icon: {
          url: '/icons/restaurant-marker.svg',
          scaledSize: new maps.Size(40, 40)
        }
      });

      const infoWindow = new maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold">${restaurant.name}</h3>
            ${restaurant.rating ? `<p class="text-sm">Rating: ${restaurant.rating}/10</p>` : ''}
            <button onclick="window.selectRestaurant('${restaurant.id}')" 
                    class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm">
              View Details
            </button>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      const bounds = new maps.LatLngBounds();
      newMarkers.forEach(marker => {
        bounds.extend(marker.getPosition()!);
      });
      map.fitBounds(bounds);
    }
  };

  // Expose function to global scope for InfoWindow buttons
  useEffect(() => {
    (window as any).selectRestaurant = (restaurantId: string) => {
      onRestaurantClick?.(restaurantId);
    };

    return () => {
      delete (window as any).selectRestaurant;
    };
  }, [onRestaurantClick]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full min-h-[400px] rounded-lg"
      style={{ minHeight: '400px' }}
    />
  );
}
```

### Mapbox Integration (Alternative)

```typescript
// lib/maps/mapbox.ts
import mapboxgl from 'mapbox-gl';

export class MapboxService {
  constructor() {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;
  }

  createMap(container: HTMLElement, options: mapboxgl.MapboxOptions) {
    return new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-74.0060, 40.7128], // Default to NYC
      zoom: 12,
      ...options
    });
  }

  async geocode(query: string) {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}`
    );
    
    return response.json();
  }

  async reverseGeocode(lng: number, lat: number) {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
    );
    
    return response.json();
  }
}

export const mapboxService = new MapboxService();
```

---

## Payment Processing

### Stripe Integration

#### Stripe Service
```typescript
// lib/payment/stripe.ts
import Stripe from 'stripe';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    });
  }

  async createCustomer(email: string, name: string) {
    return await this.stripe.customers.create({
      email,
      name
    });
  }

  async createSubscription(customerId: string, priceId: string) {
    return await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent']
    });
  }

  async createPaymentIntent(amount: number, currency: string = 'usd') {
    return await this.stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      automatic_payment_methods: { enabled: true }
    });
  }

  async webhookHandler(rawBody: string, signature: string) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    
    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        endpointSecret
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object);
          break;
      }

      return { received: true };
    } catch (error) {
      console.error('Stripe webhook error:', error);
      throw error;
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    // Update user's premium status
    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert({
        user_id: paymentIntent.metadata.user_id,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'active',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to update subscription:', error);
    }
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    // Handle payment failure
    console.log('Payment failed:', paymentIntent.id);
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    // Handle new subscription
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    // Handle subscription update
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    // Handle subscription cancellation
  }
}

export const stripeService = new StripeService();
```

#### Payment API Route
```typescript
// app/api/payment/create-intent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/payment/stripe';
import { authenticateRequest } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await authenticateRequest(request);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { amount, currency = 'usd' } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripeService.createPaymentIntent(amount, currency);

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });

  } catch (error) {
    console.error('Payment intent creation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}
```

---

## Email & Communication

### Resend Email Integration

#### Email Service
```typescript
// lib/communication/email.ts
import { Resend } from 'resend';

export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY!);
  }

  async sendWelcomeEmail(to: string, userName: string) {
    return await this.resend.emails.send({
      from: 'YumZoom <welcome@yumzoom.com>',
      to,
      subject: 'Welcome to YumZoom!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">Welcome to YumZoom, ${userName}!</h1>
          <p>We're excited to have you join our family-focused restaurant rating community.</p>
          <p>Get started by:</p>
          <ul>
            <li>Adding your family members</li>
            <li>Finding restaurants near you</li>
            <li>Rating your first meal</li>
          </ul>
          <a href="https://yumzoom.com/dashboard" 
             style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Get Started
          </a>
        </div>
      `
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetUrl = `https://yumzoom.com/auth/reset-password?token=${resetToken}`;
    
    return await this.resend.emails.send({
      from: 'YumZoom Security <security@yumzoom.com>',
      to,
      subject: 'Reset Your YumZoom Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #DC2626;">Password Reset Request</h1>
          <p>You requested to reset your YumZoom password. Click the link below to create a new password:</p>
          <a href="${resetUrl}" 
             style="background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
          <p style="margin-top: 20px; color: #6B7280; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
          </p>
        </div>
      `
    });
  }

  async sendWeeklyDigest(to: string, digestData: any) {
    return await this.resend.emails.send({
      from: 'YumZoom Digest <digest@yumzoom.com>',
      to,
      subject: 'Your Weekly YumZoom Digest',
      html: this.generateDigestHTML(digestData)
    });
  }

  async sendRestaurantOwnerNotification(to: string, notification: any) {
    return await this.resend.emails.send({
      from: 'YumZoom Business <business@yumzoom.com>',
      to,
      subject: notification.subject,
      html: this.generateBusinessNotificationHTML(notification)
    });
  }

  private generateDigestHTML(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Your Weekly YumZoom Digest</h1>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2>This Week's Activity</h2>
          <p><strong>${data.ratingsCount}</strong> new ratings from your family</p>
          <p><strong>${data.newRestaurants}</strong> new restaurants discovered</p>
        </div>
        <div style="margin: 20px 0;">
          <h2>Top Rated This Week</h2>
          ${data.topRestaurants?.map((restaurant: any) => `
            <div style="border-left: 4px solid #4F46E5; padding-left: 16px; margin: 12px 0;">
              <h3>${restaurant.name}</h3>
              <p>Average Rating: ${restaurant.rating}/10</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private generateBusinessNotificationHTML(notification: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #059669;">${notification.title}</h1>
        <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${notification.content}
        </div>
        ${notification.actionUrl ? `
          <a href="${notification.actionUrl}" 
             style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            ${notification.actionText || 'View Details'}
          </a>
        ` : ''}
      </div>
    `;
  }
}

export const emailService = new EmailService();
```

### SMS Integration with Twilio

```typescript
// lib/communication/sms.ts
import twilio from 'twilio';

export class SMSService {
  private client: twilio.Twilio;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }

  async sendVerificationCode(to: string, code: string) {
    return await this.client.messages.create({
      body: `Your YumZoom verification code is: ${code}`,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to
    });
  }

  async sendRatingReminder(to: string, restaurantName: string) {
    return await this.client.messages.create({
      body: `Don't forget to rate your experience at ${restaurantName} on YumZoom! 🍽️`,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to
    });
  }

  async sendFamilyInvite(to: string, inviterName: string) {
    return await this.client.messages.create({
      body: `${inviterName} invited you to join their family on YumZoom! Download the app to accept: https://yumzoom.com/download`,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to
    });
  }
}

export const smsService = new SMSService();
```

---

## Analytics & Monitoring

### Google Analytics 4 Integration

```typescript
// lib/analytics/google-analytics.ts
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export class GoogleAnalyticsService {
  private measurementId: string;

  constructor() {
    this.measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!;
  }

  initialize() {
    if (typeof window === 'undefined') return;

    // Load gtag script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize gtag
    window.gtag = window.gtag || function() {
      (window.gtag as any).q = (window.gtag as any).q || [];
      (window.gtag as any).q.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      page_title: document.title,
      page_location: window.location.href
    });
  }

  trackEvent(eventName: string, parameters?: Record<string, any>) {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', eventName, parameters);
  }

  trackPageView(url: string, title?: string) {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('config', this.measurementId, {
      page_title: title,
      page_location: url
    });
  }

  trackUserAction(action: string, category: string, label?: string, value?: number) {
    this.trackEvent(action, {
      event_category: category,
      event_label: label,
      value
    });
  }

  // YumZoom-specific tracking
  trackRatingSubmitted(restaurantId: string, rating: number, familyMemberId?: string) {
    this.trackEvent('rating_submitted', {
      restaurant_id: restaurantId,
      rating_value: rating,
      family_member_id: familyMemberId || 'self'
    });
  }

  trackRestaurantVisit(restaurantId: string, method: 'search' | 'browse' | 'qr_code') {
    this.trackEvent('restaurant_visit', {
      restaurant_id: restaurantId,
      visit_method: method
    });
  }

  trackFamilyMemberAdded(relationship: string, ageRange: string) {
    this.trackEvent('family_member_added', {
      relationship,
      age_range: ageRange
    });
  }

  trackSearchPerformed(query: string, resultsCount: number) {
    this.trackEvent('search', {
      search_term: query,
      results_count: resultsCount
    });
  }
}

export const googleAnalyticsService = new GoogleAnalyticsService();
```

### Custom Analytics Service

```typescript
// lib/analytics/custom-analytics.ts
export class CustomAnalyticsService {
  async trackEvent(eventData: {
    userId?: string;
    sessionId: string;
    event: string;
    properties: Record<string, any>;
    timestamp?: string;
  }) {
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          user_id: eventData.userId,
          session_id: eventData.sessionId,
          event_name: eventData.event,
          event_properties: eventData.properties,
          timestamp: eventData.timestamp || new Date().toISOString()
        });

      if (error) {
        console.error('Analytics tracking failed:', error);
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  async generateUserAnalytics(userId: string, dateRange: { from: string; to: string }) {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', dateRange.from)
      .lte('timestamp', dateRange.to);

    if (error) {
      throw new Error(`Analytics query failed: ${error.message}`);
    }

    return this.processUserAnalytics(data);
  }

  private processUserAnalytics(events: any[]) {
    const analytics = {
      totalEvents: events.length,
      restaurantsVisited: new Set(),
      ratingsSubmitted: 0,
      searchesPerformed: 0,
      averageSessionDuration: 0,
      topRestaurants: [] as Array<{ id: string; visits: number }>
    };

    const restaurantVisits = new Map<string, number>();
    const sessions = new Map<string, { start: number; end: number }>();

    events.forEach(event => {
      // Track restaurant visits
      if (event.event_name === 'restaurant_visit') {
        const restaurantId = event.event_properties.restaurant_id;
        analytics.restaurantsVisited.add(restaurantId);
        restaurantVisits.set(restaurantId, (restaurantVisits.get(restaurantId) || 0) + 1);
      }

      // Count ratings
      if (event.event_name === 'rating_submitted') {
        analytics.ratingsSubmitted++;
      }

      // Count searches
      if (event.event_name === 'search') {
        analytics.searchesPerformed++;
      }

      // Track session duration
      const timestamp = new Date(event.timestamp).getTime();
      const sessionId = event.session_id;
      
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, { start: timestamp, end: timestamp });
      } else {
        const session = sessions.get(sessionId)!;
        session.start = Math.min(session.start, timestamp);
        session.end = Math.max(session.end, timestamp);
      }
    });

    // Calculate average session duration
    const sessionDurations = Array.from(sessions.values()).map(s => s.end - s.start);
    analytics.averageSessionDuration = sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length;

    // Top restaurants
    analytics.topRestaurants = Array.from(restaurantVisits.entries())
      .map(([id, visits]) => ({ id, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

    return analytics;
  }
}

export const customAnalyticsService = new CustomAnalyticsService();
```

---

## Content Delivery & Storage

### Cloudinary Integration (Optional)

```typescript
// lib/storage/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
      api_key: process.env.CLOUDINARY_API_KEY!,
      api_secret: process.env.CLOUDINARY_API_SECRET!
    });
  }

  async uploadImage(
    file: Buffer | string,
    options: {
      folder?: string;
      publicId?: string;
      transformation?: any;
    } = {}
  ) {
    try {
      const result = await cloudinary.uploader.upload(file, {
        folder: options.folder || 'yumzoom',
        public_id: options.publicId,
        transformation: options.transformation,
        resource_type: 'auto'
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height
      };
    } catch (error) {
      throw new Error(`Image upload failed: ${error}`);
    }
  }

  async deleteImage(publicId: string) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new Error(`Image deletion failed: ${error}`);
    }
  }

  generateTransformedUrl(
    publicId: string,
    transformations: Record<string, any>
  ) {
    return cloudinary.url(publicId, transformations);
  }

  // Optimized image URLs for different use cases
  getOptimizedImageUrl(publicId: string, context: 'thumbnail' | 'card' | 'hero' | 'profile') {
    const transformations = {
      thumbnail: { width: 150, height: 150, crop: 'fill', quality: 'auto', format: 'auto' },
      card: { width: 400, height: 300, crop: 'fill', quality: 'auto', format: 'auto' },
      hero: { width: 1200, height: 600, crop: 'fill', quality: 'auto', format: 'auto' },
      profile: { width: 200, height: 200, crop: 'fill', quality: 'auto', format: 'auto', gravity: 'face' }
    };

    return this.generateTransformedUrl(publicId, transformations[context]);
  }
}

export const cloudinaryService = new CloudinaryService();
```

---

## Social Media Integration

### Social Sharing Service

```typescript
// lib/social/sharing.ts
export class SocialSharingService {
  generateShareUrls(content: {
    url: string;
    title: string;
    description: string;
    imageUrl?: string;
  }) {
    const encodedUrl = encodeURIComponent(content.url);
    const encodedTitle = encodeURIComponent(content.title);
    const encodedDescription = encodeURIComponent(content.description);

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
    };
  }

  async shareRating(ratingId: string, platform: string) {
    // Get rating details
    const { data: rating } = await supabase
      .from('ratings')
      .select(`
        *,
        menu_item:menu_items(name),
        restaurant:restaurants(name),
        family_member:family_members(name, relationship)
      `)
      .eq('id', ratingId)
      .single();

    if (!rating) {
      throw new Error('Rating not found');
    }

    const shareContent = {
      url: `https://yumzoom.com/ratings/${ratingId}`,
      title: `${rating.family_member?.name || 'Someone'} rated ${rating.menu_item.name} at ${rating.restaurant.name}`,
      description: `${rating.rating}/10 stars${rating.review_text ? ` - "${rating.review_text}"` : ''}`
    };

    const shareUrls = this.generateShareUrls(shareContent);
    return shareUrls[platform as keyof typeof shareUrls];
  }

  async shareRestaurant(restaurantId: string, platform: string) {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const shareContent = {
      url: `https://yumzoom.com/restaurants/${restaurantId}`,
      title: `Check out ${restaurant.name} on YumZoom`,
      description: `${restaurant.cuisine_type} restaurant with ${restaurant.average_rating}/10 family rating`
    };

    const shareUrls = this.generateShareUrls(shareContent);
    return shareUrls[platform as keyof typeof shareUrls];
  }
}

export const socialSharingService = new SocialSharingService();
```

---

## Development & Deployment

### Vercel Integration

#### Deployment Configuration
```javascript
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

#### Environment Variables
```bash
# Production Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
NEXT_PUBLIC_GA_MEASUREMENT_ID=your-ga-id
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Payment
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Communication
RESEND_API_KEY=your-resend-api-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-phone

# Analytics & Monitoring
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
UPTIME_ROBOT_API_KEY=your-uptime-robot-key

# Security
ENCRYPTION_SECRET_KEY=your-encryption-key
JWT_SECRET=your-jwt-secret
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run lint
        run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Monitoring & Error Tracking

### Sentry Integration

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

export function initializeSentry() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN!,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event, hint) {
      // Filter out non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof TypeError && error.message.includes('Network request failed')) {
          return null; // Don't send network errors
        }
      }
      return event;
    },
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: ['localhost', 'yumzoom.com', /^https:\/\/.*\.supabase\.co/]
      })
    ]
  });
}

export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.withScope(scope => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

export function setUserContext(user: { id: string; email?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email
  });
}
```

### Custom Health Check Service

```typescript
// lib/monitoring/health-check.ts
export class HealthCheckService {
  async performHealthCheck() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkSupabaseAuth(),
      this.checkSupabaseStorage(),
      this.checkExternalServices()
    ]);

    const results = {
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: this.getCheckResult(checks[0]),
        auth: this.getCheckResult(checks[1]),
        storage: this.getCheckResult(checks[2]),
        external: this.getCheckResult(checks[3])
      }
    };

    // Determine overall status
    const failedChecks = Object.values(results.checks).filter(check => check.status === 'fail').length;
    if (failedChecks === 0) {
      results.status = 'healthy';
    } else if (failedChecks <= 1) {
      results.status = 'degraded';
    } else {
      results.status = 'unhealthy';
    }

    return results;
  }

  private async checkDatabase() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id')
        .limit(1);

      if (error) throw error;
      return { status: 'pass', responseTime: Date.now() };
    } catch (error) {
      return { status: 'fail', error: error.message };
    }
  }

  private async checkSupabaseAuth() {
    try {
      const { data, error } = await supabase.auth.getSession();
      return { status: 'pass', responseTime: Date.now() };
    } catch (error) {
      return { status: 'fail', error: error.message };
    }
  }

  private async checkSupabaseStorage() {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      return { status: 'pass', responseTime: Date.now() };
    } catch (error) {
      return { status: 'fail', error: error.message };
    }
  }

  private async checkExternalServices() {
    const services = [
      { name: 'Google Maps', check: () => this.checkGoogleMaps() },
      { name: 'Stripe', check: () => this.checkStripe() },
      { name: 'Resend', check: () => this.checkResend() }
    ];

    const results = await Promise.allSettled(
      services.map(service => service.check())
    );

    const serviceStatus = services.map((service, index) => ({
      name: service.name,
      ...this.getCheckResult(results[index])
    }));

    const failedServices = serviceStatus.filter(s => s.status === 'fail').length;
    return {
      status: failedServices === 0 ? 'pass' : 'fail',
      services: serviceStatus
    };
  }

  private async checkGoogleMaps() {
    // Simple API key validation
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    if (!response.ok) throw new Error('Google Maps API unavailable');
    return { status: 'pass' };
  }

  private async checkStripe() {
    // Check Stripe API
    try {
      const response = await fetch('https://api.stripe.com/v1/account', {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`
        }
      });
      if (!response.ok) throw new Error('Stripe API unavailable');
      return { status: 'pass' };
    } catch (error) {
      throw new Error('Stripe API unavailable');
    }
  }

  private async checkResend() {
    // Check Resend API
    try {
      const response = await fetch('https://api.resend.com/domains', {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`
        }
      });
      if (!response.ok) throw new Error('Resend API unavailable');
      return { status: 'pass' };
    } catch (error) {
      throw new Error('Resend API unavailable');
    }
  }

  private getCheckResult(result: PromiseSettledResult<any>) {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return { status: 'fail', error: result.reason?.message || 'Unknown error' };
    }
  }
}

export const healthCheckService = new HealthCheckService();
```

---

## Related Documentation

- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md)
- [API Documentation](./TECHNICAL_API_DOCUMENTATION.md)
- [Database Documentation](./TECHNICAL_DATABASE_DOCUMENTATION.md)
- [Security Documentation](./TECHNICAL_SECURITY_DOCUMENTATION.md)
- [Frontend Documentation](./TECHNICAL_FRONTEND_DOCUMENTATION.md)

---

## Version Information

- **Integrations Documentation Version**: 1.0
- **Last Updated**: August 2025
- **Integration Count**: 15+ external services
- **Monitoring Status**: Active health checks enabled

---

*For integration support or to add new services, contact our technical team at tech@yumzoom.com*
