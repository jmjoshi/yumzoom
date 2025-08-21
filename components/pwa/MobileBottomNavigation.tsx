'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  Heart, 
  Users, 
  User,
  MapPin,
  Star,
  Camera,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePWA } from './PWAProvider';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requireAuth?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
  },
  {
    name: 'Search',
    href: '/restaurants',
    icon: Search,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    requireAuth: true,
  },
  {
    name: 'Favorites',
    href: '/favorites',
    icon: Heart,
    requireAuth: true,
  },
  {
    name: 'Family',
    href: '/family',
    icon: Users,
    requireAuth: true,
  },
];

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { deviceType, isStandalone } = usePWA();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only show on mobile devices and client side
  if (!isClient || deviceType !== 'mobile') {
    return null;
  }

  // Add padding for home indicator on iOS devices in standalone mode
  const paddingBottom = isStandalone ? 'pb-8' : 'pb-4';

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 ${paddingBottom}`}>
      <nav className="flex items-center justify-around py-2">
        {navigationItems.map((item) => {
          // Skip auth-required items if user not logged in
          if (item.requireAuth && !user) {
            return null;
          }

          const isActive = pathname === item.href || 
                          (item.href !== '/' && pathname.startsWith(item.href));
          
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 text-xs transition-colors ${
                isActive
                  ? 'text-amber-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon 
                className={`h-6 w-6 mb-1 ${
                  isActive ? 'text-amber-600' : 'text-gray-500'
                }`} 
              />
              <span className={`text-xs font-medium ${
                isActive ? 'text-amber-600' : 'text-gray-500'
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
        
        {/* Profile/Sign In */}
        {user ? (
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 text-xs transition-colors ${
              pathname === '/dashboard'
                ? 'text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User 
              className={`h-6 w-6 mb-1 ${
                pathname === '/dashboard' ? 'text-amber-600' : 'text-gray-500'
              }`} 
            />
            <span className={`text-xs font-medium ${
              pathname === '/dashboard' ? 'text-amber-600' : 'text-gray-500'
            }`}>
              Profile
            </span>
          </Link>
        ) : (
          <Link
            href="/signin"
            className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 text-xs transition-colors ${
              pathname === '/signin'
                ? 'text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User 
              className={`h-6 w-6 mb-1 ${
                pathname === '/signin' ? 'text-amber-600' : 'text-gray-500'
              }`} 
            />
            <span className={`text-xs font-medium ${
              pathname === '/signin' ? 'text-amber-600' : 'text-gray-500'
            }`}>
              Sign In
            </span>
          </Link>
        )}
      </nav>
    </div>
  );
}

// Floating Action Button for quick actions
export function MobileFloatingActionButton() {
  const { deviceType } = usePWA();
  const { user } = useAuth();

  // Only show on mobile devices when user is logged in
  if (deviceType !== 'mobile' || !user) {
    return null;
  }

  return (
    <Link
      href="/restaurants/quick-review"
      className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-amber-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-amber-700 transition-colors"
    >
      <Camera className="h-6 w-6" />
    </Link>
  );
}

// Component to add bottom padding for mobile navigation
export function MobileNavigationSpacer() {
  const { deviceType, isStandalone } = usePWA();

  // Only add spacing on mobile devices
  if (deviceType !== 'mobile') {
    return null;
  }

  // Add extra padding for home indicator on iOS devices in standalone mode
  const height = isStandalone ? 'h-24' : 'h-20';

  return <div className={height} />;
}
