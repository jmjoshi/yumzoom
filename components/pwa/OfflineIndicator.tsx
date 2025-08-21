'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    // Initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowOfflineMessage(false);
      }, 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isClient || (isOnline && !showOfflineMessage)) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        showOfflineMessage || !isOnline ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div
        className={`${
          isOnline
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
        } px-4 py-2 text-center text-sm font-medium`}
      >
        <div className="flex items-center justify-center space-x-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>You're back online!</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>You're offline. Some features may be limited.</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook to detect online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
