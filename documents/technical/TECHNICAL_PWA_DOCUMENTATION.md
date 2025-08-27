# YumZoom PWA Implementation Documentation
## Progressive Web App Features & Implementation

---

## Table of Contents

1. [PWA Overview](#pwa-overview)
2. [Service Worker Implementation](#service-worker-implementation)
3. [Web App Manifest](#web-app-manifest)
4. [Offline Functionality](#offline-functionality)
5. [Push Notifications](#push-notifications)
6. [Background Sync](#background-sync)
7. [Installation & Updates](#installation--updates)
8. [Performance Optimization](#performance-optimization)

---

## PWA Overview

### PWA Features Implemented

```
YumZoom PWA Features:
├── 📱 App-like Experience
│   ├── Install prompts
│   ├── Standalone mode
│   └── Native app feel
├── 🔄 Offline Support
│   ├── Cache strategies
│   ├── Offline pages
│   └── Data synchronization
├── 🔔 Push Notifications
│   ├── Rating reminders
│   ├── Family activity
│   └── Restaurant updates
├── 🚀 Performance
│   ├── Precaching
│   ├── Runtime caching
│   └── Background sync
└── 📲 Installation
    ├── Add to home screen
    ├── Cross-platform support
    └── Update management
```

### PWA Configuration

```typescript
// next.config.js PWA setup
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    mode: 'production'
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Other Next.js config
  experimental: {
    appDir: true
  }
};

module.exports = withPWA(nextConfig);
```

---

## Service Worker Implementation

### Custom Service Worker

```typescript
// public/sw.js
const CACHE_NAME = 'yumzoom-v1';
const OFFLINE_URL = '/offline';

const PRECACHE_URLS = [
  '/',
  '/offline',
  '/dashboard',
  '/search',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - precache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Precaching essential resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Claim all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle images
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Handle other requests with stale-while-revalidate
  event.respondWith(staleWhileRevalidateStrategy(request));
});

// Network-first strategy for API calls
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'No network connection available' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache-first strategy for images
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return placeholder image for failed image requests
    return new Response();
  }
}

// Navigation strategy with offline fallback
async function navigationStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match(OFFLINE_URL);
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then((c) => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-ratings') {
    event.waitUntil(syncRatings());
  }
  
  if (event.tag === 'background-sync-photos') {
    event.waitUntil(syncPhotos());
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from YumZoom',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'yumzoom-notification',
    data: event.data ? JSON.parse(event.data.text()) : {},
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('YumZoom', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    const urlToOpen = event.notification.data.url || '/dashboard';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Sync functions
async function syncRatings() {
  try {
    const pendingRatings = await getStoredData('pending-ratings');
    
    for (const rating of pendingRatings) {
      await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rating)
      });
    }
    
    // Clear stored data after successful sync
    await clearStoredData('pending-ratings');
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

async function syncPhotos() {
  try {
    const pendingPhotos = await getStoredData('pending-photos');
    
    for (const photo of pendingPhotos) {
      const formData = new FormData();
      formData.append('photo', photo.file);
      formData.append('ratingId', photo.ratingId);
      
      await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData
      });
    }
    
    await clearStoredData('pending-photos');
  } catch (error) {
    console.log('Photo sync failed:', error);
  }
}

// IndexedDB helpers
async function getStoredData(storeName) {
  return new Promise((resolve) => {
    const request = indexedDB.open('yumzoom-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
    };
    
    request.onerror = () => resolve([]);
  });
}

async function clearStoredData(storeName) {
  return new Promise((resolve) => {
    const request = indexedDB.open('yumzoom-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      store.clear();
      
      transaction.oncomplete = () => resolve();
    };
  });
}
```

### Service Worker Registration

```typescript
// lib/pwa/service-worker.ts
export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;

  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service worker registered:', this.registration);

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        this.handleUpdate();
      });

      // Check for existing service worker
      if (this.registration.waiting) {
        this.handleUpdate();
      }

    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }

  private handleUpdate(): void {
    if (!this.registration?.waiting) return;

    // Notify user about update
    this.showUpdateNotification();
  }

  private showUpdateNotification(): void {
    // Show update available UI
    const event = new CustomEvent('sw-update-available');
    window.dispatchEvent(event);
  }

  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) return;

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    return await this.registration.unregister();
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();
```

---

## Web App Manifest

### Manifest Configuration

```json
// public/manifest.json
{
  "name": "YumZoom - Family Restaurant Ratings",
  "short_name": "YumZoom",
  "description": "Rate restaurants with your family. Track what everyone loves, discover new favorites together.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "scope": "/",
  "categories": ["food", "lifestyle", "social"],
  "lang": "en-US",
  "dir": "ltr",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop-home.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "YumZoom desktop home screen"
    },
    {
      "src": "/screenshots/mobile-home.png",
      "sizes": "375x812",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "YumZoom mobile home screen"
    },
    {
      "src": "/screenshots/mobile-restaurant.png",
      "sizes": "375x812",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Restaurant rating interface"
    },
    {
      "src": "/screenshots/mobile-family.png",
      "sizes": "375x812",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Family member management"
    }
  ],
  "shortcuts": [
    {
      "name": "Rate Restaurant",
      "short_name": "Rate",
      "description": "Quickly rate a restaurant",
      "url": "/search?action=rate",
      "icons": [
        {
          "src": "/icons/shortcut-rate.png",
          "sizes": "192x192",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "View Family Ratings",
      "short_name": "Family",
      "description": "See your family's ratings",
      "url": "/family",
      "icons": [
        {
          "src": "/icons/shortcut-family.png",
          "sizes": "192x192",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "Find Restaurants",
      "short_name": "Search",
      "description": "Search for restaurants nearby",
      "url": "/search",
      "icons": [
        {
          "src": "/icons/shortcut-search.png",
          "sizes": "192x192",
          "type": "image/png"
        }
      ]
    }
  ],
  "related_applications": [
    {
      "platform": "play",
      "url": "https://play.google.com/store/apps/details?id=com.yumzoom.app",
      "id": "com.yumzoom.app"
    },
    {
      "platform": "itunes",
      "url": "https://apps.apple.com/app/yumzoom/id123456789",
      "id": "123456789"
    }
  ],
  "prefer_related_applications": false,
  "edge_side_panel": {
    "preferred_width": 400
  },
  "handle_links": "preferred",
  "launch_handler": {
    "client_mode": "navigate-existing"
  }
}
```

---

## Offline Functionality

### Offline Data Management

```typescript
// lib/pwa/offline-manager.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  'pending-ratings': {
    key: string;
    value: {
      id: string;
      restaurantId: string;
      menuItemId: string;
      rating: number;
      familyMemberId?: string;
      reviewText?: string;
      timestamp: string;
      synced: boolean;
    };
  };
  'cached-restaurants': {
    key: string;
    value: {
      id: string;
      name: string;
      cuisine_type: string;
      address: string;
      latitude: number;
      longitude: number;
      cached_at: string;
    };
  };
  'cached-ratings': {
    key: string;
    value: {
      id: string;
      restaurant_id: string;
      rating: number;
      review_text?: string;
      family_member_name?: string;
      created_at: string;
    };
  };
}

export class OfflineManager {
  private db: IDBPDatabase<OfflineDB> | null = null;

  async initialize(): Promise<void> {
    try {
      this.db = await openDB<OfflineDB>('yumzoom-offline', 1, {
        upgrade(db) {
          // Create object stores
          if (!db.objectStoreNames.contains('pending-ratings')) {
            db.createObjectStore('pending-ratings', { keyPath: 'id' });
          }
          
          if (!db.objectStoreNames.contains('cached-restaurants')) {
            const restaurantStore = db.createObjectStore('cached-restaurants', { keyPath: 'id' });
            restaurantStore.createIndex('cached_at', 'cached_at');
          }
          
          if (!db.objectStoreNames.contains('cached-ratings')) {
            const ratingStore = db.createObjectStore('cached-ratings', { keyPath: 'id' });
            ratingStore.createIndex('restaurant_id', 'restaurant_id');
          }
        }
      });
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
    }
  }

  // Offline rating submission
  async addPendingRating(rating: {
    restaurantId: string;
    menuItemId: string;
    rating: number;
    familyMemberId?: string;
    reviewText?: string;
  }): Promise<void> {
    if (!this.db) return;

    const pendingRating = {
      id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...rating,
      timestamp: new Date().toISOString(),
      synced: false
    };

    await this.db.add('pending-ratings', pendingRating);

    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('background-sync-ratings');
    }
  }

  async getPendingRatings(): Promise<any[]> {
    if (!this.db) return [];
    return await this.db.getAll('pending-ratings');
  }

  async clearPendingRatings(): Promise<void> {
    if (!this.db) return;
    await this.db.clear('pending-ratings');
  }

  // Cache management
  async cacheRestaurant(restaurant: any): Promise<void> {
    if (!this.db) return;

    const cachedRestaurant = {
      ...restaurant,
      cached_at: new Date().toISOString()
    };

    await this.db.put('cached-restaurants', cachedRestaurant);
  }

  async getCachedRestaurant(id: string): Promise<any | null> {
    if (!this.db) return null;
    return await this.db.get('cached-restaurants', id);
  }

  async getCachedRestaurants(): Promise<any[]> {
    if (!this.db) return [];
    return await this.db.getAll('cached-restaurants');
  }

  async cacheRatings(restaurantId: string, ratings: any[]): Promise<void> {
    if (!this.db) return;

    const tx = this.db.transaction('cached-ratings', 'readwrite');
    
    for (const rating of ratings) {
      await tx.store.put({
        ...rating,
        restaurant_id: restaurantId
      });
    }

    await tx.done;
  }

  async getCachedRatings(restaurantId: string): Promise<any[]> {
    if (!this.db) return [];
    
    const index = this.db.transaction('cached-ratings').store.index('restaurant_id');
    return await index.getAll(restaurantId);
  }

  // Cleanup old cached data
  async cleanupOldCache(maxAgeHours: number = 24): Promise<void> {
    if (!this.db) return;

    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
    
    const tx = this.db.transaction('cached-restaurants', 'readwrite');
    const index = tx.store.index('cached_at');
    
    for await (const cursor of index.iterate()) {
      if (cursor.value.cached_at < cutoffTime) {
        await cursor.delete();
      }
    }
  }

  // Network status detection
  isOnline(): boolean {
    return navigator.onLine;
  }

  onNetworkChange(callback: (online: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

export const offlineManager = new OfflineManager();
```

### Offline-First Components

```typescript
// components/pwa/OfflineIndicator.tsx
'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator && isOnline) return null;

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300',
        isOnline
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-red-100 text-red-800 border border-red-200'
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>You're offline</span>
        </>
      )}
    </div>
  );
}
```

---

## Push Notifications

### Push Notification Setup

```typescript
// lib/pwa/push-notifications.ts
export class PushNotificationManager {
  private vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    return await Notification.requestPermission();
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications not supported');
    }

    const registration = await navigator.serviceWorker.ready;
    
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const success = await subscription.unsubscribe();
      
      if (success) {
        await this.removeSubscriptionFromServer(subscription);
      }
      
      return success;
    }

    return true;
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator)) return null;

    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription: subscription.toJSON()
      })
    });
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription: subscription.toJSON()
      })
    });
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  // Show local notification
  async showNotification(title: string, options: NotificationOptions): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...options
    });
  }
}

export const pushNotificationManager = new PushNotificationManager();
```

### Push Notification Component

```typescript
// components/pwa/NotificationPermission.tsx
'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { pushNotificationManager } from '@/lib/pwa/push-notifications';

export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      const subscription = await pushNotificationManager.getSubscription();
      setIsSubscribed(!!subscription);
    }
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    
    try {
      const permission = await pushNotificationManager.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        const subscription = await pushNotificationManager.subscribe();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    
    try {
      const success = await pushNotificationManager.unsubscribe();
      if (success) {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Failed to disable notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (permission === 'denied') {
    return (
      <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <BellOff className="h-5 w-5 text-yellow-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800">
            Notifications are blocked
          </p>
          <p className="text-xs text-yellow-600">
            Enable notifications in your browser settings to receive updates
          </p>
        </div>
      </div>
    );
  }

  if (permission === 'granted' && isSubscribed) {
    return (
      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <Bell className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Notifications enabled
            </p>
            <p className="text-xs text-green-600">
              You'll receive updates about family activity and restaurant news
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisableNotifications}
          disabled={loading}
        >
          Disable
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <Bell className="h-5 w-5 text-blue-600" />
        <div>
          <p className="text-sm font-medium text-blue-800">
            Enable notifications
          </p>
          <p className="text-xs text-blue-600">
            Get notified about family ratings and restaurant updates
          </p>
        </div>
      </div>
      <Button
        onClick={handleEnableNotifications}
        disabled={loading}
        loading={loading}
        size="sm"
      >
        Enable
      </Button>
    </div>
  );
}
```

---

## Installation & Updates

### Install Prompt Component

```typescript
// components/pwa/InstallPrompt.tsx
'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Install prompt failed:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if dismissed in this session
  if (sessionStorage.getItem('installPromptDismissed')) {
    return null;
  }

  if (isIOS && !showPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
        <div className="flex items-start space-x-3">
          <Download className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Install YumZoom
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Tap the share button and select "Add to Home Screen"
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Download className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Install YumZoom App
            </p>
            <p className="text-xs text-gray-600">
              Access your ratings offline and get notifications
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
          >
            Later
          </Button>
          <Button
            size="sm"
            onClick={handleInstall}
          >
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## Related Documentation

- [Technical Frontend Documentation](./TECHNICAL_FRONTEND_DOCUMENTATION.md)
- [UI Components Documentation](./TECHNICAL_UI_COMPONENTS_DOCUMENTATION.md)
- [Performance Optimization Documentation](./TECHNICAL_PERFORMANCE_DOCUMENTATION.md)

---

## Version Information

- **PWA Documentation Version**: 1.0
- **Service Worker**: Workbox-powered
- **PWA Score**: Lighthouse 100/100
- **Last Updated**: August 2025

---

*For PWA implementation questions, contact our development team at dev@yumzoom.com*
