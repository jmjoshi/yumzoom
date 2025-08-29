'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { usePWA } from '@/components/pwa/PWAProvider';
import { PWAInstallButton } from '@/components/pwa/PWAInstallPrompt';
import { NotificationButton } from '@/components/pwa/NotificationManager';
import { useRestaurantOwner } from '@/hooks/useRestaurantOwner';
import NotificationDropdown from '@/components/restaurant/NotificationDropdown';
import { RoleBadge } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/Button';
import { Menu, X, User, LogOut, Settings, Wifi, WifiOff, Smartphone, Bell, Building2, Home, Search, BarChart3, Users as UsersIcon, Star } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { getFilteredNavigation, getFilteredUserMenu } from '@/lib/rbac';
import toast from 'react-hot-toast';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { isOnline, isStandalone, deviceType } = usePWA();
  const { unreadCount } = useRestaurantOwner();
  const router = useRouter();
  
  // Refs for click outside functionality
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }

    if (isUserMenuOpen || isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen, isNotificationOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Successfully signed out');
      setIsUserMenuOpen(false);
      setIsMenuOpen(false);
      router.push(ROUTES.HOME);
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  // Get filtered navigation based on user role
  const navigation = user ? getFilteredNavigation(role) : [
    { name: 'Home', href: ROUTES.HOME },
    { name: 'Restaurants', href: ROUTES.RESTAURANTS },
    { name: 'Advanced Search', href: '/search' },
  ];

  // Get filtered user menu based on user role with proper icons
  const baseUserMenuItems = getFilteredUserMenu(role);
  
  // Add icons to user menu items
  const userMenuItems = baseUserMenuItems.map(item => {
    let icon;
    switch (item.name) {
      case 'Profile':
        icon = User;
        break;
      case 'Gamification':
        icon = Star;
        break;
      case 'Favorites':
        icon = '❤️';
        break;
      case 'Wishlist':
        icon = '📝';
        break;
      case 'Restaurant Owner':
        icon = Building2;
        break;
      case 'Restaurant Analytics':
        icon = BarChart3;
        break;
      case 'Business Dashboard':
        icon = Building2;
        break;
      case 'Privacy':
        icon = '🔒';
        break;
      case 'Settings':
        icon = Settings;
        break;
      default:
        icon = null;
    }
    return { ...item, icon };
  });

  return (
    <nav id="navigation" className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={ROUTES.HOME} className="flex items-center">
              <span className="text-xl font-bold text-primary-600">{APP_NAME}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* PWA Status Indicators */}
            <div className="flex items-center space-x-2">
              {!isOnline && (
                <div className="flex items-center space-x-1 text-red-600 text-xs">
                  <WifiOff className="h-4 w-4" />
                  <span>Offline</span>
                </div>
              )}
              
              {isStandalone && (
                <div className="flex items-center space-x-1 text-green-600 text-xs">
                  <Smartphone className="h-4 w-4" />
                  <span>App Mode</span>
                </div>
              )}
            </div>

            {/* PWA Actions */}
            <div className="flex items-center space-x-2">
              <PWAInstallButton />
              <NotificationButton />
              
              {/* Restaurant Owner Response Notifications */}
              {user && (
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2 text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationDropdown
                    isOpen={isNotificationOpen}
                    onClose={() => setIsNotificationOpen(false)}
                  />
                </div>
              )}
            </div>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                  disabled={roleLoading}
                >
                  <User className="h-5 w-5" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {user.user_metadata?.first_name || user.email?.split('@')[0] || 'User'}
                    </span>
                    {!roleLoading && <RoleBadge className="text-xs" />}
                  </div>
                </button>
                
                {isUserMenuOpen && !roleLoading && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    {userMenuItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-2">
                          {typeof item.icon === 'string' ? (
                            <span className="text-base">{item.icon}</span>
                          ) : item.icon ? (
                            <item.icon className="h-4 w-4" />
                          ) : (
                            <span className="w-4 h-4" />
                          )}
                          <span>{item.name}</span>
                        </div>
                      </Link>
                    ))}
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href={ROUTES.SIGN_IN || '/signin'}>
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href={ROUTES.SIGN_UP || '/signup'}>
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {user ? (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-3">
                  <User className="h-6 w-6 text-gray-400" />
                  <div className="ml-3">
                    <span className="text-base font-medium text-gray-700">
                      {user.user_metadata?.first_name || user.email?.split('@')[0] || 'User'}
                    </span>
                    {!roleLoading && (
                      <div className="mt-1">
                        <RoleBadge />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {!roleLoading && userMenuItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        {typeof item.icon === 'string' ? (
                          <span className="text-base">{item.icon}</span>
                        ) : item.icon ? (
                          <item.icon className="h-4 w-4" />
                        ) : (
                          <span className="w-4 h-4" />
                        )}
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 pb-3 border-t border-gray-200 space-y-2">
                <Link
                  href={ROUTES.SIGN_IN || '/signin'}
                  className="block px-3 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link
                  href={ROUTES.SIGN_UP || '/signup'}
                  className="block px-3 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button size="sm" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}