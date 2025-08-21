'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Location } from './LocationServices';
import { NotificationManager } from './NotificationManager';

interface PWAContextType {
  isOnline: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  location: Location | null;
  showInstallPrompt: boolean;
  notificationPermission: NotificationPermission;
  supportsPWA: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Check online status
    setIsOnline(navigator.onLine);
    
    // Check if installed/standalone
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
      setIsInstalled(isStandaloneMode);
    };
    
    checkStandalone();

    // Check PWA support
    const checkPWASupport = () => {
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasManifest = 'manifest' in document.createElement('link');
      setSupportsPWA(hasServiceWorker && hasManifest);
    };
    
    checkPWASupport();

    // Check device type and orientation
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }

      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };
    
    updateDeviceInfo();

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleResize = updateDeviceInfo;
    const handleOrientationChange = () => {
      setTimeout(updateDeviceInfo, 100); // Delay to ensure dimensions are updated
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Display mode change detection
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      setIsInstalled(e.matches);
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      } else {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  const value: PWAContextType = {
    isOnline,
    isInstalled,
    isStandalone,
    location,
    showInstallPrompt,
    notificationPermission,
    supportsPWA,
    deviceType,
    orientation,
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    // Return default values if context is not available (e.g., during SSR)
    return {
      isOnline: true,
      isInstalled: false,
      isStandalone: false,
      location: null,
      showInstallPrompt: false,
      notificationPermission: 'default' as NotificationPermission,
      supportsPWA: false,
      deviceType: 'desktop' as const,
      orientation: 'portrait' as const,
    };
  }
  return context;
}

// Hook for detecting device capabilities
export function useDeviceCapabilities() {
  const [capabilities, setCapabilities] = useState({
    hasCamera: false,
    hasGeolocation: false,
    hasNotifications: false,
    hasVibration: false,
    hasShare: false,
    hasFileSystem: false,
  });

  useEffect(() => {
    const checkCapabilities = async () => {
      const newCapabilities = {
        hasCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        hasGeolocation: 'geolocation' in navigator,
        hasNotifications: 'Notification' in window,
        hasVibration: 'vibrate' in navigator,
        hasShare: 'share' in navigator,
        hasFileSystem: 'showOpenFilePicker' in window,
      };

      setCapabilities(newCapabilities);
    };

    checkCapabilities();
  }, []);

  return capabilities;
}

// Hook for PWA installation
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setCanInstall(false);
      return true;
    }
    
    return false;
  };

  return { canInstall, install };
}

// Hook for network status with connection info
export function useNetworkStatus() {
  const [networkInfo, setNetworkInfo] = useState({
    isOnline: true,
    effectiveType: '4g',
    downlink: 10,
    saveData: false,
  });

  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      setNetworkInfo({
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType || '4g',
        downlink: connection?.downlink || 10,
        saveData: connection?.saveData || false,
      });
    };

    updateNetworkInfo();

    const handleOnline = () => updateNetworkInfo();
    const handleOffline = () => updateNetworkInfo();
    const handleConnectionChange = () => updateNetworkInfo();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return networkInfo;
}
