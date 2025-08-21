'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

// Dynamically import map to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <div className="h-64 bg-gray-200 animate-pulse rounded-lg" /> }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface LocationPickerProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address?: string }) => void;
  initialLocation?: { latitude: number; longitude: number };
  className?: string;
}

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export function LocationPicker({ onLocationSelect, initialLocation, className }: LocationPickerProps) {
  const [isClient, setIsClient] = useState(false);
  const [location, setLocation] = useState<Location | null>(
    initialLocation ? { ...initialLocation } : null
  );
  const [loading, setLoading] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const newLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: 'Current Location'
      };

      setLocation(newLocation);
      onLocationSelect(newLocation);
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Using a simple geocoding approach - in production, you'd use a proper geocoding service
      // For now, we'll simulate some basic location results
      const mockResults = [
        {
          display_name: `${query}, New York, NY`,
          lat: 40.7589 + (Math.random() - 0.5) * 0.1,
          lon: -73.9851 + (Math.random() - 0.5) * 0.1
        },
        {
          display_name: `${query}, Brooklyn, NY`,
          lat: 40.6782 + (Math.random() - 0.5) * 0.1,
          lon: -73.9442 + (Math.random() - 0.5) * 0.1
        }
      ];

      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error searching location:', error);
      setSearchResults([]);
    }
  };

  const handleSearchResultClick = (result: any) => {
    const newLocation = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      address: result.display_name
    };

    setLocation(newLocation);
    onLocationSelect(newLocation);
    setSearchResults([]);
    setSearchAddress(result.display_name);
  };

  if (!isClient) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="h-64 bg-gray-200 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Search */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Search for a location..."
              value={searchAddress}
              onChange={(e) => {
                setSearchAddress(e.target.value);
                searchLocation(e.target.value);
              }}
              className="pr-10"
            />
            <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button
            onClick={getCurrentLocation}
            disabled={loading}
            variant="outline"
            className="px-4"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSearchResultClick(result)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{result.display_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Display */}
      {location && (
        <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
          <MapContainer
            center={[location.latitude, location.longitude]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[location.latitude, location.longitude]}>
              <Popup>
                {location.address || 'Selected Location'}
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

      {/* Location Info */}
      {location && (
        <div className="bg-gray-50 p-3 rounded-md text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="h-4 w-4" />
            <span>{location.address || 'Custom Location'}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!location && (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Search for a location or use your current location</p>
        </div>
      )}
    </div>
  );
}

// Fallback component for when maps can't load
export function LocationPickerFallback({ onLocationSelect, className }: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      onLocationSelect({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: 'Current Location'
      });
      setSearchAddress('Current Location');
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter city, address, or ZIP code..."
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={getCurrentLocation}
          disabled={loading}
          variant="outline"
          className="px-4"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </Button>
      </div>

      {searchAddress && (
        <div className="bg-blue-50 p-3 rounded-md text-sm">
          <div className="flex items-center gap-2 text-blue-700">
            <MapPin className="h-4 w-4" />
            <span>Searching in: {searchAddress}</span>
          </div>
        </div>
      )}

      <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-600">
        <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">Map not available. Enter a location manually above.</p>
      </div>
    </div>
  );
}
