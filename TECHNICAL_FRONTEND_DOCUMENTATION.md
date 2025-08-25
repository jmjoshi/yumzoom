# YumZoom Frontend Architecture Documentation
## Next.js 14, React 18 & Component Architecture

---

## Table of Contents

1. [Frontend Overview](#frontend-overview)
2. [Next.js 14 Implementation](#nextjs-14-implementation)
3. [Component Architecture](#component-architecture)
4. [State Management](#state-management)
5. [Routing & Navigation](#routing--navigation)
6. [Styling & UI Framework](#styling--ui-framework)
7. [Performance Optimization](#performance-optimization)
8. [PWA Implementation](#pwa-implementation)

---

## Frontend Overview

### Technology Stack

```
Frontend Technology Stack:
├── Framework: Next.js 14 (App Router)
├── React: 18.2.0 with Concurrent Features
├── TypeScript: 5.1+ for type safety
├── Styling: Tailwind CSS + CSS Modules
├── UI Components: Custom + Radix UI primitives
├── State: React Context + Zustand
├── Forms: React Hook Form + Zod validation
└── PWA: Service Workers + Workbox
```

### Project Structure

```
app/
├── (auth)/                 # Auth route group
│   ├── signin/            # Sign in page
│   ├── signup/            # Sign up page
│   ├── forgot-password/   # Password reset
│   └── layout.tsx         # Auth layout
├── (dashboard)/           # Dashboard route group
│   ├── dashboard/         # Main dashboard
│   ├── family/           # Family management
│   ├── restaurants/      # Restaurant pages
│   └── layout.tsx        # Dashboard layout
├── api/                  # API routes
├── globals.css           # Global styles
├── layout.tsx            # Root layout
└── page.tsx              # Home page

components/
├── ui/                   # Reusable UI components
│   ├── button.tsx
│   ├── input.tsx
│   ├── modal.tsx
│   └── ...
├── forms/                # Form components
├── layouts/              # Layout components
├── restaurant/           # Restaurant-specific components
├── family/               # Family-specific components
└── auth/                 # Authentication components
```

### Architecture Principles

1. **Component Composition**: Build complex UIs from simple, reusable components
2. **Server-First**: Leverage Next.js SSR and RSC for performance
3. **Type Safety**: Full TypeScript coverage with strict mode
4. **Accessibility**: WCAG 2.1 AA compliance throughout
5. **Performance**: Code splitting, lazy loading, and optimization
6. **Mobile-First**: Responsive design with PWA capabilities

---

## Next.js 14 Implementation

### App Router Configuration

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  images: {
    domains: [
      'images.unsplash.com',
      'yumzoom.supabase.co',
      'lh3.googleusercontent.com'
    ],
    formats: ['image/webp', 'image/avif']
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/public/:path*',
        destination: '/api/v1/public/:path*'
      }
    ];
  }
};

module.exports = nextConfig;
```

### Server Components Implementation

```typescript
// app/restaurants/[id]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { RestaurantHeader } from '@/components/restaurant/RestaurantHeader';
import { RestaurantRatings } from '@/components/restaurant/RestaurantRatings';
import { RestaurantMenu } from '@/components/restaurant/RestaurantMenu';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

interface RestaurantPageProps {
  params: { id: string };
  searchParams: { tab?: string };
}

export async function generateMetadata({ params }: RestaurantPageProps) {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, description, cuisine_type')
    .eq('id', params.id)
    .single();

  if (!restaurant) {
    return {
      title: 'Restaurant Not Found - YumZoom'
    };
  }

  return {
    title: `${restaurant.name} - YumZoom`,
    description: restaurant.description || `${restaurant.cuisine_type} restaurant on YumZoom`,
    openGraph: {
      title: restaurant.name,
      description: restaurant.description,
      type: 'website'
    }
  };
}

export default async function RestaurantPage({ params, searchParams }: RestaurantPageProps) {
  const supabase = createServerComponentClient({ cookies });
  
  // Fetch restaurant data on the server
  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select(`
      *,
      menu_items(
        id,
        name,
        description,
        category,
        price,
        is_available
      ),
      restaurant_hours(*),
      restaurant_photos(*)
    `)
    .eq('id', params.id)
    .single();

  if (error || !restaurant) {
    notFound();
  }

  const activeTab = searchParams.tab || 'overview';

  return (
    <div className="min-h-screen bg-gray-50">
      <RestaurantHeader restaurant={restaurant} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <Suspense fallback={<LoadingSkeleton />}>
                <RestaurantOverview restaurant={restaurant} />
              </Suspense>
            )}
            
            {activeTab === 'menu' && (
              <Suspense fallback={<LoadingSkeleton />}>
                <RestaurantMenu menuItems={restaurant.menu_items} />
              </Suspense>
            )}
            
            {activeTab === 'ratings' && (
              <Suspense fallback={<LoadingSkeleton />}>
                <RestaurantRatings restaurantId={restaurant.id} />
              </Suspense>
            )}
          </div>
          
          <div className="lg:col-span-1">
            <RestaurantSidebar restaurant={restaurant} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate static params for popular restaurants
export async function generateStaticParams() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id')
    .eq('is_active', true)
    .order('average_rating', { ascending: false })
    .limit(100);

  return restaurants?.map(restaurant => ({
    id: restaurant.id
  })) || [];
}
```

### Client Components with Hooks

```typescript
// components/restaurant/RestaurantRatingForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/StarRating';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';

const ratingSchema = z.object({
  menuItemId: z.string().min(1, 'Please select a menu item'),
  rating: z.number().min(1).max(10),
  familyMemberId: z.string().optional(),
  reviewText: z.string().max(500).optional(),
  photos: z.array(z.instanceof(File)).max(5).optional()
});

type RatingFormData = z.infer<typeof ratingSchema>;

interface RestaurantRatingFormProps {
  restaurantId: string;
  menuItems: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

export function RestaurantRatingForm({ 
  restaurantId, 
  menuItems, 
  onSuccess 
}: RestaurantRatingFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { familyMembers } = useFamilyMembers();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<RatingFormData>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      rating: 5
    }
  });

  const currentRating = watch('rating');

  const onSubmit = async (data: RatingFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('restaurantId', restaurantId);
      formData.append('menuItemId', data.menuItemId);
      formData.append('rating', data.rating.toString());
      
      if (data.familyMemberId) {
        formData.append('familyMemberId', data.familyMemberId);
      }
      
      if (data.reviewText) {
        formData.append('reviewText', data.reviewText);
      }

      if (data.photos) {
        data.photos.forEach((photo, index) => {
          formData.append(`photo_${index}`, photo);
        });
      }

      const response = await fetch('/api/ratings', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to submit rating');
      }

      startTransition(() => {
        router.refresh();
      });

      onSuccess?.();
      
    } catch (error) {
      console.error('Rating submission error:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Menu Item *
        </label>
        <Select
          {...register('menuItemId')}
          placeholder="Select a menu item"
          error={errors.menuItemId?.message}
        >
          {menuItems.map(item => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating *
        </label>
        <StarRating
          value={currentRating}
          onChange={(rating) => setValue('rating', rating)}
          max={10}
          size="lg"
        />
        <p className="text-sm text-gray-500 mt-1">
          {currentRating}/10 stars
        </p>
      </div>

      {familyMembers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating For
          </label>
          <Select
            {...register('familyMemberId')}
            placeholder="Yourself"
          >
            <option value="">Yourself</option>
            {familyMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.relationship})
              </option>
            ))}
          </Select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Review (Optional)
        </label>
        <Textarea
          {...register('reviewText')}
          placeholder="Share your experience..."
          rows={4}
          error={errors.reviewText?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos (Optional)
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            setValue('photos', files);
          }}
          className="w-full"
        />
        <p className="text-sm text-gray-500 mt-1">
          Upload up to 5 photos
        </p>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || isPending}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Rating'}
      </Button>
    </form>
  );
}
```

### Layout Implementation

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider';
import { PWAProvider } from '@/components/providers/PWAProvider';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'YumZoom - Family Restaurant Ratings',
    template: '%s | YumZoom'
  },
  description: 'Rate restaurants with your family. Track what everyone loves, discover new favorites together.',
  keywords: ['restaurant', 'family', 'ratings', 'food', 'dining'],
  authors: [{ name: 'YumZoom Team' }],
  creator: 'YumZoom',
  publisher: 'YumZoom',
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  metadataBase: new URL('https://yumzoom.com'),
  openGraph: {
    type: 'website',
    siteName: 'YumZoom',
    title: 'YumZoom - Family Restaurant Ratings',
    description: 'Rate restaurants with your family. Track what everyone loves, discover new favorites together.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'YumZoom - Family Restaurant Ratings'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@yumzoom',
    creator: '@yumzoom'
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <AnalyticsProvider>
              <PWAProvider>
                <ToastProvider>
                  <div className="flex min-h-screen flex-col">
                    <Header />
                    <main className="flex-1">
                      {children}
                    </main>
                    <Footer />
                  </div>
                </ToastProvider>
              </PWAProvider>
            </AnalyticsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## Component Architecture

### Design System Components

```typescript
// components/ui/Button.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary'
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
```

### Custom Hooks

```typescript
// hooks/useAuth.ts
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle auth events
        if (event === 'SIGNED_IN') {
          // Track sign in
          console.log('User signed in:', session?.user?.id);
        } else if (event === 'SIGNED_OUT') {
          // Clean up
          console.log('User signed out');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

```typescript
// hooks/useFamilyMembers.ts
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age_range: string;
  dietary_restrictions: string[];
  privacy_level: string;
  created_at: string;
}

export function useFamilyMembers() {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setFamilyMembers([]);
      setLoading(false);
      return;
    }

    const fetchFamilyMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('family_members')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setFamilyMembers(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch family members');
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyMembers();

    // Subscribe to changes
    const subscription = supabase
      .channel('family-members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_members',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setFamilyMembers(prev => [...prev, payload.new as FamilyMember]);
          } else if (payload.eventType === 'UPDATE') {
            setFamilyMembers(prev =>
              prev.map(member =>
                member.id === payload.new.id ? payload.new as FamilyMember : member
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setFamilyMembers(prev =>
              prev.filter(member => member.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const addFamilyMember = async (memberData: Omit<FamilyMember, 'id' | 'created_at'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('family_members')
      .insert({
        ...memberData,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateFamilyMember = async (id: string, updates: Partial<FamilyMember>) => {
    const { data, error } = await supabase
      .from('family_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteFamilyMember = async (id: string) => {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  return {
    familyMembers,
    loading,
    error,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember
  };
}
```

---

## State Management

### Zustand Store Implementation

```typescript
// stores/appStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Restaurant {
  id: string;
  name: string;
  cuisine_type: string;
  address: string;
  latitude: number;
  longitude: number;
  average_rating: number;
}

interface AppState {
  // UI State
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  
  // Search State
  searchQuery: string;
  searchFilters: {
    cuisine: string[];
    priceRange: [number, number];
    rating: number;
    distance: number;
  };
  searchResults: Restaurant[];
  
  // User Preferences
  preferences: {
    defaultView: 'list' | 'map';
    notificationsEnabled: boolean;
    locationSharing: boolean;
  };
  
  // Recent Activity
  recentRestaurants: Restaurant[];
  recentSearches: string[];
}

interface AppActions {
  // UI Actions
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Search Actions
  setSearchQuery: (query: string) => void;
  setSearchFilters: (filters: Partial<AppState['searchFilters']>) => void;
  setSearchResults: (results: Restaurant[]) => void;
  addRecentSearch: (query: string) => void;
  
  // Preferences
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void;
  
  // Recent Activity
  addRecentRestaurant: (restaurant: Restaurant) => void;
  clearRecentActivity: () => void;
}

export const useAppStore = create<AppState & AppActions>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        sidebarOpen: false,
        theme: 'light',
        searchQuery: '',
        searchFilters: {
          cuisine: [],
          priceRange: [0, 100],
          rating: 0,
          distance: 25
        },
        searchResults: [],
        preferences: {
          defaultView: 'list',
          notificationsEnabled: true,
          locationSharing: false
        },
        recentRestaurants: [],
        recentSearches: [],

        // Actions
        toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
        
        setTheme: (theme) => set({ theme }),
        
        setSearchQuery: (searchQuery) => set({ searchQuery }),
        
        setSearchFilters: (filters) => set(state => ({
          searchFilters: { ...state.searchFilters, ...filters }
        })),
        
        setSearchResults: (searchResults) => set({ searchResults }),
        
        addRecentSearch: (query) => set(state => ({
          recentSearches: [
            query,
            ...state.recentSearches.filter(s => s !== query).slice(0, 9)
          ]
        })),
        
        updatePreferences: (preferences) => set(state => ({
          preferences: { ...state.preferences, ...preferences }
        })),
        
        addRecentRestaurant: (restaurant) => set(state => ({
          recentRestaurants: [
            restaurant,
            ...state.recentRestaurants
              .filter(r => r.id !== restaurant.id)
              .slice(0, 9)
          ]
        })),
        
        clearRecentActivity: () => set({
          recentRestaurants: [],
          recentSearches: []
        })
      }),
      {
        name: 'yumzoom-app-storage',
        partialize: (state) => ({
          theme: state.theme,
          preferences: state.preferences,
          recentRestaurants: state.recentRestaurants,
          recentSearches: state.recentSearches
        })
      }
    ),
    { name: 'YumZoom App Store' }
  )
);
```

### React Context for User Data

```typescript
// contexts/UserContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  location?: {
    city: string;
    state: string;
    country: string;
  };
  preferences: {
    email_notifications: boolean;
    push_notifications: boolean;
    privacy_level: 'public' | 'friends' | 'private';
  };
  subscription_tier: 'free' | 'premium' | 'family';
  created_at: string;
  updated_at: string;
}

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) throw new Error('No user or profile');

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const refreshProfile = async () => {
    setLoading(true);
    await fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const value = {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
```

---

## Routing & Navigation

### Dynamic Route Implementation

```typescript
// app/restaurants/[id]/menu/[itemId]/page.tsx
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { MenuItemDetail } from '@/components/restaurant/MenuItemDetail';
import { MenuItemRatings } from '@/components/restaurant/MenuItemRatings';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

interface MenuItemPageProps {
  params: {
    id: string;
    itemId: string;
  };
}

export default async function MenuItemPage({ params }: MenuItemPageProps) {
  const supabase = createServerComponentClient({ cookies });

  const { data: menuItem, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      restaurant:restaurants(id, name, cuisine_type),
      ratings(
        id,
        rating,
        review_text,
        created_at,
        family_member:family_members(name, relationship),
        user:user_profiles(first_name, last_name)
      )
    `)
    .eq('id', params.itemId)
    .eq('restaurant_id', params.id)
    .single();

  if (error || !menuItem) {
    notFound();
  }

  const breadcrumbs = [
    { label: 'Restaurants', href: '/restaurants' },
    { label: menuItem.restaurant.name, href: `/restaurants/${params.id}` },
    { label: 'Menu', href: `/restaurants/${params.id}?tab=menu` },
    { label: menuItem.name, href: '#' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbs} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        <div className="lg:col-span-2">
          <MenuItemDetail menuItem={menuItem} />
        </div>
        
        <div className="lg:col-span-1">
          <MenuItemRatings 
            menuItemId={menuItem.id}
            ratings={menuItem.ratings}
          />
        </div>
      </div>
    </div>
  );
}
```

### Navigation Component

```typescript
// components/layouts/Navigation.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { 
  Home, 
  Search, 
  Heart, 
  Users, 
  Settings,
  Menu,
  X
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Favorites', href: '/favorites', icon: Heart },
  { name: 'Family', href: '/family', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings }
];

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex space-x-8">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className="w-4 h-4 mr-2" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Navigation Button */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-lg border-t z-50">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
```

---

## Related Documentation

- [Technical API Documentation](./TECHNICAL_API_DOCUMENTATION.md)
- [Database Documentation](./TECHNICAL_DATABASE_DOCUMENTATION.md)
- [Security Documentation](./TECHNICAL_SECURITY_DOCUMENTATION.md)
- [Integrations Documentation](./TECHNICAL_INTEGRATIONS_DOCUMENTATION.md)
- [UI Components Documentation](./TECHNICAL_UI_COMPONENTS_DOCUMENTATION.md)

---

## Version Information

- **Frontend Documentation Version**: 1.0
- **Next.js Version**: 14.2.x
- **React Version**: 18.2.x
- **Last Updated**: August 2025

---

*For frontend development questions, contact our development team at dev@yumzoom.com*
