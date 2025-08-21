'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X } from 'lucide-react';

interface NotificationPermissionPromptProps {
  onAllow: () => void;
  onDeny: () => void;
}

export function NotificationPermissionPrompt({ onAllow, onDeny }: NotificationPermissionPromptProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Bell className="w-6 h-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-900">
            Stay Updated with Notifications
          </h3>
          <p className="mt-1 text-sm text-amber-700">
            Get notified about new restaurants, family activities, and personalized recommendations.
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={onAllow}
              className="text-sm bg-amber-600 text-white px-3 py-1.5 rounded-md hover:bg-amber-700"
            >
              Enable Notifications
            </button>
            <button
              onClick={onDeny}
              className="text-sm text-amber-600 hover:text-amber-700"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    };

    return new Notification(title, defaultOptions);
  };

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
  };
}

interface NotificationButtonProps {
  className?: string;
}

export function NotificationButton({ className = '' }: NotificationButtonProps) {
  const { permission, requestPermission } = useNotifications();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleClick = async () => {
    if (permission === 'granted') {
      // Show notification settings or toggle
      return;
    }

    setIsRequesting(true);
    await requestPermission();
    setIsRequesting(false);
  };

  const getButtonContent = () => {
    switch (permission) {
      case 'granted':
        return {
          icon: <Bell className="w-4 h-4" />,
          text: 'Notifications On',
          bgColor: 'bg-green-600 hover:bg-green-700',
        };
      case 'denied':
        return {
          icon: <BellOff className="w-4 h-4" />,
          text: 'Notifications Blocked',
          bgColor: 'bg-red-600 cursor-not-allowed',
        };
      default:
        return {
          icon: <Bell className="w-4 h-4" />,
          text: isRequesting ? 'Requesting...' : 'Enable Notifications',
          bgColor: 'bg-amber-600 hover:bg-amber-700',
        };
    }
  };

  const { icon, text, bgColor } = getButtonContent();

  return (
    <button
      onClick={handleClick}
      disabled={permission === 'denied' || isRequesting}
      className={`inline-flex items-center space-x-2 px-4 py-2 text-white rounded-md text-sm font-medium ${bgColor} ${className}`}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
}

// Notification manager for different types of notifications
export class NotificationManager {
  private static instance: NotificationManager;
  private permission: NotificationPermission = 'default';

  private constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  showRestaurantNotification(restaurantName: string, message: string) {
    this.showNotification(`${restaurantName}`, {
      body: message,
      icon: '/icons/icon-192x192.png',
      tag: 'restaurant',
      data: { type: 'restaurant', restaurantName },
    });
  }

  showFamilyNotification(title: string, message: string, familyMember?: string) {
    this.showNotification(title, {
      body: message,
      icon: '/icons/icon-192x192.png',
      tag: 'family',
      data: { type: 'family', familyMember },
    });
  }

  showLocationNotification(restaurantName: string, distance: string) {
    this.showNotification(`Restaurant nearby!`, {
      body: `${restaurantName} is just ${distance} away`,
      icon: '/icons/icon-192x192.png',
      tag: 'location',
      data: { type: 'location', restaurantName },
      requireInteraction: true,
    });
  }

  showReviewNotification(restaurantName: string, reviewerName: string) {
    this.showNotification(`New review`, {
      body: `${reviewerName} reviewed ${restaurantName}`,
      icon: '/icons/icon-192x192.png',
      tag: 'review',
      data: { type: 'review', restaurantName, reviewerName },
    });
  }

  private showNotification(title: string, options: NotificationOptions): Notification | null {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      return new Notification(title, options);
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }
}

// Component for managing notification settings
export function NotificationSettings() {
  const { permission, requestPermission } = useNotifications();
  const [settings, setSettings] = useState({
    restaurants: true,
    family: true,
    location: true,
    reviews: true,
  });

  const handlePermissionRequest = async () => {
    await requestPermission();
  };

  const updateSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (permission === 'denied') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <BellOff className="w-5 h-5 text-red-600" />
          <h3 className="text-sm font-medium text-red-900">Notifications Blocked</h3>
        </div>
        <p className="text-sm text-red-700">
          To enable notifications, please allow them in your browser settings.
        </p>
      </div>
    );
  }

  if (permission === 'default') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Bell className="w-5 h-5 text-amber-600" />
          <h3 className="text-sm font-medium text-amber-900">Enable Notifications</h3>
        </div>
        <p className="text-sm text-amber-700 mb-3">
          Get notified about new restaurants, family activities, and updates.
        </p>
        <button
          onClick={handlePermissionRequest}
          className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm hover:bg-amber-700"
        >
          Enable Notifications
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Check className="w-5 h-5 text-green-600" />
        <h3 className="text-sm font-medium text-gray-900">Notifications Enabled</h3>
      </div>

      <div className="space-y-3">
        {Object.entries(settings).map(([key, enabled]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-700 capitalize">
              {key} notifications
            </span>
            <button
              onClick={() => updateSetting(key as keyof typeof settings)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? 'bg-amber-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
