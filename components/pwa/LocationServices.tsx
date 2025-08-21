'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

interface LocationComponentProps {
  onLocationUpdate: (location: Location) => void;
  onError?: (error: string) => void;
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useLocation({
  onLocationUpdate,
  onError,
  enableHighAccuracy = true,
  timeout = 10000,
  maximumAge = 300000, // 5 minutes
}: LocationComponentProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);

  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) return null;
    
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      setPermissionStatus(permission.state);
      return permission.state;
    } catch {
      return null;
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by this browser';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        
        setLocation(newLocation);
        setLoading(false);
        onLocationUpdate(newLocation);
      },
      (error) => {
        let errorMsg = 'Unable to retrieve location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out';
            break;
        }
        
        setError(errorMsg);
        setLoading(false);
        onError?.(errorMsg);
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, onLocationUpdate, onError]);

  const watchLocation = useCallback(() => {
    if (!navigator.geolocation) return null;

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        
        setLocation(newLocation);
        setLoading(false);
        onLocationUpdate(newLocation);
      },
      (error) => {
        let errorMsg = 'Unable to track location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location access denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location unavailable';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out';
            break;
        }
        
        setError(errorMsg);
        setLoading(false);
        onError?.(errorMsg);
      },
      options
    );

    return watchId;
  }, [enableHighAccuracy, timeout, maximumAge, onLocationUpdate, onError]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    location,
    loading,
    error,
    permissionStatus,
    getCurrentLocation,
    watchLocation,
    checkPermission,
  };
}

interface LocationButtonProps {
  onLocationUpdate: (location: Location) => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function LocationButton({
  onLocationUpdate,
  onError,
  className = '',
  children,
}: LocationButtonProps) {
  const { loading, error, getCurrentLocation } = useLocation({
    onLocationUpdate,
    onError,
  });

  return (
    <button
      onClick={getCurrentLocation}
      disabled={loading}
      className={`inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : error ? (
        <AlertCircle className="w-4 h-4" />
      ) : (
        <MapPin className="w-4 h-4" />
      )}
      <span>
        {children || (loading ? 'Getting location...' : error ? 'Location error' : 'Use my location')}
      </span>
    </button>
  );
}

// Utility functions for location-based features
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

// Location permission request component
export function LocationPermissionPrompt({ onAllow, onDeny }: {
  onAllow: () => void;
  onDeny: () => void;
}) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <MapPin className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900">
            Enable Location Services
          </h3>
          <p className="mt-1 text-sm text-blue-700">
            Allow YumZoom to access your location to find restaurants near you and provide personalized recommendations.
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={onAllow}
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700"
            >
              Allow Location
            </button>
            <button
              onClick={onDeny}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
